export interface DatasetSourceMetadata {
  source_type: 'demo' | 'external' | 'user_field';
  source_name: string;
  source_provider: 'DemoSatelliteProvider' | 'Bhuvan/NRSC' | 'SRISHTI-DRISHTI' | 'UserFieldSurvey';
  source_date: string;
  is_official: boolean;
}

export interface SatelliteLayerInfo {
  id: string;
  name: string;
  resolution: string; // e.g. "30 m spatial resolution"
  sensor: string; // e.g. "AWiFS / LISS-III / Landsat 30m"
  type: 'NDVI' | 'NDWI' | 'LULC' | 'DEM' | 'TRUE_COLOR';
  description: string;
  provider: 'DEMO DATA' | 'EXTERNAL DATA';
  sourceMetadata?: DatasetSourceMetadata;
  availableYears: number[];
  colorLegend: {
    label: string;
    color: string;
    range?: string;
  }[];
}

export interface ProviderStatusInfo {
  providerId: string;
  providerName: string;
  status: 'Available' | 'Integration Ready' | 'Active';
  sourceType: 'demo' | 'official_gateway' | 'user_field';
  isOfficial: boolean;
  message: string;
  notice?: string;
  endpointConfigured: boolean;
  endpointUrl?: string;
  supportedLayers: string[];
}

export interface SatelliteRasterData {
  layerId: string;
  bounds: [[number, number], [number, number]]; // [[minLat, minLng], [maxLat, maxLng]]
  resolutionMeters: number;
  dataUrl?: string;
  metadata: {
    datasetLabel: string;
    isOfficial: boolean;
    sensor: string;
  };
}

export interface SatelliteTimeSeriesPoint {
  date: string;
  year: number;
  value: number; // e.g. mean NDVI or NDWI
  sensor: string;
}

export interface SatelliteDataProvider {
  readonly providerId: string;
  readonly providerName: string;
  readonly isOfficialService: boolean;

  getLayers(watershedId: string): Promise<SatelliteLayerInfo[]>;
  getLayerMetadata(layerId: string): Promise<SatelliteLayerInfo | null>;
  getRasterData(layerId: string, bounds: [[number, number], [number, number]]): Promise<SatelliteRasterData | null>;
  getTimeSeries(layerId: string, location: [number, number]): Promise<SatelliteTimeSeriesPoint[]>;
  getAvailableDates(layerId: string): Promise<string[]>;
  getStatus(): ProviderStatusInfo;
}
