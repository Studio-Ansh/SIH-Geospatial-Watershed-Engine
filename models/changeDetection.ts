export interface ChangeDetectionParcel {
  id: string;
  type: 'Vegetation Increase' | 'Vegetation Loss' | 'Water Body Expansion' | 'Water Body Shrinkage' | 'Land Reclamation' | 'Erosion Vulnerability';
  areaHectares: number;
  confidence: 'High' | 'Medium' | 'Low';
  latitude: number;
  longitude: number;
  description: string;
  recommendedAction: string;
  coordinates: [number, number][]; // Polygon coords
}

export interface ChangeDetectionResult {
  watershedId: string;
  baseYear: number;
  comparisonYear: number;
  vegetationChangePercent: number;
  vegetationChangeKm2: number;
  waterBodyChangeKm2: number;
  waterBodyPercentChange?: number;
  degradedLandChangePercent?: number;
  newInterventionsCommissioned: number;
  detectedParcels: ChangeDetectionParcel[];
  executiveSummary: string;
  evidenceBasedConclusion: string;
}
