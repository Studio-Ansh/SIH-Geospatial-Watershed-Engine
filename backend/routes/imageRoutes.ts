import { Router, Request, Response } from 'express';
import { db } from '../../database/index.js';
import { analyzeFieldImage } from '../services/analysisEngine.js';
import { GeoImage } from '../../models/index.js';

const router = Router();

// GET /api/images
router.get('/', (req: Request, res: Response) => {
  const { watershedId, villageId, interventionType, classificationCategory, searchQuery } = req.query;
  const filtered = db.getGeoImages({
    watershedId: watershedId as string,
    villageId: villageId as string,
    interventionType: interventionType as string,
    classificationCategory: classificationCategory as string,
    searchQuery: searchQuery as string
  });
  res.json({ success: true, data: filtered });
});

// POST /api/images
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      watershedId,
      title,
      imageUrl,
      latitude,
      longitude,
      date,
      villageId,
      villageName,
      interventionType,
      interventionId,
      inspectorName,
      fieldNotes,
      clientQuality
    } = req.body;

    if (!latitude || !longitude || !watershedId) {
      return res.status(400).json({ success: false, error: 'Latitude, longitude, and watershedId are required.' });
    }

    const analysis = await analyzeFieldImage({
      imagePayload: imageUrl,
      clientQuality,
      metadata: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        date: date || new Date().toISOString(),
        villageId,
        villageName,
        userProposedType: interventionType,
        watershedId,
        notes: fieldNotes
      }
    });

    const newImage: GeoImage = {
      id: `img-${Date.now()}`,
      watershedId,
      title: title || `${interventionType || 'Intervention'} Field Photo`,
      imageUrl: imageUrl || '',
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      date: date || new Date().toISOString(),
      villageId: villageId || 'v-01',
      villageName: villageName || 'Kalyanpura',
      interventionType: interventionType || 'Check Dam',
      interventionId,
      uploadedBy: inspectorName || 'Field Officer',
      inspectorName: inspectorName || 'Field Officer',
      fieldNotes: fieldNotes || 'Field inspection photo uploaded via web platform.',
      analysis
    };

    const saved = db.addGeoImage(newImage);
    res.status(201).json({ success: true, data: saved });
  } catch (err: any) {
    console.error('Error saving image:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to upload image' });
  }
});

// POST /api/images/analyze
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { imagePayload, clientQuality, metadata } = req.body;
    if (!metadata || metadata.latitude === undefined || metadata.longitude === undefined) {
      return res.status(400).json({ success: false, error: 'Metadata with GPS coordinates is required.' });
    }

    const analysisResult = await analyzeFieldImage({
      imagePayload,
      clientQuality,
      metadata
    });

    res.json({ success: true, data: analysisResult });
  } catch (err: any) {
    console.error('Image analysis error:', err);
    res.status(500).json({ success: false, error: err.message || 'Image analysis failed' });
  }
});

// PUT /api/images/:id/analysis
router.put('/:id/analysis', (req: Request, res: Response) => {
  const { id } = req.params;
  const { analysis } = req.body;

  if (!analysis) {
    return res.status(400).json({ success: false, error: 'Analysis payload is required' });
  }

  const updated = db.updateGeoImageAnalysis(id, analysis);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Image not found' });
  }

  res.json({ success: true, data: updated });
});

export default router;
