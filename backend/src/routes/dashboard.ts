import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboard } from '../services/dashboardService.js';

const router = Router();

router.use(requireAuth);

router.get('/', (req, res, next) => {
  try {
    res.json(getDashboard());
  } catch (e) {
    next(e);
  }
});

export default router;
