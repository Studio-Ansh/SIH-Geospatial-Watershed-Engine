import { 
  Watershed, 
  GeoImage, 
  Intervention, 
  SatelliteLayerInfo, 
  ChangeDetectionResult, 
  ImageAnalysisResult 
} from '../types/index.js';

export async function fetchWatersheds(): Promise<Watershed[]> {
  const res = await fetch('/api/watersheds');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch watersheds');
  return json.data;
}

export async function fetchWatershedDetails(id: string): Promise<Watershed> {
  const res = await fetch(`/api/watersheds/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch watershed details');
  return json.data;
}

export async function fetchWatershedLayers(id: string): Promise<{ drainage: any; waterBodies: any }> {
  const res = await fetch(`/api/watersheds/${id}/layers`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch watershed layers');
  return json.data;
}

export async function fetchWatershedStats(id: string, year: number) {
  const res = await fetch(`/api/watersheds/${id}/statistics?year=${year}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch statistics');
  return json.data;
}

export async function fetchGeoImages(params: {
  watershedId?: string;
  villageId?: string;
  interventionType?: string;
  classificationCategory?: string;
  searchQuery?: string;
} = {}): Promise<GeoImage[]> {
  const query = new URLSearchParams();
  if (params.watershedId) query.set('watershedId', params.watershedId);
  if (params.villageId) query.set('villageId', params.villageId);
  if (params.interventionType) query.set('interventionType', params.interventionType);
  if (params.classificationCategory) query.set('classificationCategory', params.classificationCategory);
  if (params.searchQuery) query.set('searchQuery', params.searchQuery);

  const res = await fetch(`/api/images?${query.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch images');
  return json.data;
}

export async function uploadGeoImage(payload: {
  watershedId: string;
  title: string;
  imageUrl?: string;
  latitude: number;
  longitude: number;
  date?: string;
  villageId?: string;
  villageName?: string;
  interventionType?: string;
  interventionId?: string;
  inspectorName?: string;
  fieldNotes?: string;
  clientQuality?: {
    width?: number;
    height?: number;
    sharpnessScore?: number;
    gpsAccuracyMeters?: number;
  };
}): Promise<GeoImage> {
  const res = await fetch('/api/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to upload geo-coded image');
  return json.data;
}

export async function analyzeImage(payload: {
  imagePayload?: string;
  metadata: {
    latitude: number;
    longitude: number;
    date: string;
    villageId?: string;
    villageName?: string;
    userProposedType?: string;
    watershedId: string;
    notes?: string;
  };
}): Promise<ImageAnalysisResult> {
  const res = await fetch('/api/images/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to analyze image');
  return json.data;
}

export async function fetchInterventions(params: {
  watershedId?: string;
  type?: string;
  status?: string;
} = {}): Promise<Intervention[]> {
  const query = new URLSearchParams();
  if (params.watershedId) query.set('watershedId', params.watershedId);
  if (params.type) query.set('type', params.type);
  if (params.status) query.set('status', params.status);

  const res = await fetch(`/api/interventions?${query.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch interventions');
  return json.data;
}

export async function createIntervention(payload: Partial<Intervention> & { 
  watershedId: string; 
  name: string; 
  type: string; 
  latitude: number; 
  longitude: number;
  observations?: string;
}): Promise<Intervention> {
  const res = await fetch('/api/interventions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to create intervention');
  return json.data;
}

export async function fetchSatelliteLayers(providerId?: string): Promise<SatelliteLayerInfo[]> {
  const url = providerId ? `/api/satellite/layers?providerId=${providerId}` : '/api/satellite/layers';
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch satellite layers');
  return json.data;
}

export async function fetchSatelliteProviderStatus(providerId?: string) {
  const url = providerId ? `/api/satellite/provider-status?providerId=${providerId}` : '/api/satellite/provider-status';
  const res = await fetch(url);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch satellite provider status');
  return json;
}

export async function fetchSatelliteProviders() {
  const res = await fetch('/api/satellite/providers');
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to fetch providers');
  return json;
}

export async function fetchChangeDetection(params: {
  watershedId: string;
  baseYear: number;
  comparisonYear: number;
}): Promise<ChangeDetectionResult> {
  const query = new URLSearchParams({
    watershedId: params.watershedId,
    baseYear: params.baseYear.toString(),
    comparisonYear: params.comparisonYear.toString()
  });
  const res = await fetch(`/api/change-detection?${query.toString()}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to calculate change detection');
  return json.data;
}

export async function fetchAiWatershedSummary(
  watershedId: string, 
  baseYear: number, 
  comparisonYear: number
): Promise<{ summaryText: string; model: string; source: 'gemini' | 'fallback'; generatedAt: string }> {
  const res = await fetch('/api/ai/watershed-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ watershedId, baseYear, comparisonYear })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to generate AI watershed summary');
  return json.data;
}

export async function updateImageAnalysis(id: string, analysis: ImageAnalysisResult): Promise<GeoImage> {
  const res = await fetch(`/api/images/${id}/analysis`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysis })
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Failed to update image analysis');
  return json.data;
}
