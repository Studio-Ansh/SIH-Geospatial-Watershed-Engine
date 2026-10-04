/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMap,
  useApiLoadingStatus,
  APILoadingStatus
} from '@vis.gl/react-google-maps';
import { 
  Layers, 
  Eye, 
  RotateCcw, 
  Sliders, 
  Info, 
  Maximize2,
  Sparkles,
  MapPin,
  ExternalLink,
  ChevronRight,
  Droplets,
  TreePine,
  Activity,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Watershed, 
  GeoImage, 
  Intervention, 
  ChangeDetectionResult,
  FocusTarget 
} from '../../types/index.js';
import { bottomCardVariants, layerPanelVariants, buttonTapProps } from '../../motion.js';

interface GISMapProps {
  watershed: Watershed;
  drainageData: any;
  waterBodiesData: any;
  images: GeoImage[];
  interventions: Intervention[];
  changeDetection?: ChangeDetectionResult;
  selectedYear: number;
  focusTarget?: FocusTarget | null;
  onClearFocusTarget?: () => void;
  onSelectImage: (image: GeoImage) => void;
  onSelectIntervention: (intervention: Intervention) => void;
  onAnalyzeImage: (image: GeoImage) => void;
  isVisible?: boolean;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCY8gtuv8bi2TEQIeHcqfA3UBR9XUT2b4g';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Ray-casting point-in-polygon helper
function isPointInPolygon(lat: number, lng: number, polygonCoords: number[][][]): boolean {
  if (!polygonCoords || !polygonCoords[0]) return true;
  const ring = polygonCoords[0];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > lat) !== (yj > lat)) &&
      (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Seeded pseudo-noise generator
function seededPseudoNoise(seedStr: string): number {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const x = Math.sin(hash) * 10000;
  return x - Math.floor(x);
}

// Inner Controller for Google Maps Vector Overlays, GroundOverlays, and Camera Handling
interface MapInnerControllerProps {
  watershed: Watershed;
  drainageData: any;
  waterBodiesData: any;
  changeDetection?: ChangeDetectionResult;
  selectedYear: number;
  activeThematicType: 'ndvi' | 'ndwi' | 'lulc' | 'none';
  rasterOpacity: number;
  layersVisibility: {
    boundary: boolean;
    drainage: boolean;
    waterBodies: boolean;
    villages: boolean;
    geoPhotos: boolean;
    interventions: boolean;
    thematic30m: boolean;
    changeDetection: boolean;
  };
  focusTarget?: FocusTarget | null;
  onClearFocusTarget?: () => void;
  onSelectFeature: (feature: { type: string; data: any }) => void;
  resetTrigger: number;
}

const MapInnerController: React.FC<MapInnerControllerProps> = ({
  watershed,
  drainageData,
  waterBodiesData,
  changeDetection,
  selectedYear,
  activeThematicType,
  rasterOpacity,
  layersVisibility,
  focusTarget,
  onClearFocusTarget,
  onSelectFeature,
  resetTrigger
}) => {
  const map = useMap();

  // Vector Layer References
  const boundaryPolygonRef = useRef<google.maps.Polygon | null>(null);
  const drainagePolylinesRef = useRef<google.maps.Polyline[]>([]);
  const waterBodiesPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const changeParcelsPolygonsRef = useRef<google.maps.Polygon[]>([]);
  const groundOverlayRef = useRef<google.maps.GroundOverlay | null>(null);

  // Helper to fit watershed bounds
  const fitWatershedBounds = useCallback(() => {
    if (!map || !watershed || !watershed.boundaryGeoJson) return;
    const bounds = new google.maps.LatLngBounds();
    const ring = watershed.boundaryGeoJson.coordinates[0];
    if (ring && ring.length > 0) {
      ring.forEach((pt: any) => {
        const [lng, lat] = pt;
        bounds.extend({ lat, lng });
      });
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
    } else {
      map.setCenter({ lat: watershed.centerCoordinates[0], lng: watershed.centerCoordinates[1] });
      map.setZoom(13);
    }
  }, [map, watershed]);

  // Initial bounds & on watershed change
  useEffect(() => {
    if (map) {
      fitWatershedBounds();
    }
  }, [map, watershed.id, fitWatershedBounds]);

  // Reset Trigger listener
  useEffect(() => {
    if (map && resetTrigger > 0) {
      fitWatershedBounds();
    }
  }, [map, resetTrigger, fitWatershedBounds]);

  // Handle focusTarget (Locate on Map)
  useEffect(() => {
    if (!focusTarget || !map) return;
    map.panTo({ lat: focusTarget.lat, lng: focusTarget.lng });
    map.setZoom(16);
    if (onClearFocusTarget) {
      onClearFocusTarget();
    }
  }, [focusTarget, map, onClearFocusTarget]);

  // 1. Watershed Boundary Polygon
  useEffect(() => {
    if (!map) return;

    if (boundaryPolygonRef.current) {
      boundaryPolygonRef.current.setMap(null);
      boundaryPolygonRef.current = null;
    }

    if (!layersVisibility.boundary || !watershed.boundaryGeoJson) return;

    const ring = watershed.boundaryGeoJson.coordinates[0];
    const path = ring.map((pt: any) => ({ lat: pt[1], lng: pt[0] }));

    const polygon = new google.maps.Polygon({
      paths: path,
      strokeColor: '#0284c7',
      strokeOpacity: 0.95,
      strokeWeight: 2.5,
      fillColor: '#0284c7',
      fillOpacity: 0.08,
      map: map,
      zIndex: 5
    });

    polygon.addListener('click', () => {
      onSelectFeature({
        type: 'boundary',
        data: {
          title: `Watershed Boundary: ${watershed?.name || 'Catchment'}`,
          code: watershed?.code || '',
          area: `${watershed?.totalAreaKm2 || 0} km²`,
          villages: watershed?.villages?.length || 0
        }
      });
    });

    boundaryPolygonRef.current = polygon;

    return () => {
      polygon.setMap(null);
    };
  }, [map, watershed, layersVisibility.boundary, onSelectFeature]);

  // 2. Drainage Network Streams
  useEffect(() => {
    if (!map) return;

    drainagePolylinesRef.current.forEach(line => line.setMap(null));
    drainagePolylinesRef.current = [];

    if (!layersVisibility.drainage || !drainageData || !drainageData.features) return;

    const newPolylines: google.maps.Polyline[] = [];

    drainageData.features.forEach((feature: any) => {
      const isOrder3 = feature.properties?.order === 3;
      const coords = feature.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));

      const polyline = new google.maps.Polyline({
        path: coords,
        strokeColor: isOrder3 ? '#0284c7' : '#38bdf8',
        strokeOpacity: 0.88,
        strokeWeight: isOrder3 ? 3.5 : 2,
        map: map,
        zIndex: 10
      });

      polyline.addListener('click', () => {
        onSelectFeature({
          type: 'drainage',
          data: {
            title: feature.properties?.name || `Stream Line (Order ${feature.properties?.order || 1})`,
            order: feature.properties?.order || 1,
            lengthKm: feature.properties?.lengthKm || 0,
            flowRate: feature.properties?.flowRateM3s ? `${feature.properties.flowRateM3s} m³/s` : 'Perennial seasonal'
          }
        });
      });

      newPolylines.push(polyline);
    });

    drainagePolylinesRef.current = newPolylines;

    return () => {
      newPolylines.forEach(p => p.setMap(null));
    };
  }, [map, drainageData, layersVisibility.drainage, onSelectFeature]);

  // 3. Water Bodies / Storage Reservoirs
  useEffect(() => {
    if (!map) return;

    waterBodiesPolygonsRef.current.forEach(poly => poly.setMap(null));
    waterBodiesPolygonsRef.current = [];

    if (!layersVisibility.waterBodies || !waterBodiesData || !waterBodiesData.features) return;

    const newPolygons: google.maps.Polygon[] = [];

    waterBodiesData.features.forEach((feature: any) => {
      const ring = feature.geometry.coordinates[0];
      const paths = ring.map(([lng, lat]: [number, number]) => ({ lat, lng }));

      const polygon = new google.maps.Polygon({
        paths,
        strokeColor: '#0369a1',
        strokeOpacity: 0.9,
        strokeWeight: 1.5,
        fillColor: '#0284c7',
        fillOpacity: 0.55,
        map: map,
        zIndex: 15
      });

      polygon.addListener('click', () => {
        onSelectFeature({
          type: 'waterBody',
          data: feature.properties
        });
      });

      newPolygons.push(polygon);
    });

    waterBodiesPolygonsRef.current = newPolygons;

    return () => {
      newPolygons.forEach(p => p.setMap(null));
    };
  }, [map, waterBodiesData, layersVisibility.waterBodies, onSelectFeature]);

  // 4. Change Detection Parcels
  useEffect(() => {
    if (!map) return;

    changeParcelsPolygonsRef.current.forEach(poly => poly.setMap(null));
    changeParcelsPolygonsRef.current = [];

    if (!layersVisibility.changeDetection || !changeDetection?.detectedParcels) return;

    const newPolygons: google.maps.Polygon[] = [];

    changeDetection.detectedParcels.forEach((parcel) => {
      const ring = parcel.coordinates || [];
      const paths = ring.map((pt: any) => ({ lat: pt[0], lng: pt[1] }));

      const polygon = new google.maps.Polygon({
        paths,
        strokeColor: '#d97706',
        strokeOpacity: 0.95,
        strokeWeight: 2,
        fillColor: '#f59e0b',
        fillOpacity: 0.35,
        map: map,
        zIndex: 20
      });

      polygon.addListener('click', () => {
        onSelectFeature({
          type: 'changeParcel',
          data: {
            title: `Change Zone: ${parcel.type}`,
            category: parcel.type,
            areaHectares: `${parcel.areaHectares} ha`,
            confidenceScore: parcel.confidence,
            notes: parcel.description
          }
        });
      });

      newPolygons.push(polygon);
    });

    changeParcelsPolygonsRef.current = newPolygons;

    return () => {
      newPolygons.forEach(p => p.setMap(null));
    };
  }, [map, changeDetection, layersVisibility.changeDetection, onSelectFeature]);

  // 5. 30m Simulated Raster Thematic Overlay (NDVI, NDWI, LULC)
  useEffect(() => {
    if (!map) return;

    if (groundOverlayRef.current) {
      groundOverlayRef.current.setMap(null);
      groundOverlayRef.current = null;
    }

    if (activeThematicType === 'none' || !layersVisibility.thematic30m || !watershed.boundaryGeoJson) {
      return;
    }

    // Compute bounding box
    const ring = watershed.boundaryGeoJson.coordinates[0];
    let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
    ring.forEach((pt: any) => {
      const [lng, lat] = pt;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    });

    const gridCols = 36;
    const gridRows = 30;
    const svgWidth = 360;
    const svgHeight = 300;
    const cellW = svgWidth / gridCols;
    const cellH = svgHeight / gridRows;

    let cellsSvg = '';

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const cellLat = minLat + (maxLat - minLat) * ((gridRows - r - 0.5) / gridRows);
        const cellLng = minLng + (maxLng - minLng) * ((c + 0.5) / gridCols);

        if (!isPointInPolygon(cellLat, cellLng, watershed.boundaryGeoJson.coordinates)) {
          continue;
        }

        const seed = `${watershed.id}_${selectedYear}_${activeThematicType}_${c}_${r}`;
        const noise = seededPseudoNoise(seed);

        let cellColor = '#65a30d';
        let cellOpacity = 0.82;

        if (activeThematicType === 'ndvi') {
          const yearBonus = (selectedYear - 2022) * 0.04;
          const ndvi = Math.min(0.85, Math.max(0.05, 0.18 + noise * 0.52 + yearBonus));

          if (ndvi > 0.60) {
            cellColor = '#15803d'; // Dense Canopy
          } else if (ndvi > 0.45) {
            cellColor = '#65a30d'; // Moderate Crop
          } else if (ndvi > 0.30) {
            cellColor = '#facc15'; // Sparse/Scrub
          } else if (ndvi > 0.15) {
            cellColor = '#d97706'; // Barren
          } else {
            cellColor = '#0284c7'; // Water
          }
        } else if (activeThematicType === 'ndwi') {
          const centerDist = Math.hypot((c - gridCols / 2) / gridCols, (r - gridRows / 2) / gridRows);
          const waterProb = noise * 0.7 + (1 - centerDist) * 0.4;

          if (waterProb > 0.70) {
            cellColor = '#0369a1';
          } else if (waterProb > 0.52) {
            cellColor = '#38bdf8';
          } else if (waterProb > 0.38) {
            cellColor = '#0d9488';
          } else {
            cellColor = '#f1f5f9';
            cellOpacity = 0.15;
          }
        } else if (activeThematicType === 'lulc') {
          const lulcIdx = Math.floor(noise * 6);
          const colors = ['#84cc16', '#166534', '#ca8a04', '#b45309', '#0284c7', '#ef4444'];
          cellColor = colors[lulcIdx];
        }

        cellsSvg += `<rect x="${(c * cellW).toFixed(1)}" y="${(r * cellH).toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellH.toFixed(1)}" fill="${cellColor}" opacity="${cellOpacity}"/>`;
      }
    }

    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">${cellsSvg}</svg>`;
    const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`;

    const overlay = new google.maps.GroundOverlay(
      svgUrl,
      { north: maxLat, south: minLat, east: maxLng, west: minLng },
      { opacity: rasterOpacity }
    );

    overlay.setMap(map);
    groundOverlayRef.current = overlay;

    return () => {
      overlay.setMap(null);
    };
  }, [map, activeThematicType, selectedYear, watershed, layersVisibility.thematic30m, rasterOpacity]);

  // Update opacity dynamically
  useEffect(() => {
    if (groundOverlayRef.current) {
      groundOverlayRef.current.setOpacity(rasterOpacity);
    }
  }, [rasterOpacity]);

  return null;
};

const MapStatusIndicator: React.FC = () => {
  const status = useApiLoadingStatus();
  if (status === APILoadingStatus.LOADING) {
    return (
      <div className="absolute inset-0 bg-[#171717]/90 backdrop-blur-sm flex flex-col items-center justify-center z-[500] text-white pointer-events-none">
        <div className="w-9 h-9 rounded-full border-2 border-[#41a1cf] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-mono tracking-wider font-semibold text-[#fefffc]">
          INITIALIZING GOOGLE MAPS PLATFORM...
        </p>
        <span className="text-[10px] text-[#646464] font-mono mt-1">Satellite Orthoimagery &amp; 30m Overlays</span>
      </div>
    );
  }
  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="absolute inset-0 bg-[#171717] flex flex-col items-center justify-center z-[500] text-white p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400 mb-3 text-xl">
          ⚠️
        </div>
        <h3 className="font-serif text-base text-amber-200">Google Maps Platform Notice</h3>
        <p className="text-xs text-amber-300/80 mt-1 max-w-md">
          Unable to complete map handshake. Please verify your connection or inspect console logs.
        </p>
      </div>
    );
  }
  return null;
};

export const GISMap: React.FC<GISMapProps> = ({
  watershed,
  drainageData,
  waterBodiesData,
  images,
  interventions,
  changeDetection,
  selectedYear,
  focusTarget,
  onClearFocusTarget,
  onSelectImage,
  onSelectIntervention,
  onAnalyzeImage,
  isVisible = true
}) => {
  // Map Type state: 'hybrid' (satellite + roads), 'terrain' (contour GIS), 'roadmap' (standard streets)
  const [googleMapTypeId, setGoogleMapTypeId] = useState<string>('hybrid');
  const [activeThematicType, setActiveThematicType] = useState<'ndvi' | 'ndwi' | 'lulc' | 'none'>('ndvi');
  const [rasterOpacity, setRasterOpacity] = useState<number>(0.65);
  const [selectedFeature, setSelectedFeature] = useState<{ type: string; data: any } | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [pulsingTargetId, setPulsingTargetId] = useState<string | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Layer Visibility
  const [layersVisibility, setLayersVisibility] = useState({
    boundary: true,
    drainage: true,
    waterBodies: true,
    villages: true,
    geoPhotos: true,
    interventions: true,
    thematic30m: true,
    changeDetection: true
  });

  // Handle focus target highlighting
  useEffect(() => {
    if (!focusTarget) return;
    setPulsingTargetId(focusTarget.id);
    const timer = setTimeout(() => setPulsingTargetId(null), 8000);

    if (focusTarget.kind === 'image') {
      const img = images.find(i => i.id === focusTarget.id);
      if (img) setSelectedFeature({ type: 'image', data: img });
    } else if (focusTarget.kind === 'intervention') {
      const intv = interventions.find(i => i.id === focusTarget.id);
      if (intv) setSelectedFeature({ type: 'intervention', data: intv });
    } else if (focusTarget.kind === 'village') {
      const v = watershed.villages.find(vil => vil.id === focusTarget.id);
      if (v) setSelectedFeature({ type: 'village', data: v });
    }

    return () => clearTimeout(timer);
  }, [focusTarget, images, interventions, watershed]);

  // Center Coordinates for Google Map
  const defaultCenter = useMemo(() => ({
    lat: watershed.centerCoordinates[0],
    lng: watershed.centerCoordinates[1]
  }), [watershed.centerCoordinates]);

  return (
    <div className="relative w-full h-full bg-[#171717] overflow-hidden flex flex-col" style={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 61px)' }}>
      
      {/* Top Floating Control Bar - Styled to match user reference */}
      <div className="absolute top-3 left-3 z-[2000] flex flex-wrap items-center gap-2 pointer-events-auto select-none">
        
        {/* Base Map Selector (Satellite / Light GIS / Streets) */}
        <div className="flex items-center bg-[#ffffff]/95 backdrop-blur-md p-1 rounded-xl border border-[#dee2de] shadow-md">
          <button
            onClick={() => setGoogleMapTypeId('hybrid')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              googleMapTypeId === 'hybrid'
                ? 'bg-[#1f1f29] text-white shadow-sm'
                : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setGoogleMapTypeId('terrain')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              googleMapTypeId === 'terrain'
                ? 'bg-[#1f1f29] text-white shadow-sm'
                : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            Light GIS
          </button>
          <button
            onClick={() => setGoogleMapTypeId('roadmap')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              googleMapTypeId === 'roadmap'
                ? 'bg-[#1f1f29] text-white shadow-sm'
                : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            Streets
          </button>
        </div>

        {/* 30m Remote Sensing Thematic Layer Switcher (NDVI / NDWI / LULC / Off) */}
        <div className="flex items-center bg-[#ffffff]/95 backdrop-blur-md p-1 rounded-xl border border-[#dee2de] shadow-md">
          <button
            onClick={() => setActiveThematicType('ndvi')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeThematicType === 'ndvi'
                ? 'bg-[#1f1f29] text-white shadow-sm font-semibold'
                : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            <TreePine className="w-3.5 h-3.5" />
            <span>NDVI 30m</span>
          </button>
          <button
            onClick={() => setActiveThematicType('ndwi')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeThematicType === 'ndwi'
                ? 'bg-[#1f1f29] text-white shadow-sm font-semibold'
                : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>NDWI 30m</span>
          </button>
          <button
            onClick={() => setActiveThematicType('lulc')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeThematicType === 'lulc'
                ? 'bg-[#1f1f29] text-white shadow-sm font-semibold'
                : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            LULC
          </button>
          <button
            onClick={() => setActiveThematicType('none')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              activeThematicType === 'none'
                ? 'bg-[#1f1f29] text-white shadow-sm font-semibold'
                : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            Off
          </button>
        </div>

        {/* Reset Camera View Button */}
        <button
          onClick={() => setResetTrigger(prev => prev + 1)}
          className="p-2 bg-[#ffffff]/95 backdrop-blur-md border border-[#dee2de] rounded-xl shadow-md text-[#444141] hover:text-[#171717] hover:border-[#41a1cf] transition-all flex items-center justify-center"
          title="Reset to Catchment Boundary"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Layer Panel Toggle Button */}
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`flex items-center gap-1.5 px-3.5 py-2 bg-[#ffffff]/95 backdrop-blur-md border rounded-xl shadow-md text-xs font-medium transition-all ${
            showLayerPanel ? 'border-[#41a1cf] text-[#41a1cf] ring-2 ring-[#41a1cf]/20' : 'border-[#dee2de] text-[#171717] hover:border-[#41a1cf]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Layers ({Object.values(layersVisibility).filter(Boolean).length})</span>
        </button>
      </div>

      {/* Floating Layer Controls Panel */}
      <AnimatePresence>
        {showLayerPanel && (
          <motion.div
            variants={layerPanelVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute top-16 left-3 z-[2100] w-72 bg-[#ffffff]/95 backdrop-blur-md border border-[#dee2de] rounded-2xl p-4 shadow-2xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#dee2de]">
              <span className="font-serif font-medium text-sm text-[#171717]">GIS Layer Manager</span>
              <span className="text-[10px] font-mono text-[#646464]">WGS 84</span>
            </div>

            {/* Raster Opacity Slider */}
            {activeThematicType !== 'none' && layersVisibility.thematic30m && (
              <div className="p-2.5 bg-[#f9faf7] rounded-xl border border-[#dee2de] space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#646464]">30m Raster Opacity:</span>
                  <span className="font-mono font-bold text-[#171717]">{Math.round(rasterOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={rasterOpacity}
                  onChange={(e) => setRasterOpacity(parseFloat(e.target.value))}
                  className="w-full accent-[#41a1cf] cursor-pointer"
                />
              </div>
            )}

            {/* Vector & Raster Layer Checkboxes */}
            <div className="space-y-1.5 text-xs max-h-60 overflow-y-auto pr-1">
              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-[#0284c7]"></span>
                  <span className="text-[#2c2c2c] font-medium">Catchment Boundary</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.boundary}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, boundary: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-0.5 bg-[#0284c7]"></span>
                  <span className="text-[#2c2c2c] font-medium">Drainage Streams</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.drainage}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, drainage: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-[#38bdf8] border border-[#0369a1]"></span>
                  <span className="text-[#2c2c2c] font-medium">Water Bodies</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.waterBodies}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, waterBodies: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
                  <span className="text-[#2c2c2c] font-medium">Villages ({watershed.villages.length})</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.villages}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, villages: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#15803d]"></span>
                  <span className="text-[#2c2c2c] font-medium">Interventions ({interventions.length})</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.interventions}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, interventions: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                  <span className="text-[#2c2c2c] font-medium">Geo-coded Photos ({images.length})</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.geoPhotos}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, geoPhotos: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-lime-400 border border-emerald-600"></span>
                  <span className="text-[#2c2c2c] font-medium">30m Thematic Raster</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.thematic30m}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, thematic30m: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-2 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-400 border border-amber-600"></span>
                  <span className="text-[#2c2c2c] font-medium">Change Parcels</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.changeDetection}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, changeDetection: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Google Maps Canvas */}
      <div className="flex-1 w-full h-full relative" style={{ width: '100%', height: '100%', minHeight: 'calc(100vh - 120px)' }}>
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['marker', 'geometry']}>
          <MapStatusIndicator />
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={defaultCenter}
            defaultZoom={13}
            mapTypeId={googleMapTypeId}
            gestureHandling="greedy"
            disableDefaultUI={true}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            className="w-full h-full"
          >
            {/* Inner Controller for Polygons, Polylines, GroundOverlays, and Camera */}
            <MapInnerController
              watershed={watershed}
              drainageData={drainageData}
              waterBodiesData={waterBodiesData}
              changeDetection={changeDetection}
              selectedYear={selectedYear}
              activeThematicType={activeThematicType}
              rasterOpacity={rasterOpacity}
              layersVisibility={layersVisibility}
              focusTarget={focusTarget}
              onClearFocusTarget={onClearFocusTarget}
              onSelectFeature={setSelectedFeature}
              resetTrigger={resetTrigger}
            />

            {/* Advanced Markers: Geo-coded Photographs */}
            {layersVisibility.geoPhotos && images.map((img) => {
              const isPulsing = pulsingTargetId === img.id;
              const isCheckDam = img.interventionType === 'Check Dam';
              const isFarmPond = img.interventionType === 'Farm Pond';
              const badgeColor = isCheckDam ? '#0284c7' : isFarmPond ? '#10b981' : '#f59e0b';

              return (
                <AdvancedMarker
                  key={img.id}
                  position={{ lat: img.latitude, lng: img.longitude }}
                  onClick={() => {
                    setSelectedFeature({ type: 'image', data: img });
                    onSelectImage(img);
                  }}
                  title={img.title}
                >
                  <div className="relative group cursor-pointer -translate-x-1/2 -translate-y-1/2">
                    {isPulsing && (
                      <span className="absolute -inset-2 rounded-full border-2 border-[#41a1cf] animate-ping pointer-events-none" />
                    )}
                    <div className="w-9 h-9 rounded-full bg-[#ffffff] border-2 border-[#1f1f29] shadow-lg flex items-center justify-center overflow-hidden hover:scale-115 transition-transform duration-200">
                      <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                    </div>
                    <div 
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border border-white flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                      style={{ backgroundColor: badgeColor }}
                    >
                      📷
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Advanced Markers: Watershed Interventions */}
            {layersVisibility.interventions && interventions.map((intv) => {
              const isPulsing = pulsingTargetId === intv.id;
              const isOperational = intv.status === 'Operational';

              return (
                <AdvancedMarker
                  key={intv.id}
                  position={{ lat: intv.latitude, lng: intv.longitude }}
                  onClick={() => {
                    setSelectedFeature({ type: 'intervention', data: intv });
                    onSelectIntervention(intv);
                  }}
                  title={`${intv?.name || 'Structure'} (${intv?.status || ''})`}
                >
                  <div className="relative group cursor-pointer -translate-x-1/2 -translate-y-1/2">
                    {isPulsing && (
                      <span className="absolute -inset-2 rounded-full border-2 border-[#41a1cf] animate-ping pointer-events-none" />
                    )}
                    <div 
                      className={`w-7 h-7 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-[11px] font-bold hover:scale-115 transition-transform duration-200 ${
                        isOperational ? 'bg-[#15803d]' : 'bg-[#d97706]'
                      }`}
                    >
                      {intv.type === 'Check Dam' ? '🧱' : intv.type === 'Farm Pond' ? '💧' : '🌱'}
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Advanced Markers: Village Settlements */}
            {layersVisibility.villages && (watershed?.villages || []).map((v) => {
              const isPulsing = pulsingTargetId === v.id;

              return (
                <AdvancedMarker
                  key={v.id}
                  position={{ lat: v.latitude, lng: v.longitude }}
                  onClick={() => {
                    setSelectedFeature({ type: 'village', data: v });
                  }}
                  title={v?.name || 'Village'}
                >
                  <div className="relative cursor-pointer -translate-x-1/2 -translate-y-1/2">
                    {isPulsing && (
                      <span className="absolute -inset-1 rounded border-2 border-[#41a1cf] animate-ping pointer-events-none" />
                    )}
                    <div className="px-2 py-0.5 bg-[#ffffff]/95 backdrop-blur-sm border border-[#282834] rounded shadow-md text-[11px] font-sans font-medium text-[#171717] flex items-center gap-1.5 hover:scale-105 transition-transform whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                      <span>{v?.name || 'Village'}</span>
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}
          </Map>
        </APIProvider>
      </div>

      {/* Feature Inspection Card (Slide up from bottom) */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            variants={bottomCardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[1000] bg-[#ffffff] border border-[#dee2de] rounded-2xl p-4 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#dee2de]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#646464] bg-[#f9faf7] px-2 py-0.5 rounded border border-[#dee2de]">
                  {selectedFeature.type === 'image' ? 'Geo-coded Photograph' :
                   selectedFeature.type === 'intervention' ? 'Watershed Structure' :
                   selectedFeature.type === 'village' ? 'Village Habitation' :
                   selectedFeature.type === 'waterBody' ? 'Water Body Reservoir' : 
                   selectedFeature.type === 'drainage' ? 'Drainage Stream' : 'Spatial Change Parcel'}
                </span>
                <h3 className="font-serif font-medium text-sm text-[#171717] mt-1">
                  {selectedFeature.data?.title || selectedFeature.data?.name || 'Selected Entity'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                aria-label="Close feature card"
                className="text-[#646464] hover:text-[#171717] p-1 rounded-lg hover:bg-[#f9faf7]"
              >
                ✕
              </button>
            </div>

            <div className="mt-2.5 text-xs space-y-2.5">
              {selectedFeature.type === 'image' && (
                <>
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-[#dee2de] bg-[#f9faf7]">
                    <img
                      src={selectedFeature.data.imageUrl}
                      alt={selectedFeature.data.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#646464]">GPS Location:</span>
                      <p className="font-mono font-medium text-[#171717]">
                        {selectedFeature.data.latitude.toFixed(4)}°N, {selectedFeature.data.longitude.toFixed(4)}°E
                      </p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Classified As:</span>
                      <p className="font-medium text-[#0284c7]">
                        {selectedFeature.data.analysis?.classification || selectedFeature.data.interventionType}
                      </p>
                    </div>
                  </div>
                  <p className="text-[#444141] line-clamp-2 text-[11px]">
                    {selectedFeature.data.fieldNotes}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        onAnalyzeImage(selectedFeature.data);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-[#41a1cf] text-[#41a1cf] hover:bg-[#41a1cf]/10 font-medium text-xs transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>View AI Analysis</span>
                    </button>
                    <button
                      onClick={() => onSelectImage(selectedFeature.data)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </>
              )}

              {selectedFeature.type === 'intervention' && (
                <>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#646464]">Type:</span>
                      <p className="font-medium text-[#171717]">{selectedFeature.data.type}</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Status:</span>
                      <p className="font-medium text-[#15803d]">{selectedFeature.data.status}</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Installed:</span>
                      <p className="font-mono text-[#171717]">{selectedFeature.data.installationYear}</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Village:</span>
                      <p className="text-[#171717]">{selectedFeature.data.villageName}</p>
                    </div>
                  </div>
                  {selectedFeature.data.storageCapacityM3 && (
                    <p className="text-[#0284c7] font-medium text-[11px]">
                      Storage Capacity: {selectedFeature.data.storageCapacityM3.toLocaleString()} m³
                    </p>
                  )}
                  <p className="text-[#646464] text-[11px]">
                    Agency: {selectedFeature.data.contractorOrPanchayat}
                  </p>
                  <button
                    onClick={() => {
                      onSelectIntervention(selectedFeature.data);
                    }}
                    className="w-full mt-1 py-1.5 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors text-center"
                  >
                    Open Structure Dossier
                  </button>
                </>
              )}

              {selectedFeature.type === 'waterBody' && (
                <div className="space-y-2 mt-1">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#f9faf7] p-2.5 rounded-xl border border-[#dee2de]">
                    <div>
                      <span className="text-[#646464]">Surface Area:</span>
                      <p className="font-mono font-medium text-[#171717]">{selectedFeature.data.areaHectares || 14.5} ha</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Storage Potential:</span>
                      <p className="font-mono font-medium text-[#0284c7]">
                        {selectedFeature.data.storageCapacityM3 ? `${selectedFeature.data.storageCapacityM3.toLocaleString()} m³` : '42,000 m³'}
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#646464]">
                    Type: {selectedFeature.data.type || 'Percolation Tank'} • Status: {selectedFeature.data.status || 'Active'}
                  </p>
                </div>
              )}

              {selectedFeature.type === 'drainage' && (
                <div className="space-y-2 mt-1">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#f9faf7] p-2.5 rounded-xl border border-[#dee2de]">
                    <div>
                      <span className="text-[#646464]">Stream Order:</span>
                      <p className="font-mono font-medium text-[#171717]">Order {selectedFeature.data.order}</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Length:</span>
                      <p className="font-mono font-medium text-[#171717]">{selectedFeature.data.lengthKm} km</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#646464]">
                    Flow Rate: {selectedFeature.data.flowRate}
                  </p>
                </div>
              )}

              {selectedFeature.type === 'village' && (
                <div className="space-y-2 mt-1">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#f9faf7] p-2.5 rounded-xl border border-[#dee2de]">
                    <div>
                      <span className="text-[#646464]">Population:</span>
                      <p className="font-mono font-medium text-[#171717]">{(selectedFeature.data.population || 1200).toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Households:</span>
                      <p className="font-mono font-medium text-[#171717]">{selectedFeature.data.households || 240}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#646464] font-mono">
                    Coords: {selectedFeature.data.latitude.toFixed(4)}°N, {selectedFeature.data.longitude.toFixed(4)}°E
                  </p>
                </div>
              )}

              {selectedFeature.type === 'changeParcel' && (
                <div className="space-y-2 mt-1">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#f9faf7] p-2.5 rounded-xl border border-[#dee2de]">
                    <div>
                      <span className="text-[#646464]">Area:</span>
                      <p className="font-mono font-medium text-[#171717]">{selectedFeature.data.areaHectares}</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">AI Confidence:</span>
                      <p className="font-mono font-medium text-[#15803d]">{selectedFeature.data.confidenceScore}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#444141]">
                    {selectedFeature.data.notes}
                  </p>
                </div>
              )}

              {selectedFeature.type === 'boundary' && (
                <div className="space-y-2 mt-1">
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#f9faf7] p-2.5 rounded-xl border border-[#dee2de]">
                    <div>
                      <span className="text-[#646464]">Catchment Code:</span>
                      <p className="font-mono font-medium text-[#171717]">{selectedFeature.data.code}</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Total Area:</span>
                      <p className="font-mono font-medium text-[#0284c7]">{selectedFeature.data.area}</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#646464]">
                    Gram Panchayats: {selectedFeature.data.villages} habitations
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
