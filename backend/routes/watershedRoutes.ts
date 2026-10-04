import { Router, Request, Response } from 'express';
import { db } from '../../database/index.js';

const router = Router();

// GET /api/watersheds
router.get('/', (req: Request, res: Response) => {
  const watersheds = db.getWatersheds();
  res.json({ success: true, data: watersheds });
});

// GET /api/watersheds/:id/layers
router.get('/:id/layers', (req: Request, res: Response) => {
  const watershedId = req.params.id;
  const layers = db.getWatershedLayers(watershedId);
  res.json({
    success: true,
    data: {
      watershedId,
      drainage: layers.drainage,
      waterBodies: layers.waterBodies
    }
  });
});

export default router;
