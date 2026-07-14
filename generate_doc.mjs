import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, Header, ImageRun,
  convertInchesToTwip
} from 'docx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PRIMARY = '1a2f58';
const ACCENT  = '2563eb';
const LIGHT   = 'f0f4f8';
const WHITE   = 'FFFFFF';

const heading1 = (text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  run: { color: PRIMARY, bold: true, size: 36 }
});

const heading2 = (text) => new Paragraph({
  text,
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 160 },
  run: { color: PRIMARY, bold: true, size: 28 }
});

const heading3 = (text) => new Paragraph({
  children: [new TextRun({ text, bold: true, color: ACCENT, size: 24 })],
  spacing: { before: 240, after: 120 },
});

const body = (text) => new Paragraph({
  children: [new TextRun({ text, size: 22, color: '333333' })],
  spacing: { after: 120 },
});

const bullet = (text) => new Paragraph({
  children: [new TextRun({ text: `• ${text}`, size: 22, color: '333333' })],
  spacing: { after: 80 },
  indent: { left: convertInchesToTwip(0.3) },
});

const numbered = (text, n) => new Paragraph({
  children: [
    new TextRun({ text: `${n}.  `, bold: true, color: ACCENT, size: 22 }),
    new TextRun({ text, size: 22, color: '333333' }),
  ],
  spacing: { after: 100 },
  indent: { left: convertInchesToTwip(0.2) },
});

const subBullet = (text) => new Paragraph({
  children: [new TextRun({ text: `◦  ${text}`, size: 20, color: '555555' })],
  spacing: { after: 60 },
  indent: { left: convertInchesToTwip(0.6) },
});

const divider = () => new Paragraph({
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'dde3f0' } },
  spacing: { before: 200, after: 200 },
});

const tip = (text) => new Paragraph({
  children: [
    new TextRun({ text: '💡  Tip:  ', bold: true, color: ACCENT, size: 22 }),
    new TextRun({ text, size: 22, color: '333333' }),
  ],
  shading: { type: ShadingType.CLEAR, fill: 'eef4ff' },
  border: {
    left: { style: BorderStyle.THICK, size: 12, color: ACCENT },
  },
  spacing: { before: 160, after: 160 },
  indent: { left: convertInchesToTwip(0.2), right: convertInchesToTwip(0.2) },
});

const urlRow = (emoji, label, url) => new TableRow({
  children: [
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: `${emoji}  ${label}`, bold: true, size: 20, color: PRIMARY })] })],
      shading: { type: ShadingType.CLEAR, fill: LIGHT },
      width: { size: 25, type: WidthType.PERCENTAGE },
    }),
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: url, size: 20, color: ACCENT })] })],
      width: { size: 75, type: WidthType.PERCENTAGE },
    }),
  ],
});

