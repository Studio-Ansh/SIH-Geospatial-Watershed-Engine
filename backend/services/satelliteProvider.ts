import { SatelliteLayerInfo } from '../../models/index.js';
import { sampleSatelliteLayers } from '../../database/index.js';

export interface ProviderStatusInfo {
  providerId: string;
  providerName: string;
  status: 'Available' | 'Integration Ready';
  message: string;
  disclaimer: string;
  requiresAuthorization: boolean;
}

/**
 * SatelliteDataProvider Interface
 * Clean architectural abstraction for remote-sensing data sources.
 */
export interface SatelliteDataProvider {
  readonly providerId: string;
  readonly providerName: string;
  readonly status: 'Available' | 'Integration Ready';

  getLayers(watershedId?: string): Promise<SatelliteLayerInfo[]>;
  getLayerMetadata(layerId: string, year?: number): Promise<any>;
  getRasterData(layerId: string, bounds?: any): Promise<any>;
  getTimeSeries(layerId: string, location?: [number, number]): Promise<any>;
  getAvailableDates(layerId: string): Promise<number[]>;
  getStatus(): ProviderStatusInfo;
}

/**
 * DemoSatelliteProvider
 * Active default provider for the working prototype.
 * Uses deterministic, local synthetic geospatial data representing semi-arid Indian watersheds.
 * Clearly labeled everywhere as DEMO DATA.
 */
export class DemoSatelliteProvider implements SatelliteDataProvider {
  readonly providerId = 'demo';
  readonly providerName = 'Demo Watershed Dataset';
  readonly status = 'Available' as const;

  async getLayers(watershedId?: string): Promise<SatelliteLayerInfo[]> {
    return sampleSatelliteLayers.map(layer => ({
      ...layer,
      provider: 'DEMO DATA'
    }));
  }

  async getLayerMetadata(layerId: string, year = 2026): Promise<any> {
    return {
      layerId,
      sourceType: 'demo',
      sourceName: 'Demo Watershed Dataset',
      sourceProvider: 'DemoSatelliteProvider',
      spatialResolutionMeters: 30,
      sensor: layerId.includes('dem') ? 'CartoDEM (Demo Grid)' : 'AWiFS / LISS-III (Demo Grid)',
      acquisitionWindow: `Post-Monsoon Kharif Cycle ${year} (Demo Simulation)`,
      isOfficialData: false,
      disclaimer: 'DEMO DATA — NOT OFFICIAL SATELLITE DATA'
    };
  }

  async getRasterData(layerId: string, bounds?: any): Promise<any> {
    return {
      sourceType: 'demo',
      spatialResolution: '30 meters (Simulated)',
      gridType: 'Deterministic Raster Grid',
      coordinateSystem: 'EPSG:4326',
      disclaimer: 'DEMO DATA — NOT OFFICIAL SATELLITE DATA'
    };
  }

  async getTimeSeries(layerId: string, location?: [number, number]): Promise<any> {
    return {
      sourceType: 'demo',
      location: location || [25.345, 74.638],
      timeSeries: [
        { year: 2022, demoVegetationIndicator: 0.22, demoWaterSpreadKm2: 3.8 },
        { year: 2023, demoVegetationIndicator: 0.28, demoWaterSpreadKm2: 4.9 },
        { year: 2024, demoVegetationIndicator: 0.42, demoWaterSpreadKm2: 6.4 },
        { year: 2025, demoVegetationIndicator: 0.49, demoWaterSpreadKm2: 7.6 },
        { year: 2026, demoVegetationIndicator: 0.56, demoWaterSpreadKm2: 8.9 }
      ],
      disclaimer: 'DEMO DATA — NOT OFFICIAL SATELLITE DATA'
    };
  }

  async getAvailableDates(layerId: string): Promise<number[]> {
    return [2022, 2023, 2024, 2025, 2026];
  }

  getStatus(): ProviderStatusInfo {
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      status: 'Available',
      message: 'Active local demonstration dataset. Deterministic 30m spatial data.',
      disclaimer: 'DEMO DATA — NOT OFFICIAL SATELLITE DATA',
      requiresAuthorization: false
    };
  }
}

