import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const baseDir    = typeof process.pkg !== 'undefined' ? path.dirname(process.execPath) : __dirname;
dotenv.config({ path: path.join(baseDir, '.env') });
const isProd     = process.env.NODE_ENV === 'production';

const app = express();
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════
// DATABASE — SQLite via better-sqlite3
// All data is saved to disk. Server restarts never lose data.
// ═══════════════════════════════════════════════════════════════
const db = new Database(path.join(baseDir, 'litro_gas.db'));
db.pragma('journal_mode = WAL');   // Better concurrent read performance
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS bay_states (
    id              INTEGER PRIMARY KEY,
    type            TEXT    NOT NULL,
    status          TEXT    NOT NULL DEFAULT 'Free',
    supervisor_id   TEXT,
    lorry_plate     TEXT,
    target_count    INTEGER NOT NULL DEFAULT 0,
    current_count   INTEGER NOT NULL DEFAULT 0,
    started_at      INTEGER,
    session_errors  TEXT    NOT NULL DEFAULT '[]',
    last_completed  TEXT,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS queue_items (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    bay_id        INTEGER NOT NULL,
    job_id        INTEGER NOT NULL,
    supervisor_id TEXT    NOT NULL,
    lorry_plate   TEXT    NOT NULL,
    target_count  INTEGER NOT NULL,
    added_at      DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS completed_jobs (
    id              INTEGER PRIMARY KEY,
    bay_id          INTEGER NOT NULL,
    type            TEXT    NOT NULL,
    supervisor_id   TEXT,
    lorry_plate     TEXT,
    expected_count  INTEGER NOT NULL DEFAULT 0,
    actual_count    INTEGER NOT NULL DEFAULT 0,
    difference      INTEGER NOT NULL DEFAULT 0,
    status          TEXT    NOT NULL,
    errors          TEXT    NOT NULL DEFAULT '[]',
    note            TEXT    NOT NULL DEFAULT '',
    note_required   INTEGER NOT NULL DEFAULT 0,
    note_submitted  INTEGER NOT NULL DEFAULT 0,
    source          TEXT,
    timestamp       DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Initialize Trial Expiry if not exists
const trialSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('expiry_date');
if (!trialSetting) {
  // Set default trial to 14 days from now
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14);
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('expiry_date', expiryDate.toISOString());
}
const licenseTypeSetting = db.prepare('SELECT value FROM settings WHERE key = ?').get('license_type');
if (!licenseTypeSetting) {
  db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('license_type', 'trial');
}

// Prepare statements (compiled once, reused — best practice for performance)
const stmts = {
  upsertBay:      db.prepare(`INSERT INTO bay_states (id,type,status,supervisor_id,lorry_plate,target_count,current_count,started_at,session_errors,last_completed,updated_at)
                              VALUES (@id,@type,@status,@supervisor_id,@lorry_plate,@target_count,@current_count,@started_at,@session_errors,@last_completed,datetime('now'))
                              ON CONFLICT(id) DO UPDATE SET
                                status=excluded.status, supervisor_id=excluded.supervisor_id,
                                lorry_plate=excluded.lorry_plate, target_count=excluded.target_count,
                                current_count=excluded.current_count, started_at=excluded.started_at,
                                session_errors=excluded.session_errors, last_completed=excluded.last_completed,
                                updated_at=datetime('now')`),
  insertJob:      db.prepare(`INSERT INTO completed_jobs (id,bay_id,type,supervisor_id,lorry_plate,expected_count,actual_count,difference,status,errors,note,note_required,note_submitted,source,timestamp)
                              VALUES (@id,@bay_id,@type,@supervisor_id,@lorry_plate,@expected_count,@actual_count,@difference,@status,@errors,@note,@note_required,@note_submitted,@source,@timestamp)`),
  updateJobNote:  db.prepare(`UPDATE completed_jobs SET note=@note, note_submitted=1 WHERE id=@id`),
  insertQueue:    db.prepare(`INSERT INTO queue_items (bay_id,job_id,supervisor_id,lorry_plate,target_count) VALUES (@bay_id,@job_id,@supervisor_id,@lorry_plate,@target_count)`),
  deleteQueue:    db.prepare(`DELETE FROM queue_items WHERE bay_id=@bay_id AND job_id=@job_id`),
  clearBayQueue:  db.prepare(`DELETE FROM queue_items WHERE bay_id=@bay_id`),
  getQueue:       db.prepare(`SELECT * FROM queue_items WHERE bay_id=? ORDER BY added_at ASC`),
  getAllBays:     db.prepare(`SELECT * FROM bay_states ORDER BY id`),
  getRecentJobs:  db.prepare(`SELECT * FROM completed_jobs ORDER BY timestamp DESC LIMIT 50`),
};

// ═══════════════════════════════════════════════════════════════
// IN-MEMORY STATE — fast real-time access, synced to DB on every change
// ═══════════════════════════════════════════════════════════════
const ERROR_MESSAGES = {
  BACKWARD_DETECTION: 'Cylinder Detection Error — cylinder moved backwards',
  SENSOR_BLOCKED:     'Sensor Blocked — check sensor A or B',
  GATE_FAIL:          'Door Failed to Close — check relay',
  EMERGENCY_STOP:     'Emergency Stop Activated',
  COMM_LOST:          'Communication Lost — board not responding',
  COUNT_MISMATCH:     'Cylinder Count Mismatch',
  SENSOR_TIMEOUT:     'Sensor Timeout — no signal received',
  UNKNOWN:            'Unknown System Error',
};

let jobIdCounter = Date.now(); // Unique IDs that survive restarts

// ── Restore state from database on startup ──────────────────────
function restoreBayFromRow(row) {
  const queueRows = stmts.getQueue.all(row.id);
  return {
    id:              row.id,
    type:            row.type,
    status:          row.status,
    supervisorId:    row.supervisor_id,
    lorryPlate:      row.lorry_plate,
    targetCount:     row.target_count,
    currentCount:    row.current_count,
    startedAt:       row.started_at,
    sessionErrors:   JSON.parse(row.session_errors || '[]'),
    lastCompletedJob:row.last_completed ? JSON.parse(row.last_completed) : null,
    queue:           queueRows.map(q => ({ id: q.job_id, supervisorId: q.supervisor_id, lorryPlate: q.lorry_plate, targetCount: q.target_count, addedAt: q.added_at })),
  };
}

// Initialize 8 bays in DB if first run, then restore all
const initBayTx = db.transaction(() => {
  for (let i = 1; i <= 8; i++) {
    db.prepare(`INSERT OR IGNORE INTO bay_states (id,type) VALUES (?,?)`).run(i, i <= 4 ? 'Load' : 'Unload');
  }
});
initBayTx();

let bays = stmts.getAllBays.all().map(restoreBayFromRow);
let discrepancyLog = stmts.getRecentJobs.all().map(j => ({
  id: j.id, bayId: j.bay_id, type: j.type, supervisorId: j.supervisor_id,
  lorryPlate: j.lorry_plate, expectedCount: j.expected_count, actualCount: j.actual_count,
  difference: j.difference, status: j.status, errors: JSON.parse(j.errors),
  note: j.note, noteRequired: !!j.note_required, noteSubmitted: !!j.note_submitted,
  timestamp: j.timestamp,
}));

console.log(`[DB] Restored ${bays.length} bays, ${discrepancyLog.length} recent jobs from SQLite`);

// ── DB sync helpers ─────────────────────────────────────────────
const syncBay = (bay) => stmts.upsertBay.run({
  id: bay.id, type: bay.type, status: bay.status,
  supervisor_id: bay.supervisorId, lorry_plate: bay.lorryPlate,
  target_count: bay.targetCount, current_count: bay.currentCount,
  started_at: bay.startedAt,
  session_errors: JSON.stringify(bay.sessionErrors || []),
  last_completed: bay.lastCompletedJob ? JSON.stringify(bay.lastCompletedJob) : null,
});

const saveJob = (job) => stmts.insertJob.run({
  id: job.id, bay_id: job.bayId, type: job.type,
  supervisor_id: job.supervisorId, lorry_plate: job.lorryPlate,
  expected_count: job.expectedCount, actual_count: job.actualCount,
  difference: job.difference, status: job.status,
  errors: JSON.stringify(job.errors || []),
  note: job.note || '', note_required: job.noteRequired ? 1 : 0,
  note_submitted: job.noteSubmitted ? 1 : 0,
  source: job.source || 'sensor', timestamp: job.timestamp,
});

const pendingGateCommands = {};

// ── Job completion logic ────────────────────────────────────────
const closeActiveLorry = (bay, finalCount) => {
  const diff = finalCount - bay.targetCount;
  const isMismatch = diff !== 0;
  const errors = [...(bay.sessionErrors || [])];
  if (isMismatch && !errors.find(e => e.code === 'COUNT_MISMATCH')) {
    errors.push({ code: 'COUNT_MISMATCH', message: ERROR_MESSAGES.COUNT_MISMATCH, time: new Date().toISOString() });
  }
  const job = {
    id: ++jobIdCounter, bayId: bay.id, type: 'Unload',
    supervisorId: bay.supervisorId, lorryPlate: bay.lorryPlate,
    expectedCount: bay.targetCount, actualCount: finalCount,
    difference: diff, status: isMismatch ? 'Mismatch' : 'Matched',
    timestamp: new Date().toISOString(), source: 'sensor',
    errors, note: '', noteRequired: isMismatch || errors.length > 0, noteSubmitted: false,
  };
  try { saveJob(job); } catch (e) { console.error('[DB] saveJob error:', e.message); }
  discrepancyLog.unshift(job);
  if (discrepancyLog.length > 50) discrepancyLog.length = 50;
  console.log(`[JOB] Bay ${bay.id} | ${bay.lorryPlate} | Exp:${bay.targetCount} Act:${finalCount} | ${job.status}`);
  return job;
};

const activateNextInQueue = (bayId) => {
  bays = bays.map(b => {
    if (b.id !== bayId) return b;
    const nextQueue = [...b.queue];
    const next = nextQueue.shift();
    if (!next) {
      const updated = { ...b, status: 'Free', supervisorId: null, lorryPlate: null, targetCount: 0, currentCount: 0, startedAt: null, queue: [], sessionErrors: [] };
      syncBay(updated);
      stmts.clearBayQueue.run({ bay_id: bayId });
      return updated;
    }
    stmts.deleteQueue.run({ bay_id: bayId, job_id: next.id });
    pendingGateCommands[bayId] = 'open';
    console.log(`[QUEUE] Bay ${bayId}: Activating → ${next.lorryPlate}`);
    const updated = { ...b, status: 'In Progress', supervisorId: next.supervisorId, lorryPlate: next.lorryPlate, targetCount: next.targetCount, currentCount: 0, startedAt: Date.now(), queue: nextQueue, sessionErrors: [] };
    syncBay(updated);
    return updated;
  });
};

// ── Stats ───────────────────────────────────────────────────────
const calculateStats = () => {
  const all = stmts.getRecentJobs.all();
  return {
    activeBays:        bays.filter(b => b.status !== 'Free').length,
    totalCompleted:    all.length,
    loadedCylinders:   all.filter(j => j.type === 'Load').reduce((s, j) => s + j.actual_count, 0),
    unloadedCylinders: all.filter(j => j.type === 'Unload').reduce((s, j) => s + j.actual_count, 0),
    mismatches:        all.filter(j => j.status === 'Mismatch').length,
    pendingNotes:      all.filter(j => j.note_required && !j.note_submitted).length,
  };
};

// ═══════════════════════════════════════════════════════════════
// LICENSE MIDDLEWARE & ENDPOINTS
// ═══════════════════════════════════════════════════════════════
const checkLicense = () => {
  const licenseType = db.prepare('SELECT value FROM settings WHERE key = ?').get('license_type').value;
  if (licenseType === 'lifetime') return { active: true, type: 'lifetime', message: 'System Licensed' };
  
  const expiryStr = db.prepare('SELECT value FROM settings WHERE key = ?').get('expiry_date').value;
  const expiry = new Date(expiryStr);
  const now = new Date();
  
  if (now > expiry) {
    return { active: false, type: 'trial', expiry, message: 'Trial Expired' };
  }
  return { active: true, type: 'trial', expiry, message: 'Trial Active' };
};

app.get('/api/license/status', (req, res) => {
  res.json(checkLicense());
});

app.post('/api/superadmin/license', (req, res) => {
  const { auth } = req.body;
  if (auth !== 'litro2024super') return res.status(403).json({ error: 'Unauthorized' });
  
  const status = checkLicense();
  res.json(status);
});

app.post('/api/superadmin/license/update', (req, res) => {
  const { auth, action } = req.body;
  if (auth !== 'litro2024super') return res.status(403).json({ error: 'Unauthorized' });
  
  if (action === 'lifetime') {
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run('lifetime', 'license_type');
  } else if (action === 'extend_trial') {
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run('trial', 'license_type');
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 14); // extend 14 days from now
    db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(expiry.toISOString(), 'expiry_date');
  }
  
  // Broadcast to all clients to refresh license status
  io.emit('licenseUpdated', checkLicense());
  res.json({ success: true, status: checkLicense() });
});

// Middleware to block board counting if license is expired
const requireLicenseForBoard = (req, res, next) => {
  const status = checkLicense();
  if (!status.active) {
    console.log('[LICENSE ERROR] Board attempted to count but system is locked.');
    return res.status(403).send("LICENSE_EXPIRED");
  }
  next();
};

// ═══════════════════════════════════════════════════════════════
// EXPRESS + SOCKET.IO
// ═══════════════════════════════════════════════════════════════
const distPath = path.join(baseDir, 'dist');
app.use(express.static(distPath));

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*', methods: ['GET', 'POST'] } });

const broadcastState = () => {
  io.emit('stateUpdate', { bays, stats: calculateStats(), discrepancyLog });
};

// ── Security middleware for ESP32 sensor endpoints ──────────────
const requireBoardApiKey = (req, res, next) => {
  const key = req.headers['x-api-key'];
  if (!process.env.BOARD_API_KEY || key === process.env.BOARD_API_KEY) return next();
  console.warn(`[SECURITY] Invalid API key from ${req.ip}`);
  return res.status(401).json({ error: 'Unauthorized' });
};

// ── Load bay tick (for loading bays) ───────────────────────────
setInterval(() => {
  let changed = false;
  bays = bays.map(b => {
    if (b.status !== 'In Progress' || b.type !== 'Load' || b.currentCount <= 0) return b;
    changed = true;
    const newCount = b.currentCount - 1;
    if (newCount === 0) {
      const job = { id: ++jobIdCounter, bayId: b.id, type: 'Load', supervisorId: b.supervisorId, lorryPlate: b.lorryPlate, expectedCount: b.targetCount, actualCount: b.targetCount, difference: 0, status: 'Matched', timestamp: new Date().toISOString(), errors: [], note: '', noteRequired: false, noteSubmitted: true };
      try { saveJob(job); } catch(e) {}
      discrepancyLog.unshift(job);
      const updated = { ...b, currentCount: 0, status: 'Complete' };
      syncBay(updated);
      return updated;
    }
    const updated = { ...b, currentCount: newCount };
    syncBay(updated);
    return updated;
  });
  if (changed) broadcastState();
}, 800);

// ═══════════════════════════════════════════════════════════════
// SOCKET.IO EVENTS
// ═══════════════════════════════════════════════════════════════
io.on('connection', (socket) => {
  socket.emit('stateUpdate', { bays, stats: calculateStats(), discrepancyLog });

  socket.on('startJob', ({ bayId, supervisorId, lorryPlate, targetCount }) => {
    bays = bays.map(b => {
      if (b.id !== bayId || b.status !== 'Free') return b;
      const updated = { ...b, status: 'In Progress', supervisorId, lorryPlate, targetCount, currentCount: b.type === 'Load' ? targetCount : 0, startedAt: Date.now(), sessionErrors: [] };
      syncBay(updated);
      return updated;
    });
    broadcastState();
  });

  socket.on('addToQueue', ({ bayId, supervisorId, lorryPlate, targetCount }) => {
    const jobId = ++jobIdCounter;
    const plate = lorryPlate.trim().toUpperCase();
    bays = bays.map(b => {
      if (b.id !== bayId) return b;
      if (b.status === 'Free') {
        const updated = { ...b, status: 'In Progress', supervisorId, lorryPlate: plate, targetCount: parseInt(targetCount), currentCount: 0, startedAt: Date.now(), sessionErrors: [] };
        syncBay(updated);
        return updated;
      }
      const item = { id: jobId, supervisorId, lorryPlate: plate, targetCount: parseInt(targetCount), addedAt: new Date().toISOString() };
      stmts.insertQueue.run({ bay_id: bayId, job_id: jobId, supervisor_id: supervisorId, lorry_plate: plate, target_count: parseInt(targetCount) });
      const updated = { ...b, queue: [...b.queue, item] };
      syncBay(updated);
      return updated;
    });
    broadcastState();
  });

  socket.on('removeFromQueue', ({ bayId, jobId }) => {
    stmts.deleteQueue.run({ bay_id: bayId, job_id: jobId });
    bays = bays.map(b => {
      if (b.id !== bayId) return b;
      const updated = { ...b, queue: b.queue.filter(q => q.id !== jobId) };
      syncBay(updated);
      return updated;
    });
    broadcastState();
  });

  socket.on('submitNote', ({ bayId, note }) => {
    // Find most recent pending job for this bay in DB
    const pending = db.prepare(`SELECT id FROM completed_jobs WHERE bay_id=? AND note_submitted=0 ORDER BY timestamp DESC LIMIT 1`).get(bayId);
    if (pending) {
      stmts.updateJobNote.run({ id: pending.id, note: note.trim() });
      const idx = discrepancyLog.findIndex(j => j.id === pending.id);
      if (idx >= 0) discrepancyLog[idx] = { ...discrepancyLog[idx], note: note.trim(), noteSubmitted: true };
    }
    bays = bays.map(b => {
      if (b.id !== bayId || !b.lastCompletedJob) return b;
      const updated = { ...b, lastCompletedJob: { ...b.lastCompletedJob, noteSubmitted: true, note: note.trim() } };
      syncBay(updated);
      return updated;
    });
    broadcastState();
  });

  socket.on('clearBay', (bayId) => {
    stmts.clearBayQueue.run({ bay_id: bayId });
    bays = bays.map(b => {
      if (b.id !== bayId) return b;
      const updated = { ...b, status: 'Free', supervisorId: null, lorryPlate: null, targetCount: 0, currentCount: 0, startedAt: null, queue: [], sessionErrors: [], lastCompletedJob: null };
      syncBay(updated);
      return updated;
    });
    broadcastState();
  });
});

// ═══════════════════════════════════════════════════════════════
// REST API — ESP32 Sensor Endpoints (API key protected)
// ═══════════════════════════════════════════════════════════════
app.use('/api/sensor', requireLicenseForBoard, requireBoardApiKey);
app.use('/api/gate', requireLicenseForBoard, requireBoardApiKey);

app.post('/api/sensor/count', (req, res) => {
  const { bayId, count } = req.body;
  if (bayId === undefined || count === undefined) return res.status(400).json({ error: 'Missing bayId or count' });
  const bay = bays.find(b => b.id === bayId);
  if (!bay || bay.status !== 'In Progress' || bay.type !== 'Unload') return res.json({ status: 'ignored' });
  bays = bays.map(b => {
    if (b.id !== bayId) return b;
    const updated = { ...b, currentCount: count };
    syncBay(updated);
    return updated;
  });
  broadcastState();
  res.json({ status: 'ok', bayId, count });
});

app.post('/api/sensor/complete', (req, res) => {
  const { bayId, finalCount } = req.body;
  if (bayId === undefined || finalCount === undefined) return res.status(400).json({ error: 'Missing bayId or finalCount' });
  const bay = bays.find(b => b.id === bayId);
  if (!bay || bay.status !== 'In Progress' || bay.type !== 'Unload') return res.json({ status: 'ignored' });

  const completedJob = closeActiveLorry(bay, finalCount);
  const lastJobSummary = { id: completedJob.id, lorryPlate: completedJob.lorryPlate, expectedCount: completedJob.expectedCount, actualCount: completedJob.actualCount, difference: completedJob.difference, errors: completedJob.errors, noteRequired: completedJob.noteRequired, noteSubmitted: false, note: '' };
  const hasNext = bay.queue.length > 0;

  bays = bays.map(b => b.id !== bayId ? b : { ...b, lastCompletedJob: lastJobSummary });

  if (hasNext) {
    activateNextInQueue(bayId);
  } else {
    bays = bays.map(b => {
      if (b.id !== bayId) return b;
      const updated = { ...b, status: 'Complete', currentCount: finalCount };
      syncBay(updated);
      return updated;
    });
  }
  broadcastState();
  res.json({ status: 'ok', transition: hasNext ? 'next_lorry' : 'complete' });
});

app.post('/api/sensor/error', (req, res) => {
  const { bayId, errorCode } = req.body;
  if (!bayId || !errorCode) return res.status(400).json({ error: 'Missing bayId or errorCode' });
  const message = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN;
  const errorEntry = { code: errorCode, message, time: new Date().toISOString() };
  bays = bays.map(b => {
    if (b.id !== bayId) return b;
    const recent = b.sessionErrors?.find(e => e.code === errorCode && (Date.now() - new Date(e.time).getTime()) < 5000);
    if (recent) return b;
    const updated = { ...b, sessionErrors: [...(b.sessionErrors || []), errorEntry] };
    syncBay(updated);
    return updated;
  });
  broadcastState();
  res.json({ status: 'ok', message });
});

app.get('/api/gate/command', (req, res) => {
  const bayId = parseInt(req.query.bayId);
  if (!bayId) return res.status(400).json({ error: 'Missing bayId' });
  const command = pendingGateCommands[bayId] || null;
  if (command) delete pendingGateCommands[bayId];
  res.json({ command });
});

// ── Health check & System Update (Remote Control) ─────────────────
app.get('/api/health', (req, res) => {
  const activeBays = bays.filter(b => b.status !== 'Free').length;
  res.json({ status: 'ok', activeBays, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() });
});

app.post('/api/admin/system-update', (req, res) => {
  // Only allow if requested from a local IP or Tailscale IP (starts with 100.)
  const clientIp = req.ip || req.connection.remoteAddress;
  
  console.log(`[SYSTEM] Remote update triggered by ${clientIp}`);
  res.json({ status: 'updating', message: 'Downloading new code from GitHub, building, and restarting. Please refresh the page in 60 seconds.' });

  // Run the update commands in the background
  const updateCommand = process.platform === 'win32' 
    ? 'git pull origin main && npm install && npm run build && pm2 restart litro-gas'
    : 'git pull origin main && npm install && npm run build && pm2 restart litro-gas';

  exec(updateCommand, { cwd: __dirname }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[SYSTEM UPDATE ERROR]: ${error.message}`);
      return;
    }
    console.log(`[SYSTEM UPDATE SUCCESS]: ${stdout}`);
  });
});

// ── Catch-all for React Router ──────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN — saves DB before exit
// ═══════════════════════════════════════════════════════════════
const shutdown = (signal) => {
  console.log(`\n[SERVER] ${signal} received — saving state and shutting down...`);
  db.close();
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  db.close();
  process.exit(1);
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  Litro Gas Server — PRODUCTION MODE      ║`);
  console.log(`║  Port: ${PORT}   DB: litro_gas.db          ║`);
  console.log(`╚══════════════════════════════════════════╝\n`);
});
