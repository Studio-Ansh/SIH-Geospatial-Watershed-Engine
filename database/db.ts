import fs from 'fs';
import path from 'path';
import { 
  sampleWatersheds, 
  sampleInterventions, 
  sampleGeoImages, 
  sampleDrainageNetwork, 
  sampleWaterBodies,
  sampleSatelliteLayers
} from './seedData.js';
import { Watershed, Intervention, GeoImage, ImageAnalysisResult, SatelliteLayerInfo } from '../models/index.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const INTERVENTIONS_FILE = path.join(DATA_DIR, 'interventions.json');
const GEOIMAGES_FILE = path.join(DATA_DIR, 'geoImages.json');

class DatabaseRepository {
  private interventions: Intervention[] = [];
  private geoImages: GeoImage[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(INTERVENTIONS_FILE)) {
        this.interventions = JSON.parse(fs.readFileSync(INTERVENTIONS_FILE, 'utf-8'));
      } else {
        this.interventions = [...sampleInterventions];
        fs.writeFileSync(INTERVENTIONS_FILE, JSON.stringify(this.interventions, null, 2));
      }
    } catch {
      this.interventions = [...sampleInterventions];
    }

    try {
      if (fs.existsSync(GEOIMAGES_FILE)) {
        this.geoImages = JSON.parse(fs.readFileSync(GEOIMAGES_FILE, 'utf-8'));
      } else {
        this.geoImages = [...sampleGeoImages];
        fs.writeFileSync(GEOIMAGES_FILE, JSON.stringify(this.geoImages, null, 2));
      }
    } catch {
      this.geoImages = [...sampleGeoImages];
    }
  }

  private persist() {
    try {
      fs.writeFileSync(INTERVENTIONS_FILE, JSON.stringify(this.interventions, null, 2));
      fs.writeFileSync(GEOIMAGES_FILE, JSON.stringify(this.geoImages, null, 2));
    } catch (err) {
      console.error('Database write error:', err);
    }
  }

  // Watershed queries
  public getWatersheds(): Watershed[] {
    return sampleWatersheds;
  }

  public getWatershedById(id: string): Watershed | undefined {
    return sampleWatersheds.find(w => w.id === id);
  }

  // Layer queries
  public getWatershedLayers(watershedId: string) {
    const drainageMap = sampleDrainageNetwork as Record<string, any>;
    const waterBodiesMap = sampleWaterBodies as Record<string, any>;
    const drainage = drainageMap[watershedId] || drainageMap['sw-04'];
    const waterBodies = waterBodiesMap[watershedId] || waterBodiesMap['sw-04'];
    return { drainage, waterBodies };
  }

  public getSatelliteLayers(): SatelliteLayerInfo[] {
    return sampleSatelliteLayers;
  }

  // Intervention queries and mutations
  public getInterventions(filters: { watershedId?: string; type?: string; status?: string } = {}): Intervention[] {
    let result = [...this.interventions];
    if (filters.watershedId) {
      result = result.filter(i => i.watershedId === filters.watershedId);
    }
    if (filters.type && filters.type !== 'ALL') {
      result = result.filter(i => i.type === filters.type);
    }
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(i => i.status === filters.status);
    }
    return result;
  }

  public getInterventionById(id: string): Intervention | undefined {
    return this.interventions.find(i => i.id === id);
  }

  public addIntervention(intervention: Intervention): Intervention {
    this.interventions.unshift(intervention);
    this.persist();
    return intervention;
  }

  public linkImageToIntervention(interventionId: string, imageId: string): boolean {
    const target = this.interventions.find(i => i.id === interventionId);
    if (target && !target.linkedImageIds.includes(imageId)) {
      target.linkedImageIds.push(imageId);
      this.persist();
      return true;
    }
    return false;
  }

  // GeoImage queries and mutations
  public getGeoImages(filters: {
    watershedId?: string;
    villageId?: string;
    interventionType?: string;
    classificationCategory?: string;
    searchQuery?: string;
  } = {}): GeoImage[] {
    let result = [...this.geoImages];
    if (filters.watershedId) {
      result = result.filter(img => img.watershedId === filters.watershedId);
    }
    if (filters.villageId && filters.villageId !== 'ALL') {
      result = result.filter(img => img.villageId === filters.villageId);
    }
    if (filters.interventionType && filters.interventionType !== 'ALL') {
      result = result.filter(img => img.interventionType === filters.interventionType);
    }
    if (filters.classificationCategory && filters.classificationCategory !== 'ALL') {
      result = result.filter(img => img.analysis?.classification === filters.classificationCategory);
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(img =>
        img.title.toLowerCase().includes(q) ||
        img.fieldNotes.toLowerCase().includes(q) ||
        img.villageName.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getGeoImageById(id: string): GeoImage | undefined {
    return this.geoImages.find(img => img.id === id);
  }

  public addGeoImage(image: GeoImage): GeoImage {
    this.geoImages.unshift(image);
    if (image.interventionId) {
      this.linkImageToIntervention(image.interventionId, image.id);
    }
    this.persist();
    return image;
  }

  public updateGeoImageAnalysis(id: string, analysis: ImageAnalysisResult): GeoImage | null {
    const img = this.geoImages.find(i => i.id === id);
    if (!img) return null;
    img.analysis = analysis;
    this.persist();
    return img;
  }
}

export const db = new DatabaseRepository();
