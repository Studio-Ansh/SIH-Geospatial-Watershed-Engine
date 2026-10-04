import { Router, Request, Response } from 'express';
import { db } from '../../database/index.js';
import { Intervention } from '../../models/index.js';

const router = Router();

// GET /api/interventions
router.get('/', (req: Request, res: Response) => {
  const { watershedId, type, status } = req.query;
  const filtered = db.getInterventions({
    watershedId: watershedId as string,
    type: type as string,
    status: status as string
  });
  res.json({ success: true, data: filtered });
});

// POST /api/interventions
router.post('/', (req: Request, res: Response) => {
  try {
    const {
      watershedId,
      name,
      type,
      villageId,
      villageName,
      latitude,
      longitude,
      installationYear,
      storageCapacityM3,
      catchmentAreaHa,
      contractorOrPanchayat,
      status,
      observations
    } = req.body;

    if (!name || !type || !latitude || !longitude || !watershedId) {
      return res.status(400).json({ success: false, error: 'Missing required intervention fields.' });
    }

    const newIntervention: Intervention = {
      id: `int-${Date.now()}`,
      watershedId,
      name,
      type,
      villageId: villageId || 'v-01',
      villageName: villageName || 'Kalyanpura',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      installationYear: parseInt(installationYear, 10) || new Date().getFullYear(),
      storageCapacityM3: storageCapacityM3 ? parseFloat(storageCapacityM3) : undefined,
      catchmentAreaHa: catchmentAreaHa ? parseFloat(catchmentAreaHa) : undefined,
      contractorOrPanchayat: contractorOrPanchayat || 'Gram Panchayat / WDC-PMKSY',
      status: status || 'Operational',
      linkedImageIds: [],
      monitoringHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          inspector: 'Field Monitoring Officer',
          status: status || 'Operational',
          observations: observations || 'Initial registration of conservation structure in GeoWatershed.'
        }
      ]
    };

    const saved = db.addIntervention(newIntervention);
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    console.error('Error creating intervention:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to create intervention' });
  }
});

export default router;
