import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth.js';
import { dashboardConfigService } from '../services/dashboardConfigService.js';
import { validate, DashboardConfigSchema } from '../utils/validation.js';

const router = Router();
const PERM = 'DASHBOARD';

// GET /api/dashboard-config — 204 if no config, 200 with config if exists
router.get(
  '/',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const benutzerId = req.currentUser!.id;
      const config = dashboardConfigService.getConfig(benutzerId);
      if (config === null) {
        res.status(204).send();
      } else {
        res.json(config);
      }
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/dashboard-config
router.put(
  '/',
  requireAuth,
  requirePermission(PERM),
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const benutzerId = req.currentUser!.id;
      const dto = validate(DashboardConfigSchema, req.body);
      res.json(dashboardConfigService.saveConfig(benutzerId, dto));
    } catch (err) {
      next(err);
    }
  }
);

export default router;
