require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./models');
const { authenticateSocket } = require('./middleware/auth');
const registerGameSocket = require('./socket/gameSocket');

const authRoutes = require('./routes/auth');
const statsRoutes = require('./routes/stats');

const app = express();
const server = http.createServer(app);

// ── Socket.IO ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.use(authenticateSocket);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id} (${socket.user?.username})`);
  registerGameSocket(io, socket);
});

// ── Express middleware ─────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use('/api/', limiter);

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/stats', statsRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: Date.now() }));

// ── DB + Start ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

sequelize
  .authenticate()
  .then(() => sequelize.sync({ alter: true }))
  .then(() => {
    server.listen(PORT, () => {
      console.log(`\n🃏 Crypto Spades backend running on :${PORT}`);
      console.log(`   DB: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to DB:', err.message);
    process.exit(1);
  });
