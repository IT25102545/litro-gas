import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Serve Vite build in production
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

let bays = Array.from({ length: 8 }, (_, i) => ({
  id: i + 1,
  type: i < 4 ? 'Load' : 'Unload',
  status: 'Free',
  currentLorry: null,
  targetCount: 0,
  currentCount: 0,
  queue: []
}));

let pastLorries = [];
let totalLorriesHandled = 0;
let totalCylindersProcessed = 0;

const calculateStats = () => {
  const activeCount = bays.filter(b => b.status !== 'Free').length;
  const efficiency = activeCount > 0
    ? Math.min(99, 85 + (activeCount * 2) + Math.floor(Math.random() * 3))
    : (totalLorriesHandled > 0 ? 95 : 0);

  const totalQueue = bays.reduce((sum, b) => sum + b.queue.length, 0);
  const avgWait = totalQueue === 0 ? (activeCount > 0 ? 5 : 0) : 5 + (totalQueue * 4);

  return {
    activeBaysCount: activeCount,
    totalLorriesHandled,
    totalCylindersProcessed,
    efficiency,
    avgWait,
    pastLorries: pastLorries.slice(-10).reverse()
  };
};

setInterval(() => {
  let changed = false;
  bays = bays.map(b => {
    if (b.status === 'In Progress' && b.currentCount < b.targetCount) {
      changed = true;
      const newCount = b.currentCount + 1;
      if (newCount === b.targetCount) {
        totalCylindersProcessed += b.targetCount;
        return { ...b, currentCount: newCount, status: 'Complete' };
      }
      return { ...b, currentCount: newCount };
    }
    return b;
  });
  if (changed) io.emit('stateUpdate', { bays, stats: calculateStats() });
}, 500);

io.on('connection', (socket) => {
  socket.emit('stateUpdate', { bays, stats: calculateStats() });

  socket.on('scanQR', (payload) => {
    const freeBay = bays.find(b => b.type === payload.opType && b.status === 'Free');
    if (freeBay) {
      freeBay.status = 'Occupied';
      freeBay.currentLorry = payload;
      freeBay.targetCount = payload.targetCount;
      freeBay.currentCount = 0;
    } else {
      const validBays = bays.filter(b => b.type === payload.opType);
      validBays.sort((a, b) => a.queue.length - b.queue.length);
      validBays[0].queue.push({ ...payload, queuedAt: Date.now() });
    }
    io.emit('stateUpdate', { bays, stats: calculateStats() });
  });

  socket.on('startOperation', (bayId) => {
    bays = bays.map(b => b.id === bayId ? { ...b, status: 'In Progress' } : b);
    io.emit('stateUpdate', { bays, stats: calculateStats() });
  });

  socket.on('clearBay', (bayId) => {
    const bay = bays.find(b => b.id === bayId);
    if (!bay) return;
    if (bay.currentLorry) {
      totalLorriesHandled++;
      pastLorries.push({ ...bay.currentLorry, completedAt: new Date().toLocaleTimeString(), bayId });
    }
    if (bay.queue.length > 0) {
      const next = bay.queue.shift();
      bay.status = 'Occupied';
      bay.currentLorry = next;
      bay.targetCount = next.targetCount;
      bay.currentCount = 0;
    } else {
      bay.status = 'Free';
      bay.currentLorry = null;
      bay.targetCount = 0;
      bay.currentCount = 0;
    }
    io.emit('stateUpdate', { bays, stats: calculateStats() });
  });
});

// Catch-all: serve index.html for React Router routes
app.get(/^.*$/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Litro Gas server running on port ${PORT}`);
});
