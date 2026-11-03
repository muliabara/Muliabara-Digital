import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Enable CORS for Netlify <-> Google AI Studio Cross-Origin Realtime Synchronization
app.use((req: Request, res: Response, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// In-Memory Real-time authoritative state for Phone <-> PC synchronization
interface ServerState {
  records: any[];
  vehicles: any[];
  notifications: any[];
  users: any[];
  settings: any;
  version: number;
}

let serverState: ServerState = {
  records: [],
  vehicles: [],
  notifications: [],
  users: [],
  settings: null,
  version: Date.now()
};

// Connected SSE clients (PC, Phone, Tablets, Tabs)
let sseClients: Response[] = [];

// SSE Event Stream for instant Realtime Updates across devices
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial handshake only if server has cached data
  if (serverState.records.length > 0 || serverState.users.length > 0) {
    res.write(`data: ${JSON.stringify({ type: 'init', state: serverState })}\n\n`);
  }

  sseClients.push(res);

  // Keep-alive heartbeat every 15s to keep mobile connections active
  const heartbeat = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter(c => c !== res);
  });
});

// Broadcast changes to all connected devices
function broadcastSync(sourceState: ServerState) {
  const payload = JSON.stringify({ type: 'sync', state: sourceState });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      // client disconnected
    }
  }
}

// Get current state
app.get('/api/state', (req: Request, res: Response) => {
  res.json(serverState);
});

// Push state update from any device (Phone or PC)
app.post('/api/sync', (req: Request, res: Response) => {
  const { records, vehicles, notifications, users, settings, version, originId } = req.body;

  if (records !== undefined) serverState.records = records;
  if (vehicles !== undefined) serverState.vehicles = vehicles;
  if (notifications !== undefined) serverState.notifications = notifications;
  if (users !== undefined) serverState.users = users;
  if (settings !== undefined) serverState.settings = settings;

  serverState.version = version || Date.now();

  // Broadcast in real-time to all other devices (passing originId so sender ignores)
  const payload = JSON.stringify({ type: 'sync', state: { ...serverState, originId } });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      // client disconnected
    }
  }

  res.json({ success: true, version: serverState.version });
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite Dev Server middleware mode
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`JAC T9 EV Full-Stack Realtime Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