const doc = new Document({
  creator: 'Litro Gas Systems',
  title: 'Litro Gas Bay Management System — Demo Guide',
  description: 'Client-facing demonstration guide',
  sections: [{
    headers: {
      default: new Header({
        children: [new Paragraph({
          children: [
            new TextRun({ text: 'Litro Gas ', bold: true, color: PRIMARY, size: 20 }),
            new TextRun({ text: '— Bay Management System  |  Demo Guide', color: '888888', size: 18 }),
          ],
          alignment: AlignmentType.LEFT,
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'dde3f0' } },
        })]
      })
    },
    children: [

      // ── TITLE BLOCK ──────────────────────────────────────────────
      new Paragraph({
        children: [
          new TextRun({ text: 'Litro Gas', bold: true, size: 72, color: PRIMARY, break: 0 }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Bay Management System', size: 40, color: ACCENT })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Live Demo Guide', size: 28, color: '888888' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: '🌐  https://litro-gas-production.up.railway.app', bold: true, size: 24, color: ACCENT })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),

      divider(),

      // ── WHAT IT DOES ─────────────────────────────────────────────
      heading1('What This System Does'),
      body(
        'The Litro Gas Bay Management System is a real-time lorry tracking and bay assignment platform for LPG cylinder depots. When a lorry arrives at the facility, it is instantly assigned to the most efficient available bay — reducing wait times and eliminating manual coordination.'
      ),
      bullet('8 bays managed simultaneously (4 Load + 4 Unload)'),
      bullet('Real-time updates across all devices — no page refresh needed'),
      bullet('Automatic bay assignment based on queue length'),
      bullet('Full operation lifecycle: Arrival → Assignment → In Progress → Complete'),
      bullet('Gate scanning via mobile phone — no dedicated hardware needed'),

      divider(),

      // ── QUICK LINKS ───────────────────────────────────────────────
      heading1('Quick Access Links'),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Page', bold: true, size: 20, color: WHITE })] })], shading: { type: ShadingType.CLEAR, fill: PRIMARY }, width: { size: 25, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'URL', bold: true, size: 20, color: WHITE })] })], shading: { type: ShadingType.CLEAR, fill: PRIMARY }, width: { size: 75, type: WidthType.PERCENTAGE } }),
            ],
          }),
          urlRow('🖥️', 'Dashboard', 'https://litro-gas-production.up.railway.app'),
          urlRow('🔲', 'QR Generator', 'https://litro-gas-production.up.railway.app/qr-generator'),
          urlRow('📱', 'Mobile Scanner', 'https://litro-gas-production.up.railway.app/mobile-scanner'),
          urlRow('🔗', 'Connect Scanner', 'https://litro-gas-production.up.railway.app/mobile-connect'),
        ],
      }),

      divider(),

      // ── HOW TO DEMO ───────────────────────────────────────────────
      heading1('How to Run the Demo'),

      heading3('Step 1 — Open the Dashboard'),
      body('Open the Dashboard URL on a laptop or desktop browser. You will see 8 bay cards, live statistics, and a queue list. All bays start as Free (green).'),

      heading3('Step 2 — Generate a Lorry QR Code'),
      body('Navigate to the QR Generator page and fill in the lorry details:'),
      subBullet('Registration Number  (e.g. WP LA-1234)'),
      subBullet('Selling Point / District  (e.g. Colombo North)'),
      subBullet('Operation Type →  Load  (filling) or  Unload  (returning empties)'),
      subBullet('Target Cylinder Count  (e.g. 120)'),
      body('Click "Generate QR Code". A unique QR code is created for that lorry. Download it as an image.'),

      heading3('Step 3 — Scan at the Gate (Mobile)'),
      body('On your mobile phone, open the Mobile Scanner URL. Tap "Tap to Scan QR" and photograph the lorry\'s QR code. The system instantly reads it and assigns the lorry to the best available bay.'),
      tip('If camera scanning does not work, tap "Manual Entry" to enter lorry details directly.'),

      heading3('Step 4 — Watch the Dashboard Update'),
      body('Switch back to the Dashboard. You will see the assigned bay change from Free → Occupied, the lorry details appear, and the Queue List update — all in real time.'),

      heading3('Step 5 — Start the Operation'),
      body('Click "Start" on an Occupied bay. The status changes to In Progress and a progress bar fills as cylinders are counted automatically.'),

      heading3('Step 6 — Clear the Bay'),
      body('Click "Clear" on a completed bay. If another lorry is waiting, it automatically moves in. Completed lorries appear in the Past Lorries log at the bottom of the dashboard.'),

      divider(),

      // ── HOW ROUTING WORKS ─────────────────────────────────────────
      heading1('Automatic Bay Assignment Algorithm'),
      body('When a lorry QR code is scanned at the gate, the system performs the following logic automatically:'),
      numbered('Reads the operation type from the QR code (Load or Unload)', 1),
      numbered('Filters all bays that match that operation type', 2),
      numbered('Checks which matching bay has the shortest current queue', 3),
      numbered('Assigns the lorry to that bay immediately', 4),
      numbered('If no bay is free, adds the lorry to the shortest queue and shows it on the dashboard', 5),
      body('This eliminates the need for a person to manually direct lorries, reducing congestion and idle time at the facility.'),

      divider(),

      // ── SYSTEM ARCH ───────────────────────────────────────────────
      heading1('System Architecture'),
      new Paragraph({
        children: [new TextRun({ text: 'Mobile Phone (Gate Scanner)  →  Node.js Server  →  Desktop Dashboard', size: 20, color: '555555', font: 'Courier New' })],
        shading: { type: ShadingType.CLEAR, fill: LIGHT },
        spacing: { before: 100, after: 100 },
        indent: { left: convertInchesToTwip(0.3) },
      }),
      bullet('Frontend: React.js — runs in any modern browser'),
      bullet('Backend: Node.js + Express — handles bay logic and state'),
      bullet('Real-time: Socket.IO WebSockets — live push to all connected screens'),
      bullet('QR Scanning: jsQR — pure JavaScript, fully compatible with iPhone Safari'),
      bullet('Hosted on: Railway Cloud — 24/7 availability'),

      divider(),

      // ── DEMO TIPS ─────────────────────────────────────────────────
      heading1('Tips for a Smooth Demonstration'),
      tip('Before the demo, generate 2–3 lorry QR codes and save them to your phone gallery. Upload from gallery during the demo for a fast, smooth scan.'),
      tip('Open the Dashboard on one screen and the Mobile Scanner on your phone at the same time to show the real-time sync effect live.'),
      tip('Use the "Test Mode" button at the bottom of the Mobile Scanner page to simulate a lorry arrival without any QR code — perfect for a quick live demo.'),
      tip('You can open the Dashboard in multiple browser tabs or on multiple laptops. All screens update simultaneously, showing real-time multi-user capability.'),

      divider(),

      new Paragraph({
        children: [new TextRun({ text: 'Litro Gas Bay Management System — Demo Version', size: 18, color: 'aaaaaa' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Built with React, Node.js & Socket.IO', size: 18, color: 'aaaaaa' })],
        alignment: AlignmentType.CENTER,
      }),
    ],
  }],
});

const outPath = path.join(__dirname, 'Litro_Gas_Demo_Guide.docx');
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(outPath, buffer);
console.log('✅  Word document created:', outPath);
