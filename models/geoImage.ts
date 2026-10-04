import { InterventionType } from './intervention.js';

export type ImageClassificationCategory =
  | 'Check dam'
  | 'Farm pond'
  | 'Water harvesting structure'
  | 'Plantation/vegetation'
  | 'Agricultural land'
  | 'Barren/degraded land'
  | 'Drainage/stream'
  | 'Other';

export interface FocusTarget {
  kind: 'image' | 'intervention' | 'village';
  id: string;
  lat: number;
  lng: number;
  title?: string;
}

export interface ImageAnalysisResult {
  validatedQuality: {
    status: 'Excellent' | 'Good' | 'Adequate' | 'Poor';
    resolution: string;
    sharpnessScore: number; // 0 - 100
    lightingCondition: 'Optimal' | 'Overexposed' | 'Underexposed';
    gpsAccuracyMeters: number;
  };
  classification: ImageClassificationCategory;
  confidenceScore: number; // 0 - 100
  observedInformation: string[]; // concrete visible features
  inferredInformation: string[]; // deduced spatial/condition patterns
  unavailableInformation: string[]; // what cannot be reliably asserted from photo
  uncertaintyFlags: string[];
  detectedFeatures: {
    label: string;
    box?: [number, number, number, number];
    confidence: number;
  }[];
  nearbyFeatures: {
    streamDistanceMeters: number;
    nearestInterventionName?: string;
    nearestVillageName: string;
  };
  aiModelUsed: string;
  analysisSource?: 'gemini' | 'heuristic';
  fallbackReason?: string;
  analyzedAt: string;
}

export interface GeoImage {
  id: string;
  watershedId: string;
  title: string;
  imageUrl: string;
  thumbnailUrl?: string;
  latitude: number;
  longitude: number;
  date: string;
  villageId: string;
  villageName: string;
  interventionType: InterventionType | 'Natural Landscape' | 'Degraded Site';
  interventionId?: string;
  uploadedBy: string;
  inspectorName: string;
  fieldNotes: string;
  analysis?: ImageAnalysisResult;
}
