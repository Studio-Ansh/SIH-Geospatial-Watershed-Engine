export interface Village {
  id: string;
  name: string;
  population: number;
  households: number;
  latitude: number;
  longitude: number;
  watershedId: string;
}

export interface WatershedYearlyMetrics {
  year: number;
  vegetationCoveragePercent: number;
  vegetationAreaKm2: number;
  averageNDVI: number;
  waterBodyAreaKm2: number;
  waterStorageIndex: number;
  interventionsCount: number;
  geoImagesCount: number;
  degradedLandPercent: number;
  cropLandPercent: number;
  annualRainfallMm: number;
}

export interface Watershed {
  id: string;
  code: string;
  name: string;
  state: string;
  district: string;
  block: string;
  totalAreaKm2: number;
  centerCoordinates: [number, number]; // [lat, lng]
  boundaryGeoJson: GeoJSON.Polygon;
  villages: Village[];
  yearlyMetrics: Record<number, WatershedYearlyMetrics>;
  summary: string;
}
