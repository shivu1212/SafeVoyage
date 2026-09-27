import express from 'express';
import { computeRoute } from '../services/routesService.js';

const router = express.Router();

router.post('/compute', async (req, res) => {
  const { origin, destination, travelMode, routingPreference } = req.body;

  if (!origin || !destination) {
    return res.status(400).json({
      success: false,
      error: 'Both origin and destination coordinates are required.'
    });
  }

  const result = await computeRoute({
    origin,
    destination,
    travelMode: travelMode || 'DRIVE',
    routingPreference: routingPreference || 'TRAFFIC_AWARE'
  });

  if (!result.success) {
    return res.status(result.error?.includes('API key') ? 401 : 400).json(result);
  }

  res.json(result);
});

export default router;