/**
 * BhuvanProvider
 * Integration-ready adapter for official ISRO / NRSC Bhuvan web services (WMS/WFS/WMTS).
 * Does not require or fabricate credentials.
 */
export class BhuvanProvider implements SatelliteDataProvider {
  readonly providerId = 'bhuvan';
  readonly providerName = 'Bhuvan / NRSC (Integration Ready)';
  readonly status = 'Integration Ready' as const;

  // Future integration:
  // Connect to the officially authorized Bhuvan/NRSC service here.
  // Do not hard-code credentials.
  // Credentials/endpoints must be supplied only after official access is obtained.

  async getLayers(watershedId?: string): Promise<SatelliteLayerInfo[]> {
    return [];
  }

  async getLayerMetadata(layerId: string, year?: number): Promise<any> {
    return {
      layerId,
      sourceType: 'external',
      sourceProvider: 'Bhuvan/NRSC',
      serviceStatus: 'Official Bhuvan/NRSC service access has not been configured.',
      endpoint: 'Official service endpoint to be configured after authorized access.'
    };
  }

  async getRasterData(layerId: string, bounds?: any): Promise<any> {
    return null;
  }

  async getTimeSeries(layerId: string, location?: [number, number]): Promise<any> {
    return null;
  }

  async getAvailableDates(layerId: string): Promise<number[]> {
    return [];
  }

  getStatus(): ProviderStatusInfo {
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      status: 'Integration Ready',
      message: 'Official Bhuvan/NRSC service access has not been configured.',
      disclaimer: 'Requires authorized institutional access to NRSC/ISRO Bhuvan services.',
      requiresAuthorization: true
    };
  }
}

/**
 * SRISHTIDrishtiProvider
 * Integration-ready adapter for the Department of Land Resources (DoLR) / NRSC SRISHTI-DRISHTI platform.
 * Does not require or fabricate credentials.
 */
export class SRISHTIDrishtiProvider implements SatelliteDataProvider {
  readonly providerId = 'srishti';
  readonly providerName = 'SRISHTI-DRISHTI (Integration Ready)';
  readonly status = 'Integration Ready' as const;

  // Future integration:
  // Connect to the officially authorized SRISHTI-DRISHTI service here.
  // Do not hard-code credentials.
  // Credentials/endpoints must be supplied only after official access is obtained.

  async getLayers(watershedId?: string): Promise<SatelliteLayerInfo[]> {
    return [];
  }

  async getLayerMetadata(layerId: string, year?: number): Promise<any> {
    return {
      layerId,
      sourceType: 'external',
      sourceProvider: 'SRISHTI-DRISHTI',
      serviceStatus: 'SRISHTI-DRISHTI integration requires an authorized data/service connection. The current application is using demonstration data.',
      endpoint: 'Official service endpoint to be configured after authorized access.'
    };
  }

  async getRasterData(layerId: string, bounds?: any): Promise<any> {
    return null;
  }

  async getTimeSeries(layerId: string, location?: [number, number]): Promise<any> {
    return null;
  }

  async getAvailableDates(layerId: string): Promise<number[]> {
    return [];
  }

  getStatus(): ProviderStatusInfo {
    return {
      providerId: this.providerId,
      providerName: this.providerName,
      status: 'Integration Ready',
      message: 'SRISHTI-DRISHTI integration requires an authorized data/service connection. The current application is using demonstration data.',
      disclaimer: 'Requires approved departmental access through the Ministry of Rural Development / NRSC.',
      requiresAuthorization: true
    };
  }
}

/**
 * Provider Registry & Factory
 */
export const availableProviders: Record<string, SatelliteDataProvider> = {
  demo: new DemoSatelliteProvider(),
  bhuvan: new BhuvanProvider(),
  srishti: new SRISHTIDrishtiProvider()
};

// DATA_PROVIDER environment variable can select provider, defaults to 'demo'
const activeProviderKey = process.env.DATA_PROVIDER?.toLowerCase() || 'demo';
export const activeSatelliteProvider: SatelliteDataProvider =
  availableProviders[activeProviderKey] || availableProviders.demo;
