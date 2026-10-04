import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  Activity
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer Group References
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const drainageLayerRef = useRef<L.GeoJSON | null>(null);
  const waterBodiesLayerRef = useRef<L.GeoJSON | null>(null);
  const imageMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const interventionMarkersLayerRef = useRef<L.LayerGroup | null>(null);
  const villageLayerRef = useRef<L.LayerGroup | null>(null);
  const thematicOverlayLayerRef = useRef<L.ImageOverlay | null>(null);
  const changeParcelsLayerRef = useRef<L.LayerGroup | null>(null);

  // Base map layer references
  const baseTilesRef = useRef<Record<string, L.TileLayer>>({});

  // UI Interactive States
  const [baseMapType, setBaseMapType] = useState<'satellite' | 'carto' | 'streets'>('carto');
  const [activeThematicType, setActiveThematicType] = useState<'ndvi' | 'ndwi' | 'lulc' | 'none'>('ndvi');
  const [rasterOpacity, setRasterOpacity] = useState<number>(0.65);
  const [selectedFeature, setSelectedFeature] = useState<{ type: string; data: any } | null>(null);
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [pulsingTargetId, setPulsingTargetId] = useState<string | null>(null);

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

  // Handle visibility changes when switching tabs without destroying map
  useEffect(() => {
    if (isVisible && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 50);
    }
  }, [isVisible]);

  // Handle focusTarget (Locate on Map)
  useEffect(() => {
    if (!focusTarget || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;
    
    // Fly to target coordinates
    map.flyTo([focusTarget.lat, focusTarget.lng], 16, { duration: 1.2 });
    setPulsingTargetId(focusTarget.id);

    // Open corresponding feature card
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

    if (onClearFocusTarget) {
      onClearFocusTarget();
    }
  }, [focusTarget, images, interventions, watershed]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: watershed.centerCoordinates,
        zoom: 13,
        zoomControl: false,
        attributionControl: false
      });

      // Add Zoom Control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Attribution
      L.control.attribution({ position: 'bottomleft', prefix: false })
        .addAttribution('© OpenStreetMap, CartoDB, DEMO 30m Satellite Overlays')
        .addTo(map);

      // Tile layers
      const satelliteTiles = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      );

      const cartoTiles = L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      );

      const streetTiles = L.tileLayer(
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        { maxZoom: 19 }
      );

      baseTilesRef.current = {
        satellite: satelliteTiles,
        carto: cartoTiles,
        streets: streetTiles
      };

      cartoTiles.addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Do not destroy map on tab toggle
    };
  }, []);

  // Update Base Map Tiles
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(baseTilesRef.current).forEach(tile => map.removeLayer(tile));
    const activeTile = baseTilesRef.current[baseMapType];
    if (activeTile) {
      activeTile.addTo(map);
    }
  }, [baseMapType]);

  // Fit bounds when watershed changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !watershed) return;

    if (boundaryLayerRef.current) {
      map.fitBounds(boundaryLayerRef.current.getBounds(), { padding: [30, 30] });
    } else {
      map.setView(watershed.centerCoordinates, 13);
    }
  }, [watershed.id]);

  // Render Watershed Boundary
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (boundaryLayerRef.current) {
      map.removeLayer(boundaryLayerRef.current);
      boundaryLayerRef.current = null;
    }

    if (!layersVisibility.boundary) return;

    const boundary = L.geoJSON(watershed.boundaryGeoJson as any, {
      style: {
        color: '#1f1f29',
        weight: 2.5,
        opacity: 0.9,
        fillColor: '#41a1cf',
        fillOpacity: 0.04,
        dashArray: '5, 5'
      }
    });

    boundary.bindTooltip(`Watershed Boundary: ${escapeHtml(watershed.name)} (${escapeHtml(watershed.code)})`, { sticky: true });
    boundary.addTo(map);
    boundaryLayerRef.current = boundary;

    // Fit map bounds on boundary creation
    map.fitBounds(boundary.getBounds(), { padding: [30, 30] });
  }, [watershed, layersVisibility.boundary]);

  // Render Drainage Network
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (drainageLayerRef.current) {
      map.removeLayer(drainageLayerRef.current);
      drainageLayerRef.current = null;
    }

    if (!layersVisibility.drainage || !drainageData) return;

    const drainage = L.geoJSON(drainageData, {
      style: (feature) => {
        const order = feature?.properties?.streamOrder || 1;
        return {
          color: '#0284c7',
          weight: order === 3 ? 3.0 : order === 2 ? 2.0 : 1.2,
          opacity: 0.85
        };
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          layer.bindTooltip(
            `Drainage Stream: ${escapeHtml(feature.properties.name || 'Nala')} (Order ${feature.properties.streamOrder})`,
            { sticky: true }
          );
        }
      }
    });

    drainage.addTo(map);
    drainageLayerRef.current = drainage;
  }, [drainageData, layersVisibility.drainage]);

  // Render Water Bodies
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (waterBodiesLayerRef.current) {
      map.removeLayer(waterBodiesLayerRef.current);
      waterBodiesLayerRef.current = null;
    }

    if (!layersVisibility.waterBodies || !waterBodiesData) return;

    const water = L.geoJSON(waterBodiesData, {
      style: {
        color: '#0369a1',
        weight: 1.5,
        fillColor: '#38bdf8',
        fillOpacity: 0.6
      },
      onEachFeature: (feature, layer) => {
        if (feature.properties) {
          layer.bindTooltip(
            `Water Body: ${escapeHtml(feature.properties.name || 'Storage Reservoir')}`,
            { sticky: true }
          );
          layer.on('click', () => {
            setSelectedFeature({ type: 'waterBody', data: feature.properties });
          });
        }
      }
    });

    water.addTo(map);
    waterBodiesLayerRef.current = water;
  }, [waterBodiesData, layersVisibility.waterBodies]);

  // Render Village Settlements
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (villageLayerRef.current) {
      map.removeLayer(villageLayerRef.current);
      villageLayerRef.current = null;
    }

    if (!layersVisibility.villages) return;

    const group = L.layerGroup();
    watershed.villages.forEach((village) => {
      const isPulsing = pulsingTargetId === village.id;
      const icon = L.divIcon({
        className: 'custom-marker-icon',
        html: `
          <div class="relative px-2 py-0.5 bg-[#ffffff] border border-[#282834] rounded shadow-sm text-[11px] font-sans font-medium text-[#171717] flex items-center gap-1 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap">
            ${isPulsing ? '<span class="absolute -inset-1 rounded border-2 border-[#41a1cf] animate-ping pointer-events-none"></span>' : ''}
            <span class="w-1.5 h-1.5 rounded-full bg-[#41a1cf]"></span>
            <span>${escapeHtml(village.name)}</span>
          </div>
        `,
        iconSize: [0, 0]
      });

      const marker = L.marker([village.latitude, village.longitude], { icon });
      marker.on('click', () => {
        setSelectedFeature({ type: 'village', data: village });
      });
      marker.addTo(group);
    });

    group.addTo(map);
    villageLayerRef.current = group;
  }, [watershed, layersVisibility.villages, pulsingTargetId]);

  // Render Geo-Coded Image Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (imageMarkersLayerRef.current) {
      map.removeLayer(imageMarkersLayerRef.current);
      imageMarkersLayerRef.current = null;
    }

    if (!layersVisibility.geoPhotos) return;

    const group = L.layerGroup();

    images.forEach((img) => {
      const isCheckDam = img.interventionType === 'Check Dam';
      const isFarmPond = img.interventionType === 'Farm Pond';
      const badgeColor = isCheckDam ? '#0284c7' : isFarmPond ? '#10b981' : '#f59e0b';
      const isPulsing = pulsingTargetId === img.id;

      const icon = L.divIcon({
        className: 'custom-marker-icon',
        html: `
          <div class="relative group cursor-pointer -translate-x-1/2 -translate-y-1/2">
            ${isPulsing ? '<span class="absolute -inset-2 rounded-full border-2 border-[#41a1cf] animate-ping pointer-events-none"></span>' : ''}
            <div class="w-9 h-9 rounded-full bg-[#ffffff] border-2 border-[#1f1f29] shadow-md flex items-center justify-center overflow-hidden hover:scale-110 transition-transform">
              <img src="${img.imageUrl}" alt="${escapeHtml(img.title)}" class="w-full h-full object-cover" />
            </div>
            <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-sm" style="background-color: ${badgeColor}">
              📷
            </div>
          </div>
        `,
        iconSize: [0, 0]
      });

      const marker = L.marker([img.latitude, img.longitude], { icon });
      marker.on('click', () => {
        setSelectedFeature({ type: 'image', data: img });
        onSelectImage(img);
      });

      marker.bindTooltip(
        `<div class="text-xs">
          <p class="font-bold text-[#171717]">${escapeHtml(img.title)}</p>
          <p class="text-[#646464] font-mono text-[10px]">${img.latitude.toFixed(4)}°N, ${img.longitude.toFixed(4)}°E</p>
          <p class="text-[#0284c7] font-medium mt-0.5">${escapeHtml(img.interventionType)} (${escapeHtml(img.analysis?.classification || 'Analyzed')})</p>
        </div>`,
        { sticky: true }
      );

      marker.addTo(group);
    });

    group.addTo(map);
    imageMarkersLayerRef.current = group;
  }, [images, layersVisibility.geoPhotos, pulsingTargetId]);

  // Render Intervention Structures
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (interventionMarkersLayerRef.current) {
      map.removeLayer(interventionMarkersLayerRef.current);
      interventionMarkersLayerRef.current = null;
    }

    if (!layersVisibility.interventions) return;

    const group = L.layerGroup();

    interventions.forEach((int) => {
      const isOperational = int.status === 'Operational';
      const statusColor = isOperational ? '#15803d' : '#d97706';
      const isPulsing = pulsingTargetId === int.id;

      const icon = L.divIcon({
        className: 'custom-marker-icon',
        html: `
          <div class="relative group cursor-pointer -translate-x-1/2 -translate-y-1/2">
            ${isPulsing ? '<span class="absolute -inset-2 rounded-full border-2 border-[#15803d] animate-ping pointer-events-none"></span>' : ''}
            <div class="w-7 h-7 rounded-lg border border-white shadow-md flex items-center justify-center text-white text-[11px] font-bold" style="background-color: ${statusColor}">
              W
            </div>
            <div class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white ${isOperational ? 'bg-emerald-400' : 'bg-amber-400'}"></div>
          </div>
        `,
        iconSize: [0, 0]
      });

      const marker = L.marker([int.latitude, int.longitude], { icon });
      marker.on('click', () => {
        setSelectedFeature({ type: 'intervention', data: int });
      });

      marker.bindTooltip(
        `<div class="text-xs">
          <p class="font-bold text-[#171717]">${escapeHtml(int.name)}</p>
          <p class="text-[#646464] font-mono text-[10px]">${int.type} • Status: ${int.status}</p>
          ${int.storageCapacityM3 ? `<p class="text-[#0284c7] font-medium text-[10px]">${int.storageCapacityM3.toLocaleString()} m³ capacity</p>` : ''}
        </div>`,
        { sticky: true }
      );

      marker.addTo(group);
    });

    group.addTo(map);
    interventionMarkersLayerRef.current = group;
  }, [interventions, layersVisibility.interventions, pulsingTargetId]);

  // Render Dynamic Deterministic 30m Raster Thematic Overlays (NDVI / NDWI / LULC)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (thematicOverlayLayerRef.current) {
      map.removeLayer(thematicOverlayLayerRef.current);
      thematicOverlayLayerRef.current = null;
    }

    if (!layersVisibility.thematic30m || activeThematicType === 'none') return;

    // Compute bounding box of watershed boundary
    const coords = watershed.boundaryGeoJson.coordinates[0];
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    // Grid resolution: 30x30 cells for crisp performance
    const gridCols = 30;
    const gridRows = 30;
    const svgWidth = 300;
    const svgHeight = 300;
    const cellW = svgWidth / gridCols;
    const cellH = svgHeight / gridRows;

    let cellsSvg = '';

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const cellLat = minLat + (maxLat - minLat) * ((gridRows - r - 0.5) / gridRows);
        const cellLng = minLng + (maxLng - minLng) * ((c + 0.5) / gridCols);

        // Check if inside watershed boundary
        if (!isPointInPolygon(cellLat, cellLng, watershed.boundaryGeoJson.coordinates)) {
          continue;
        }

        const seed = `${watershed.id}_${selectedYear}_${activeThematicType}_${c}_${r}`;
        const noise = seededPseudoNoise(seed);

        let cellColor = '#65a30d';
        let cellOpacity = 0.8;

        if (activeThematicType === 'ndvi') {
          // Progress with year: 2026 has higher vegetation baseline than 2022
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
          // Surface water probability higher near center/streams
          const centerDist = Math.hypot(
            (c - gridCols / 2) / gridCols,
            (r - gridRows / 2) / gridRows
          );
          const waterProb = noise * 0.7 + (1 - centerDist) * 0.4;

          if (waterProb > 0.70) {
            cellColor = '#0369a1'; // Deep Water
          } else if (waterProb > 0.52) {
            cellColor = '#38bdf8'; // Shallow Pond
          } else if (waterProb > 0.38) {
            cellColor = '#0d9488'; // Moist Soil
          } else {
            cellColor = '#f1f5f9'; // Upland/Dry
            cellOpacity = 0.2;
          }
        } else if (activeThematicType === 'lulc') {
          // Categorical classes
          const lulcIdx = Math.floor(noise * 6);
          const colors = ['#84cc16', '#166534', '#ca8a04', '#b45309', '#0284c7', '#ef4444'];
          cellColor = colors[lulcIdx];
        }

        cellsSvg += `<rect x="${(c * cellW).toFixed(1)}" y="${(r * cellH).toFixed(1)}" width="${cellW.toFixed(1)}" height="${cellH.toFixed(1)}" fill="${cellColor}" opacity="${cellOpacity}"/>`;
      }
    }

    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
        ${cellsSvg}
      </svg>
    `;

    const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`;
    const bounds: L.LatLngBoundsExpression = [
      [minLat, minLng],
      [maxLat, maxLng]
    ];

    const overlay = L.imageOverlay(svgUrl, bounds, { opacity: rasterOpacity });
    overlay.addTo(map);
    thematicOverlayLayerRef.current = overlay;
  }, [watershed, layersVisibility.thematic30m, activeThematicType, selectedYear, rasterOpacity]);

  // Render Change Detection Priority Parcels
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (changeParcelsLayerRef.current) {
      map.removeLayer(changeParcelsLayerRef.current);
      changeParcelsLayerRef.current = null;
    }

    if (!layersVisibility.changeDetection || !changeDetection) return;

    const group = L.layerGroup();

    changeDetection.detectedParcels.forEach((parcel) => {
      const isVeg = parcel.type.includes('Vegetation');
      const isWater = parcel.type.includes('Water');
      const strokeColor = isVeg ? '#16a34a' : isWater ? '#0284c7' : '#dc2626';

      const poly = L.polygon(parcel.coordinates as [number, number][], {
        color: strokeColor,
        weight: 2,
        dashArray: '4, 4',
        fillColor: strokeColor,
        fillOpacity: 0.25
      });

      poly.on('click', () => {
        setSelectedFeature({ type: 'parcel', data: parcel });
      });

      poly.bindTooltip(
        `<div class="text-xs">
          <p class="font-bold text-[#171717]">${escapeHtml(parcel.type)}</p>
          <p class="font-mono text-[10px] text-[#646464]">${parcel.areaHectares} ha • ${parcel.confidence} Confidence</p>
        </div>`,
        { sticky: true }
      );

      poly.addTo(group);
    });

    group.addTo(map);
    changeParcelsLayerRef.current = group;
  }, [changeDetection, layersVisibility.changeDetection]);

  const resetView = () => {
    if (mapInstanceRef.current && boundaryLayerRef.current) {
      mapInstanceRef.current.fitBounds(boundaryLayerRef.current.getBounds(), { padding: [30, 30] });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-61px)] overflow-hidden bg-[#f4f6f2] flex flex-col">
      
      {/* Top Map Toolbar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2">
        
        {/* Base Map Selector */}
        <div className="flex items-center bg-[#ffffff]/95 backdrop-blur-sm border border-[#dee2de] rounded-lg p-1 shadow-sm text-xs font-medium">
          <button
            onClick={() => setBaseMapType('satellite')}
            className={`px-2.5 py-1 rounded transition-colors ${
              baseMapType === 'satellite' ? 'bg-[#1f1f29] text-[#ffffff]' : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => setBaseMapType('carto')}
            className={`px-2.5 py-1 rounded transition-colors ${
              baseMapType === 'carto' ? 'bg-[#1f1f29] text-[#ffffff]' : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            Light GIS
          </button>
          <button
            onClick={() => setBaseMapType('streets')}
            className={`px-2.5 py-1 rounded transition-colors ${
              baseMapType === 'streets' ? 'bg-[#1f1f29] text-[#ffffff]' : 'text-[#444141] hover:text-[#171717]'
            }`}
          >
            Streets
          </button>
        </div>

        {/* 30m Satellite Thematic Selector */}
        <div className="flex items-center bg-[#ffffff]/95 backdrop-blur-sm border border-[#dee2de] rounded-lg p-1 shadow-sm text-xs font-medium">
          <button
            onClick={() => setActiveThematicType('ndvi')}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              activeThematicType === 'ndvi' ? 'bg-[#15803d] text-white' : 'text-[#444141] hover:bg-[#f9faf7]'
            }`}
          >
            <TreePine className="w-3.5 h-3.5" />
            <span>NDVI 30m</span>
          </button>
          <button
            onClick={() => setActiveThematicType('ndwi')}
            className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
              activeThematicType === 'ndwi' ? 'bg-[#0284c7] text-white' : 'text-[#444141] hover:bg-[#f9faf7]'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>NDWI 30m</span>
          </button>
          <button
            onClick={() => setActiveThematicType('lulc')}
            className={`px-2 py-1 rounded transition-colors ${
              activeThematicType === 'lulc' ? 'bg-[#ca8a04] text-white' : 'text-[#444141] hover:bg-[#f9faf7]'
            }`}
          >
            LULC
          </button>
          <button
            onClick={() => setActiveThematicType('none')}
            className={`px-2 py-1 rounded transition-colors ${
              activeThematicType === 'none' ? 'bg-[#282834] text-white' : 'text-[#646464] hover:bg-[#f9faf7]'
            }`}
          >
            Off
          </button>
        </div>

        {/* Reset & View Controls */}
        <button
          onClick={resetView}
          className="p-1.5 bg-[#ffffff]/95 backdrop-blur-sm border border-[#dee2de] rounded-lg shadow-sm text-[#444141] hover:text-[#171717] hover:border-[#41a1cf] transition-all"
          title="Reset map to watershed bounds"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Toggle Layers Panel */}
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-[#ffffff]/95 backdrop-blur-sm border rounded-lg shadow-sm text-xs font-medium transition-all ${
            showLayerPanel ? 'border-[#41a1cf] text-[#41a1cf]' : 'border-[#dee2de] text-[#444141]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
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
            className="absolute top-14 left-3 z-[1000] w-68 bg-[#ffffff]/95 backdrop-blur-md border border-[#dee2de] rounded-xl p-3 shadow-lg space-y-2.5 text-xs"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-[#dee2de]">
              <span className="font-serif font-medium text-sm text-[#171717]">GIS Layer Manager</span>
              <span className="text-[10px] font-mono text-[#646464]">WGS 84</span>
            </div>

            {/* Raster Opacity Slider */}
            {activeThematicType !== 'none' && layersVisibility.thematic30m && (
              <div className="p-2 bg-[#f9faf7] rounded-lg border border-[#dee2de] space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#646464]">30m Raster Opacity:</span>
                  <span className="font-mono font-bold text-[#171717]">{Math.round(rasterOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={rasterOpacity}
                  onChange={(e) => setRasterOpacity(parseFloat(e.target.value))}
                  className="w-full accent-[#41a1cf] cursor-pointer"
                />
              </div>
            )}

            <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-1.5 rounded">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-dashed border-[#1f1f29] bg-[#41a1cf]/10"></span>
                  <span className="text-[#2c2c2c] font-medium">Watershed Boundary</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.boundary}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, boundary: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-1.5 rounded">
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

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-1.5 rounded">
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

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-1.5 rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#41a1cf]"></span>
                  <span className="text-[#2c2c2c] font-medium">Villages</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.villages}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, villages: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-1.5 rounded">
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

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-1.5 rounded">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></span>
                  <span className="text-[#2c2c2c] font-medium">Geo-Photos ({images.length})</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.geoPhotos}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, geoPhotos: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-1.5 rounded">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded border border-[#65a30d] bg-[#65a30d]/30"></span>
                  <span className="text-[#2c2c2c] font-medium">30m Satellite Raster</span>
                </div>
                <input
                  type="checkbox"
                  checked={layersVisibility.thematic30m}
                  onChange={(e) => setLayersVisibility({ ...layersVisibility, thematic30m: e.target.checked })}
                  className="accent-[#41a1cf]"
                />
              </label>

              <label className="flex items-center justify-between py-1 cursor-pointer hover:bg-[#f9faf7] px-1.5 rounded">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 border border-dashed border-[#dc2626] bg-[#dc2626]/20"></span>
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

            {/* DATA SOURCE INDICATOR (Requirement 14) */}
            <div className="pt-2 border-t border-[#dee2de] space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-[#646464] font-bold block">
                DATA SOURCE
              </span>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span className="text-[#171717] font-medium">DEMO DATA</span>
                  <span className="text-[10px] text-[#646464]">(Active)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
                  <span className="text-[#171717] font-medium">USER FIELD DATA</span>
                  <span className="text-[10px] text-[#646464]">({images.length} photos)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full border border-gray-400 bg-white"></span>
                  <span className="text-[#646464]">EXTERNAL DATA</span>
                  <span className="text-[10px] text-amber-700">(Ready)</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Persistent DEMO DATA Badge (Requirement 14) */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2 pointer-events-none">
        <span className="px-2.5 py-1 rounded-lg bg-[#ffffff]/95 backdrop-blur-md border border-amber-300 text-amber-900 text-[10px] font-mono font-bold shadow-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          DEMO DATA — NOT OFFICIAL SATELLITE DATA
        </span>
      </div>

      {/* Main Map Container */}
      <div ref={mapContainerRef} className="w-full flex-1 z-0" />

      {/* Bottom Feature Inspection Card */}
      <AnimatePresence>
        {selectedFeature && (
          <motion.div
            variants={bottomCardVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[1000] bg-[#ffffff] border border-[#dee2de] rounded-xl p-3.5 shadow-xl"
          >
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#dee2de]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#646464] bg-[#f9faf7] px-1.5 py-0.5 rounded border border-[#dee2de]">
                  {selectedFeature.type === 'image' ? 'Geo-coded Photograph' :
                   selectedFeature.type === 'intervention' ? 'Watershed Structure' :
                   selectedFeature.type === 'village' ? 'Village Habitation' :
                   selectedFeature.type === 'waterBody' ? 'Water Body Reservoir' : 'Spatial Change Parcel'}
                </span>
                <h3 className="font-serif font-medium text-sm text-[#171717] mt-1">
                  {selectedFeature.data?.title || selectedFeature.data?.name || 'Selected Entity'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedFeature(null)}
                aria-label="Close feature card"
                className="text-[#646464] hover:text-[#171717] p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-2 text-xs space-y-2">
              {selectedFeature.type === 'image' && (
                <>
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-[#dee2de] bg-[#f9faf7]">
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
                      className="px-3 py-1.5 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors"
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
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#f9faf7] p-2.5 rounded-lg border border-[#dee2de]">
                    <div>
                      <span className="text-[#646464]">Surface Area:</span>
                      <p className="font-mono font-medium text-[#171717]">{selectedFeature.data.areaHectares || 14.5} ha</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Impoundment:</span>
                      <p className="font-medium text-[#0284c7]">{selectedFeature.data.category || 'Surface Reservoir'}</p>
                    </div>
                  </div>
                  <p className="text-[#444141] text-[11px]">
                    Water body polygon delineated via 30 m NDWI spectral ratio and drainage stream convergence.
                  </p>
                  <div className="text-[10px] font-mono text-[#646464] pt-1 border-t border-[#dee2de]">
                    Source Layer: Demo Water Bodies Vector Layer
                  </div>
                </div>
              )}

              {selectedFeature.type === 'parcel' && (
                <>
                  <div className="text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[#646464]">Area:</span>
                      <span className="font-mono font-medium text-[#171717]">{selectedFeature.data.areaHectares} ha</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#646464]">Confidence:</span>
                      <span className="font-semibold text-emerald-700">{selectedFeature.data.confidence}</span>
                    </div>
                  </div>
                  <p className="text-[#444141] text-[11px]">
                    {selectedFeature.data.description}
                  </p>
                  <div className="p-2 bg-[#f9faf7] rounded border border-[#dee2de] text-[10px] text-[#171717]">
                    <strong>Recommended Action:</strong> {selectedFeature.data.recommendedAction}
                  </div>
                </>
              )}

              {selectedFeature.type === 'village' && (
                <div className="text-[11px] space-y-2">
                  <div className="grid grid-cols-2 gap-2 bg-[#f9faf7] p-2 rounded border border-[#dee2de]">
                    <div>
                      <span className="text-[#646464]">Population:</span>
                      <p className="font-mono font-medium text-[#171717]">{selectedFeature.data.population.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-[#646464]">Households:</span>
                      <p className="font-mono font-medium text-[#171717]">{selectedFeature.data.households}</p>
                    </div>
                  </div>
                  <p className="text-[#646464]">
                    Cadastral village within {watershed.name}. Beneficiary community participating in watershed committee.
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
