import express from 'express';
import { getWeatherData } from '../services/weatherService.js';
import { getDB } from '../data/store.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const db = getDB(req);
  const city = req.query.city || db.trip?.destination;

  if (!city || !city.trim()) {
    return res.json({
      success: true,
      weather: {
        isLive: false,
        error: 'Live weather data unavailable.',
        city: ''
      }
    });
  }

  const weather = await getWeatherData(city.trim());
  res.json({ success: true, weather });
});

export default router;
