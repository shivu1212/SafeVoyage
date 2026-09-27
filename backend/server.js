import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import travellersRoutes from './routes/travellers.js';
import tripRoutes from './routes/trip.js';
import itineraryRoutes from './routes/itinerary.js';
import alertsRoutes from './routes/alerts.js';
import weatherRoutes from './routes/weather.js';
import notificationsRoutes from './routes/notifications.js';
import emergencyRoutes from './routes/emergency.js';
import contactsRoutes from './routes/contacts.js';
import aiRoutes from './routes/ai.js';
import routesRoutes from './routes/routes.js';
import { getGlobalStore } from './data/store.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Load the authenticated user's MongoDB document for existing route handlers.
app.use('/api', async (req, res, next) => {
  const store = getGlobalStore();
  const userId = store.resolveUserId(req);
  if (!userId) return next();

  try {
    req.db = await store.loadUserData(userId);
    if (!req.db) return res.status(401).json({ success: false, error: 'Authenticated user was not found.' });
    res.on('finish', () => store.saveUserData(userId, req.db).catch((error) => console.error('[MongoDB save error]', error.message)));
    return next();
  } catch (error) {
    return next(error);
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/travellers', travellersRoutes);
app.use('/api/trip', tripRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/routes', routesRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'SafeVoyage API',
    timestamp: new Date().toISOString(),
    demoReady: true,
    version: '1.0.0'
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

try {
  await getGlobalStore().initialize();
} catch (error) {
  console.error('Unable to connect to the database. Please make sure MongoDB is running.');
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`🛡️ SafeVoyage Backend API running on http://localhost:${PORT}`);
  console.log(`📡 Ready for Hackathon Demo & Itinerary-Aware Matching`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n⚠️  Port ${PORT} is already in use by another process.`);
    console.error(`To automatically free port ${PORT}, run this in PowerShell:`);
    console.error(`  powershell -Command "Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force"\n`);
    process.exit(1);
  } else {
    throw err;
  }
});

