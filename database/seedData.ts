import { Watershed, GeoImage, Intervention, SatelliteLayerInfo, ChangeDetectionResult } from '../models/index.js';

// SVG Data URIs for realistic field photographs so the application has immediate, reliable visual evidence
const checkDamSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#87ceeb"/><stop offset="100%" stop-color="#e0f2fe"/></linearGradient>
    <linearGradient id="water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0284c7"/></linearGradient>
    <linearGradient id="stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#78716c"/><stop offset="100%" stop-color="#57534e"/></linearGradient>
    <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#4d7c0f"/><stop offset="100%" stop-color="#65a30d"/></linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <!-- Distant Hills -->
  <polygon points="0,220 120,170 280,210 420,160 600,230 600,300 0,300" fill="url(#hill)" opacity="0.8"/>
  <polygon points="40,240 180,190 340,230 520,180 600,220 600,300 0,300" fill="#3f6212" opacity="0.9"/>
  <!-- Impounded Water Basin -->
  <path d="M 50,250 Q 200,240 380,260 L 400,310 L 80,310 Z" fill="url(#water)"/>
  <!-- Masonry Check Dam Wall -->
  <polygon points="360,240 400,240 430,340 340,340" fill="url(#stone)" stroke="#292524" stroke-width="2"/>
  <!-- Spillway / Overflow Crest -->
  <rect x="375" y="245" width="20" height="25" fill="#a8a29e"/>
  <!-- Overflow Water Stream -->
  <path d="M 378,270 Q 385,310 395,350 L 420,380 L 370,380 Z" fill="#7dd3fc" opacity="0.85"/>
  <!-- Downstream Riprap / Boulders -->
  <ellipse cx="370" cy="355" rx="14" ry="8" fill="#44403c"/>
  <ellipse cx="395" cy="360" rx="16" ry="9" fill="#57534e"/>
  <ellipse cx="420" cy="350" rx="12" ry="7" fill="#44403c"/>
  <!-- Foreground Banks and Shrubs -->
  <path d="M 0,270 Q 150,290 280,320 L 260,400 L 0,400 Z" fill="#84cc16"/>
  <circle cx="80" cy="310" r="18" fill="#15803d"/>
  <circle cx="110" cy="320" r="22" fill="#166534"/>
  <circle cx="160" cy="335" r="15" fill="#15803d"/>
  <!-- Geo-tag Watermark & Date Stamp -->
  <rect x="15" y="15" width="260" height="52" rx="4" fill="rgba(24,24,27,0.75)"/>
  <text x="25" y="34" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="bold">GPS: 25.3482°N, 74.6391°E (±2.8m)</text>
  <text x="25" y="52" fill="#38bdf8" font-size="10" font-family="monospace">DATE: 2026-08-14 | STRUCT: CD-01</text>
</svg>`)}`;

const farmPondSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <defs>
    <linearGradient id="pondSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#f0f9ff"/></linearGradient>
    <linearGradient id="pondWater" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0284c7"/><stop offset="100%" stop-color="#0369a1"/></linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#pondSky)"/>
  <!-- Agricultural Bunds around pond -->
  <polygon points="0,150 600,140 600,400 0,400" fill="#a16207"/>
  <!-- Crop fields surrounding -->
  <polygon points="0,150 600,140 600,210 0,220" fill="#65a30d"/>
  <!-- Trapezoidal Excavated Farm Pond -->
  <polygon points="120,230 480,220 540,360 70,370" fill="#78350f"/>
  <!-- Water body inside pond -->
  <polygon points="140,245 460,238 510,345 100,352" fill="url(#pondWater)"/>
  <!-- Inlet Silt Trap / Silt Chamber -->
  <rect x="80" y="220" width="40" height="25" fill="#57534e" stroke="#292524" stroke-width="1.5"/>
  <line x1="80" y1="232" x2="120" y2="232" stroke="#7dd3fc" stroke-width="3"/>
  <!-- Soil embankment bunds -->
  <line x1="50" y1="380" x2="560" y2="370" stroke="#713f12" stroke-width="8"/>
  <!-- Tree plantation along boundary -->
  <circle cx="510" cy="185" r="16" fill="#15803d"/>
  <circle cx="540" cy="180" r="18" fill="#166534"/>
  <circle cx="480" cy="190" r="14" fill="#15803d"/>
  <!-- Geo-tag Badge -->
  <rect x="15" y="15" width="260" height="52" rx="4" fill="rgba(24,24,27,0.75)"/>
  <text x="25" y="34" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="bold">GPS: 25.3521°N, 74.6445°E (±1.9m)</text>
  <text x="25" y="52" fill="#38bdf8" font-size="10" font-family="monospace">DATE: 2026-07-28 | FP-03 (FARM POND)</text>
</svg>`)}`;

const contourTrenchSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" fill="#fef08a"/>
  <!-- Sloping ridge / hill terrain -->
  <polygon points="0,80 600,160 600,400 0,400" fill="#a16207"/>
  <!-- Staggered Contour Trenches (CCT) -->
  <!-- Row 1 -->
  <path d="M 60,160 Q 140,165 210,162 L 210,175 Q 140,178 60,173 Z" fill="#451a03"/>
  <path d="M 270,172 Q 380,180 470,176 L 470,188 Q 380,192 270,184 Z" fill="#451a03"/>
  <!-- Row 2 -->
  <path d="M 120,220 Q 230,228 320,224 L 320,238 Q 230,242 120,234 Z" fill="#451a03"/>
  <path d="M 370,230 Q 480,240 560,236 L 560,250 Q 480,254 370,244 Z" fill="#451a03"/>
  <!-- Row 3 -->
  <path d="M 40,285 Q 160,296 260,290 L 260,305 Q 160,311 40,300 Z" fill="#451a03"/>
  <path d="M 310,298 Q 440,310 540,305 L 540,320 Q 440,325 310,313 Z" fill="#451a03"/>
  <!-- Saplings planted on berm of trenches -->
  <g fill="#16a34a">
    <circle cx="100" cy="155" r="7"/><circle cx="180" cy="158" r="8"/>
    <circle cx="320" cy="168" r="8"/><circle cx="430" cy="172" r="7"/>
    <circle cx="170" cy="215" r="9"/><circle cx="280" cy="220" r="10"/>
    <circle cx="420" cy="226" r="9"/><circle cx="510" cy="232" r="8"/>
    <circle cx="90" cy="280" r="10"/><circle cx="210" cy="286" r="11"/>
    <circle cx="360" cy="294" r="11"/><circle cx="480" cy="301" r="10"/>
  </g>
  <!-- Geo-tag Badge -->
  <rect x="15" y="15" width="260" height="52" rx="4" fill="rgba(24,24,27,0.75)"/>
  <text x="25" y="34" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="bold">GPS: 25.3378°N, 74.6295°E (±3.1m)</text>
  <text x="25" y="52" fill="#38bdf8" font-size="10" font-family="monospace">DATE: 2026-06-20 | CCT-08 (RIDGE TREATMENT)</text>
</svg>`)}`;

const plantationSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" fill="#ecfccb"/>
  <polygon points="0,200 600,170 600,400 0,400" fill="#4d7c0f"/>
  <!-- Dense agro-forestry / plantation grove -->
  <g fill="#15803d">
    <ellipse cx="90" cy="250" rx="35" ry="55"/>
    <ellipse cx="160" cy="230" rx="45" ry="70"/>
    <ellipse cx="250" cy="220" rx="50" ry="80"/>
    <ellipse cx="350" cy="235" rx="48" ry="75"/>
    <ellipse cx="440" cy="225" rx="55" ry="85"/>
    <ellipse cx="530" cy="240" rx="40" ry="65"/>
  </g>
  <g fill="#166534">
    <ellipse cx="120" cy="270" rx="30" ry="45"/>
    <ellipse cx="200" cy="260" rx="38" ry="60"/>
    <ellipse cx="300" cy="265" rx="42" ry="65"/>
    <ellipse cx="400" cy="255" rx="38" ry="58"/>
    <ellipse cx="490" cy="270" rx="35" ry="50"/>
  </g>
  <!-- Grass cover understorey -->
  <rect x="0" y="340" width="600" height="60" fill="#65a30d"/>
  <!-- Geo-tag Badge -->
  <rect x="15" y="15" width="260" height="52" rx="4" fill="rgba(24,24,27,0.75)"/>
  <text x="25" y="34" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="bold">GPS: 25.3567°N, 74.6512°E (±2.2m)</text>
  <text x="25" y="52" fill="#38bdf8" font-size="10" font-family="monospace">DATE: 2026-08-02 | PL-04 (COMMUNITY FORESTRY)</text>
</svg>`)}`;

const gullyPlugSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400" width="100%" height="100%">
  <rect width="600" height="400" fill="#f5f5f4"/>
  <!-- Eroded gully cross section -->
  <polygon points="0,150 180,180 230,340 370,340 420,180 600,140 600,400 0,400" fill="#78716c"/>
  <!-- Dry Stone Loose Boulder Masonry Check / Gully Plug -->
  <g fill="#57534e" stroke="#292524" stroke-width="1.5">
    <ellipse cx="250" cy="330" rx="22" ry="14"/>
    <ellipse cx="290" cy="332" rx="20" ry="15"/>
    <ellipse cx="330" cy="328" rx="24" ry="14"/>
    <ellipse cx="265" cy="305" rx="22" ry="14"/>
    <ellipse cx="305" cy="302" rx="25" ry="16"/>
    <ellipse cx="345" cy="306" rx="20" ry="13"/>
    <ellipse cx="280" cy="278" rx="23" ry="15"/>
    <ellipse cx="325" cy="275" rx="24" ry="15"/>
    <ellipse cx="300" cy="250" rx="22" ry="13"/>
  </g>
  <!-- Accumulated silt upstream of plug -->
  <polygon points="190,260 270,260 260,340 180,340" fill="#d97706" opacity="0.6"/>
  <text x="195" y="300" fill="#451a03" font-size="10" font-weight="bold">SILT TRAPPED</text>
  <!-- Geo-tag Badge -->
  <rect x="15" y="15" width="260" height="52" rx="4" fill="rgba(24,24,27,0.75)"/>
  <text x="25" y="34" fill="#f8fafc" font-size="11" font-family="monospace" font-weight="bold">GPS: 25.3412°N, 74.6335°E (±2.5m)</text>
  <text x="25" y="52" fill="#38bdf8" font-size="10" font-family="monospace">DATE: 2026-07-15 | GP-02 (LOOSE BOULDER GULLY PLUG)</text>
</svg>`)}`;

export const sampleWatersheds: Watershed[] = [
  {
    id: 'sw-04',
    code: 'RJ-BHL-SW04',
    name: 'Kalyanpura Sub-watershed (SW-04)',
    state: 'Rajasthan',
    district: 'Bhilwara',
    block: 'Mandalgarh',
    totalAreaKm2: 118.5,
    centerCoordinates: [25.345, 74.638],
    boundaryGeoJson: {
      type: 'Polygon',
      coordinates: [[
        [74.590, 25.320],
        [74.615, 25.312],
        [74.650, 25.318],
        [74.685, 25.335],
        [74.698, 25.365],
        [74.675, 25.385],
        [74.640, 25.390],
        [74.605, 25.378],
        [74.585, 25.350],
        [74.590, 25.320]
      ]]
    },
    villages: [
      { id: 'v-01', name: 'Kalyanpura', population: 2150, households: 420, latitude: 25.348, longitude: 74.638, watershedId: 'sw-04' },
      { id: 'v-02', name: 'Nimbahera Kalan', population: 1840, households: 360, latitude: 25.362, longitude: 74.622, watershedId: 'sw-04' },
      { id: 'v-03', name: 'Rampuriya', population: 1320, households: 275, latitude: 25.332, longitude: 74.652, watershedId: 'sw-04' },
      { id: 'v-04', name: 'Devli', population: 1690, households: 330, latitude: 25.358, longitude: 74.665, watershedId: 'sw-04' },
      { id: 'v-05', name: 'Surajpura', population: 980, households: 195, latitude: 25.325, longitude: 74.612, watershedId: 'sw-04' }
    ],
    yearlyMetrics: {
      2022: {
        year: 2022,
        vegetationCoveragePercent: 34.2,
        vegetationAreaKm2: 40.5,
        averageNDVI: 0.22,
        waterBodyAreaKm2: 3.8,
        waterStorageIndex: 42.0,
        interventionsCount: 38,
        geoImagesCount: 142,
        degradedLandPercent: 39.5,
        cropLandPercent: 26.3,
        annualRainfallMm: 480
      },
      2023: {
        year: 2023,
        vegetationCoveragePercent: 41.5,
        vegetationAreaKm2: 49.2,
        averageNDVI: 0.28,
        waterBodyAreaKm2: 4.9,
        waterStorageIndex: 54.0,
        interventionsCount: 56,
        geoImagesCount: 210,
        degradedLandPercent: 33.1,
        cropLandPercent: 31.4,
        annualRainfallMm: 520
      },
      2024: {
        year: 2024,
        vegetationCoveragePercent: 48.6,
        vegetationAreaKm2: 57.6,
        averageNDVI: 0.36,
        waterBodyAreaKm2: 6.4,
        waterStorageIndex: 68.5,
        interventionsCount: 82,
        geoImagesCount: 315,
        degradedLandPercent: 27.2,
        cropLandPercent: 36.8,
        annualRainfallMm: 610
      },
      2025: {
        year: 2025,
        vegetationCoveragePercent: 55.4,
        vegetationAreaKm2: 65.6,
        averageNDVI: 0.44,
        waterBodyAreaKm2: 7.6,
        waterStorageIndex: 79.2,
        interventionsCount: 98,
        geoImagesCount: 385,
        degradedLandPercent: 21.8,
        cropLandPercent: 42.4,
        annualRainfallMm: 640
      },
      2026: {
        year: 2026,
        vegetationCoveragePercent: 62.8,
        vegetationAreaKm2: 74.4,
        averageNDVI: 0.52,
        waterBodyAreaKm2: 8.9,
        waterStorageIndex: 88.0,
        interventionsCount: 113,
        geoImagesCount: 438,
        degradedLandPercent: 16.4,
        cropLandPercent: 47.8,
        annualRainfallMm: 675
      }
    },
    summary: 'Semi-arid agricultural and pastoral watershed in eastern Aravalli fringe. Critical focus on runoff harvesting, gully stabilization, recharge structures, and farm forestry under integrated watershed management.'
  },
  {
    id: 'mw-12',
    code: 'MH-AHM-MW12',
    name: 'Ralegan Siddhi Micro-watershed (MW-12)',
    state: 'Maharashtra',
    district: 'Ahmednagar',
    block: 'Parner',
    totalAreaKm2: 92.4,
    centerCoordinates: [19.032, 74.455],
    boundaryGeoJson: {
      type: 'Polygon',
      coordinates: [[
        [74.420, 19.010],
        [74.445, 19.005],
        [74.480, 19.020],
        [74.492, 19.050],
        [74.465, 19.065],
        [74.430, 19.055],
        [74.415, 19.030],
        [74.420, 19.010]
      ]]
    },
    villages: [
      { id: 'v-11', name: 'Ralegan Siddhi', population: 2600, households: 480, latitude: 19.032, longitude: 74.455, watershedId: 'mw-12' },
      { id: 'v-12', name: 'Pimpalgaon Rotha', population: 1450, households: 280, latitude: 19.045, longitude: 74.438, watershedId: 'mw-12' },
      { id: 'v-13', name: 'Baburdi', population: 1200, households: 240, latitude: 19.018, longitude: 74.470, watershedId: 'mw-12' }
    ],
    yearlyMetrics: {
      2024: {
        year: 2024,
        vegetationCoveragePercent: 54.2,
        vegetationAreaKm2: 50.1,
        averageNDVI: 0.42,
        waterBodyAreaKm2: 6.8,
        waterStorageIndex: 74.0,
        interventionsCount: 94,
        geoImagesCount: 290,
        degradedLandPercent: 18.2,
        cropLandPercent: 44.5,
        annualRainfallMm: 540
      },
      2026: {
        year: 2026,
        vegetationCoveragePercent: 66.5,
        vegetationAreaKm2: 61.4,
        averageNDVI: 0.55,
        waterBodyAreaKm2: 8.4,
        waterStorageIndex: 91.0,
        interventionsCount: 124,
        geoImagesCount: 410,
        degradedLandPercent: 11.5,
        cropLandPercent: 52.8,
        annualRainfallMm: 580
      }
    },
    summary: 'Benchmark watershed model in drought-prone Deccan trap basalt zone. Characterized by continuous contour trenching on hill slopes, extensive nala bunds, percolation tanks, and strict ban on borewells.'
  },
  {
    id: 'tw-08',
    code: 'MP-JHB-TW08',
    name: 'Jhabua Tribal Catchment (TW-08)',
    state: 'Madhya Pradesh',
    district: 'Jhabua',
    block: 'Meghnagar',
    totalAreaKm2: 145.2,
    centerCoordinates: [22.772, 74.595],
    boundaryGeoJson: {
      type: 'Polygon',
      coordinates: [[
        [22.740, 74.550],
        [22.730, 74.580],
        [22.750, 74.630],
        [22.790, 74.640],
        [22.810, 74.610],
        [22.800, 74.570],
        [22.760, 74.550],
        [22.740, 74.550]
      ]]
    },
    villages: [
      { id: 'v-21', name: 'Bhilkhedi', population: 1750, households: 310, latitude: 22.775, longitude: 74.592, watershedId: 'tw-08' },
      { id: 'v-22', name: 'Khandala', population: 1100, households: 210, latitude: 22.755, longitude: 74.575, watershedId: 'tw-08' }
    ],
    yearlyMetrics: {
      2024: {
        year: 2024,
        vegetationCoveragePercent: 42.1,
        vegetationAreaKm2: 61.1,
        averageNDVI: 0.32,
        waterBodyAreaKm2: 5.2,
        waterStorageIndex: 58.0,
        interventionsCount: 78,
        geoImagesCount: 220,
        degradedLandPercent: 32.4,
        cropLandPercent: 34.0,
        annualRainfallMm: 690
      },
      2026: {
        year: 2026,
        vegetationCoveragePercent: 57.8,
        vegetationAreaKm2: 83.9,
        averageNDVI: 0.46,
        waterBodyAreaKm2: 7.9,
        waterStorageIndex: 78.5,
        interventionsCount: 104,
        geoImagesCount: 345,
        degradedLandPercent: 22.0,
        cropLandPercent: 44.2,
        annualRainfallMm: 720
      }
    },
    summary: 'Undulating tribal highland catchment with rapid soil erosion along degraded hillocks. Restored through community labor (Halma tradition), loose boulder structures, and sub-surface dykes.'
  }
];

export const sampleInterventions: Intervention[] = [
  {
    id: 'int-01',
    watershedId: 'sw-04',
    name: 'Masonry Check Dam CD-01 (Kalyanpura Nala)',
    type: 'Check Dam',
    villageId: 'v-01',
    villageName: 'Kalyanpura',
    latitude: 25.3482,
    longitude: 74.6391,
    status: 'Operational',
    installationYear: 2023,
    storageCapacityM3: 18500,
    catchmentAreaHa: 240,
    contractorOrPanchayat: 'Gram Panchayat Kalyanpura / WDC-PMKSY',
    linkedImageIds: ['img-01'],
    monitoringHistory: [
      { date: '2024-03-12', inspector: 'Er. R. Sharma (GIS AE)', status: 'Operational', observations: 'Water retained at 65% capacity post-rabi season. Downstream seepage minor.' },
      { date: '2025-09-18', inspector: 'S. Patel (Field Officer)', status: 'Operational', observations: 'Full reservoir capacity reached after August rains. Zero structure crack.' },
      { date: '2026-08-14', inspector: 'Dr. V. Meena (Hydrologist)', status: 'Operational', observations: 'Sediment buildup at apron ~12%. Water column clean. Apron sound.' }
    ]
  },
  {
    id: 'int-02',
    watershedId: 'sw-04',
    name: 'Excavated Farm Pond FP-03',
    type: 'Farm Pond',
    villageId: 'v-01',
    villageName: 'Kalyanpura',
    latitude: 25.3521,
    longitude: 74.6445,
    status: 'Operational',
    installationYear: 2024,
    storageCapacityM3: 4200,
    catchmentAreaHa: 12,
    contractorOrPanchayat: 'Beneficiary: Mangi Lal / PMKSY-HKKP',
    linkedImageIds: ['img-02'],
    monitoringHistory: [
      { date: '2025-01-10', inspector: 'S. Patel (Field Officer)', status: 'Operational', observations: 'Supplemental irrigation provided for 2.5 ha mustard crop.' },
      { date: '2026-07-28', inspector: 'Er. R. Sharma (GIS AE)', status: 'Operational', observations: 'Lining intact. Silt trap operational.' }
    ]
  },
  {
    id: 'int-03',
    watershedId: 'sw-04',
    name: 'Continuous Contour Trenches CCT-08',
    type: 'Contour Trench',
    villageId: 'v-05',
    villageName: 'Surajpura',
    latitude: 25.3378,
    longitude: 74.6295,
    status: 'Operational',
    installationYear: 2023,
    storageCapacityM3: 8600,
    catchmentAreaHa: 65,
    contractorOrPanchayat: 'MGNREGA / Forest Dept',
    linkedImageIds: ['img-03'],
    monitoringHistory: [
      { date: '2024-06-15', inspector: 'K. Gurjar (TA)', status: 'Operational', observations: 'Runoff velocity arrested. Bamboo and Khair saplings 88% survival.' },
      { date: '2026-06-20', inspector: 'Dr. V. Meena (Hydrologist)', status: 'Operational', observations: 'Vegetation canopy established along berms. Siltation well-distributed.' }
    ]
  },
  {
    id: 'int-04',
    watershedId: 'sw-04',
    name: 'Community Agroforestry Plantation PL-04',
    type: 'Plantation / Afforestation',
    villageId: 'v-04',
    villageName: 'Devli',
    latitude: 25.3567,
    longitude: 74.6512,
    status: 'Operational',
    installationYear: 2023,
    catchmentAreaHa: 28,
    contractorOrPanchayat: 'Devli Village Watershed Committee',
    linkedImageIds: ['img-04'],
    monitoringHistory: [
      { date: '2025-08-11', inspector: 'S. Patel (Field Officer)', status: 'Operational', observations: 'Canopy closure reaching 58%. Soil moisture retention noticeable.' },
      { date: '2026-08-02', inspector: 'Er. R. Sharma (GIS AE)', status: 'Operational', observations: 'Neem, Amla, and Shisham trees healthy. Grazing protection effective.' }
    ]
  },
  {
    id: 'int-05',
    watershedId: 'sw-04',
    name: 'Loose Boulder Gully Plug GP-02',
    type: 'Gully Plug',
    villageId: 'v-02',
    villageName: 'Nimbahera Kalan',
    latitude: 25.3412,
    longitude: 74.6335,
    status: 'Requires Desilting',
    installationYear: 2022,
    catchmentAreaHa: 18,
    contractorOrPanchayat: 'Gram Panchayat Nimbahera',
    linkedImageIds: ['img-05'],
    monitoringHistory: [
      { date: '2024-09-02', inspector: 'K. Gurjar (TA)', status: 'Operational', observations: 'Trapped 1.2m depth of rich topsoil.' },
      { date: '2026-07-15', inspector: 'Dr. V. Meena (Hydrologist)', status: 'Requires Desilting', observations: 'Plug completely filled with sediment. Needs desilting or raise height by 0.5m.' }
    ]
  },
  {
    id: 'int-06',
    watershedId: 'sw-04',
    name: 'Percolation Tank PT-02 (Rampuriya Ridge)',
    type: 'Percolation Tank',
    villageId: 'v-03',
    villageName: 'Rampuriya',
    latitude: 25.3345,
    longitude: 74.6490,
    status: 'Operational',
    installationYear: 2024,
    storageCapacityM3: 24000,
    catchmentAreaHa: 180,
    contractorOrPanchayat: 'Minor Irrigation / WDC',
    linkedImageIds: [],
    monitoringHistory: [
      { date: '2025-10-04', inspector: 'Er. R. Sharma (GIS AE)', status: 'Operational', observations: 'Groundwater table in 4 open wells downstream elevated by 2.8 meters.' }
    ]
  }
];

export const sampleGeoImages: GeoImage[] = [
  {
    id: 'img-01',
    watershedId: 'sw-04',
    title: 'Masonry Check Dam CD-01 Crest & Spillway View',
    imageUrl: checkDamSvg,
    latitude: 25.3482,
    longitude: 74.6391,
    date: '2026-08-14T09:42:00Z',
    villageId: 'v-01',
    villageName: 'Kalyanpura',
    interventionType: 'Check Dam',
    interventionId: 'int-01',
    uploadedBy: 'Dr. V. Meena',
    inspectorName: 'Dr. V. Meena (Hydrologist)',
    fieldNotes: 'Post-monsoon check dam inspection. Structure intact with ~85% water storage. Water clarity is high and vegetative buffering on left abutment is well established.',
    analysis: {
      validatedQuality: {
        status: 'Excellent',
        resolution: '1920x1080 (2.07 MP)',
        sharpnessScore: 92,
        lightingCondition: 'Optimal',
        gpsAccuracyMeters: 2.8
      },
      classification: 'Check dam',
      confidenceScore: 94.6,
      observedInformation: [
        'Stone-masonry overflow weir with trapezoidal spillway crest intact',
        'Significant impounded surface water ponding upstream of weir',
        'Scour protection boulders / riprap present downstream of spillway',
        'Dense perennial vegetative cover on northern embankments'
      ],
      inferredInformation: [
        'Estimated upstream impounded volume exceeds 14,000 cu.m based on crest submergence',
        'Effective groundwater recharge zone within 600m radius downstream',
        'Reduced siltation velocity evident from water surface sediment stratification'
      ],
      unavailableInformation: [
        'Foundation cutoff trench integrity beneath riverbed',
        'Deep sub-surface geological seepage rate through bedrock fissures'
      ],
      uncertaintyFlags: [],
      detectedFeatures: [
        { label: 'Masonry Spillway Wall', confidence: 96 },
        { label: 'Surface Water Basin', confidence: 95 },
        { label: 'Downstream Stilling Basin / Riprap', confidence: 89 },
        { label: 'Catchment Riparian Vegetation', confidence: 91 }
      ],
      nearbyFeatures: {
        streamDistanceMeters: 0,
        nearestInterventionName: 'Masonry Check Dam CD-01 (Kalyanpura Nala)',
        nearestVillageName: 'Kalyanpura (0.4 km)'
      },
      aiModelUsed: 'Gemini-3.8-Flash Vision / GeoWatershed Spectral Classifier',
      analyzedAt: '2026-08-14T09:45:12Z'
    }
  },
  {
    id: 'img-02',
    watershedId: 'sw-04',
    title: 'Excavated Farm Pond FP-03 with Crop Protective Lining',
    imageUrl: farmPondSvg,
    latitude: 25.3521,
    longitude: 74.6445,
    date: '2026-07-28T11:15:00Z',
    villageId: 'v-01',
    villageName: 'Kalyanpura',
    interventionType: 'Farm Pond',
    interventionId: 'int-02',
    uploadedBy: 'Er. R. Sharma',
    inspectorName: 'Er. R. Sharma (GIS AE)',
    fieldNotes: 'Farmer Mangi Lal farm pond inspection. Retains clean harvested surface runoff. Feeds drip irrigation for nearby rabi cultivation. Embankments protected by planted grass.',
    analysis: {
      validatedQuality: {
        status: 'Excellent',
        resolution: '1920x1080 (2.07 MP)',
        sharpnessScore: 88,
        lightingCondition: 'Optimal',
        gpsAccuracyMeters: 1.9
      },
      classification: 'Farm pond',
      confidenceScore: 92.4,
      observedInformation: [
        'Engineered earthen farm pond with stable trapezoidal cut-and-fill berms',
        'Surface water level at ~80% of freeboard capacity',
        'Masonry silt trap inlet inlet channel functioning without blockage',
        'Surrounding agricultural crops show healthy vegetative vigour (high greenness)'
      ],
      inferredInformation: [
        'Sufficient water head to provide 2 critical lifecycle irrigations for 3 hectares',
        'Minimal bank piping erosion observed around outer perimeter'
      ],
      unavailableInformation: [
        'Total soil infiltration rate at pond bed (impermeable lining vs unlined percolation rate)',
        'Water salinity (EC/pH) chemical measurements'
      ],
      uncertaintyFlags: [],
      detectedFeatures: [
        { label: 'Trapezoidal Farm Pond Basin', confidence: 94 },
        { label: 'Inlet Silt Chamber', confidence: 88 },
        { label: 'Cultivated Crop Boundary', confidence: 92 }
      ],
      nearbyFeatures: {
        streamDistanceMeters: 280,
        nearestInterventionName: 'Excavated Farm Pond FP-03',
        nearestVillageName: 'Kalyanpura (0.9 km)'
      },
      aiModelUsed: 'Gemini-3.8-Flash Vision / GeoWatershed Spectral Classifier',
      analyzedAt: '2026-07-28T11:17:30Z'
    }
  },
  {
    id: 'img-03',
    watershedId: 'sw-04',
    title: 'Continuous Contour Trenches (CCT) Along Upper Ridge',
    imageUrl: contourTrenchSvg,
    latitude: 25.3378,
    longitude: 74.6295,
    date: '2026-06-20T08:30:00Z',
    villageId: 'v-05',
    villageName: 'Surajpura',
    interventionType: 'Contour Trench',
    interventionId: 'int-03',
    uploadedBy: 'Dr. V. Meena',
    inspectorName: 'Dr. V. Meena (Hydrologist)',
    fieldNotes: 'Ridge-to-valley treatment zone. Continuous contour trenches on 15% slope. Moisture retention has enabled rapid seed germination on trench mounds.',
    analysis: {
      validatedQuality: {
        status: 'Good',
        resolution: '1920x1080 (2.07 MP)',
        sharpnessScore: 85,
        lightingCondition: 'Optimal',
        gpsAccuracyMeters: 3.1
      },
      classification: 'Water harvesting structure',
      confidenceScore: 89.2,
      observedInformation: [
        'Series of parallel staggered contour trenches excavated along slope contour',
        'Raised earthen and stone berms positioned on downstream lip of trenches',
        'Young sapling plantation clearly anchored along moist trench mounds',
        'Slope shows marked reduction in sheet erosion rills'
      ],
      inferredInformation: [
        'Interception of overland surface flow significantly reduces hill slope peak discharge',
        'Recharge contributing directly to valley bottom aquifers'
      ],
      unavailableInformation: [
        'Soil compaction factor within trench beds',
        'Microbial organic matter increment percentage'
      ],
      uncertaintyFlags: [],
      detectedFeatures: [
        { label: 'Contour Trench Array', confidence: 91 },
        { label: 'Stabilized Ridge Slope', confidence: 87 },
        { label: 'Afforestation Saplings', confidence: 86 }
      ],
      nearbyFeatures: {
        streamDistanceMeters: 420,
        nearestInterventionName: 'Continuous Contour Trenches CCT-08',
        nearestVillageName: 'Surajpura (1.1 km)'
      },
      aiModelUsed: 'Gemini-3.8-Flash Vision / GeoWatershed Spectral Classifier',
      analyzedAt: '2026-06-20T08:33:45Z'
    }
  },
  {
    id: 'img-04',
    watershedId: 'sw-04',
    title: 'Agroforestry and Plantation Canopy Density in Devli',
    imageUrl: plantationSvg,
    latitude: 25.3567,
    longitude: 74.6512,
    date: '2026-08-02T15:20:00Z',
    villageId: 'v-04',
    villageName: 'Devli',
    interventionType: 'Plantation / Afforestation',
    interventionId: 'int-04',
    uploadedBy: 'Er. R. Sharma',
    inspectorName: 'Er. R. Sharma (GIS AE)',
    fieldNotes: 'Community silvi-pasture and forestry block. Canopy closure is evident from field viewpoint. Ground vegetation indicates healthy biomass accumulation.',
    analysis: {
      validatedQuality: {
        status: 'Excellent',
        resolution: '1920x1080 (2.07 MP)',
        sharpnessScore: 90,
        lightingCondition: 'Optimal',
        gpsAccuracyMeters: 2.2
      },
      classification: 'Plantation/vegetation',
      confidenceScore: 96.1,
      observedInformation: [
        'Dense multi-tier tree canopy and understorey grass biomass',
        'High green leaf area index (LAI) visible with negligible leaf chlorosis',
        'Ground cover completely shields soil surface from raindrop impact erosion'
      ],
      inferredInformation: [
        'High evapotranspiration microclimate moderation for adjacent agricultural plots',
        'Significant carbon sequestration and topsoil organic matter buildup'
      ],
      unavailableInformation: [
        'Species-level taxonomic inventory for understorey grasses',
        'Precise biomass tonnage per hectare without destructive sampling'
      ],
      uncertaintyFlags: [],
      detectedFeatures: [
        { label: 'Afforestation Tree Canopy', confidence: 97 },
        { label: 'Perennial Herbaceous Understorey', confidence: 93 }
      ],
      nearbyFeatures: {
        streamDistanceMeters: 310,
        nearestInterventionName: 'Community Agroforestry Plantation PL-04',
        nearestVillageName: 'Devli (0.6 km)'
      },
      aiModelUsed: 'Gemini-3.8-Flash Vision / GeoWatershed Spectral Classifier',
      analyzedAt: '2026-08-02T15:24:10Z'
    }
  },
  {
    id: 'img-05',
    watershedId: 'sw-04',
    title: 'Loose Stone Gully Plug GP-02 Sediment Accumulation',
    imageUrl: gullyPlugSvg,
    latitude: 25.3412,
    longitude: 74.6335,
    date: '2026-07-15T10:05:00Z',
    villageId: 'v-02',
    villageName: 'Nimbahera Kalan',
    interventionType: 'Gully Plug',
    interventionId: 'int-05',
    uploadedBy: 'Dr. V. Meena',
    inspectorName: 'Dr. V. Meena (Hydrologist)',
    fieldNotes: 'Gully stabilization structure inspection. Structure has trapped extensive silt. Upstream silt bed is now flush with top stones. Recommend raising structure height by 0.5m.',
    analysis: {
      validatedQuality: {
        status: 'Good',
        resolution: '1920x1080 (2.07 MP)',
        sharpnessScore: 84,
        lightingCondition: 'Optimal',
        gpsAccuracyMeters: 2.5
      },
      classification: 'Barren/degraded land',
      confidenceScore: 78.5,
      observedInformation: [
        'Dry stone masonry loose boulder cross-barrier installed in drainage incision',
        'Heavy silt and sand deposit accumulated upstream of stone barrier',
        'Gully banks show steep un-vegetated slopes vulnerable to headward collapse'
      ],
      inferredInformation: [
        'Structure has reached effective sediment trapping capacity threshold',
        'Without intervention raising, future runoff will bypass or overtop the structure'
      ],
      unavailableInformation: [
        'Bulk density of trapped silt',
        'Upstream annual sediment yield in tons/km²/yr'
      ],
      uncertaintyFlags: [
        'Classified under Barren/degraded site due to surrounding exposed gully walls, despite presence of conservation stone structure.'
      ],
      detectedFeatures: [
        { label: 'Dry Stone Boulder Structure', confidence: 88 },
        { label: 'Eroded Gully Scarp', confidence: 91 },
        { label: 'Trapped Silt Bed', confidence: 85 }
      ],
      nearbyFeatures: {
        streamDistanceMeters: 10,
        nearestInterventionName: 'Loose Boulder Gully Plug GP-02',
        nearestVillageName: 'Nimbahera Kalan (0.7 km)'
      },
      aiModelUsed: 'Gemini-3.8-Flash Vision / GeoWatershed Spectral Classifier',
      analyzedAt: '2026-07-15T10:08:22Z'
    }
  }
];

export const sampleDrainageNetwork = {
  'sw-04': {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: { name: 'Kalyanpura Main Nala (3rd Order)', order: 3, lengthKm: 11.2 },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [74.605, 25.372],
            [74.622, 25.362],
            [74.638, 25.348],
            [74.646, 25.338],
            [74.662, 25.326],
            [74.675, 25.322]
          ]
        }
      },
      {
        type: 'Feature' as const,
        properties: { name: 'North Ridge Tributary (2nd Order)', order: 2, lengthKm: 5.4 },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [74.635, 25.385],
            [74.638, 25.365],
            [74.638, 25.348]
          ]
        }
      },
      {
        type: 'Feature' as const,
        properties: { name: 'Surajpura Stream (2nd Order)', order: 2, lengthKm: 6.8 },
        geometry: {
          type: 'LineString' as const,
          coordinates: [
            [74.610, 25.325],
            [74.625, 25.335],
            [74.646, 25.338]
          ]
        }
      }
    ]
  }
};

export const sampleWaterBodies = {
  'sw-04': {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: { name: 'Kalyanpura Check Dam Reservoir', type: 'Storage Reservoir', areaHa: 14.5, year2024AreaHa: 9.8, year2026AreaHa: 14.5 },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [74.636, 25.349],
            [74.642, 25.347],
            [74.644, 25.345],
            [74.640, 25.343],
            [74.635, 25.345],
            [74.636, 25.349]
          ]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { name: 'Rampuriya Percolation Tank', type: 'Percolation Tank', areaHa: 8.2, year2024AreaHa: 5.1, year2026AreaHa: 8.2 },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [74.648, 25.335],
            [74.652, 25.336],
            [74.654, 25.332],
            [74.650, 25.330],
            [74.647, 25.333],
            [74.648, 25.335]
          ]]
        }
      },
      {
        type: 'Feature' as const,
        properties: { name: 'Devli Village Pond', type: 'Village Talab', areaHa: 6.4, year2024AreaHa: 4.2, year2026AreaHa: 6.4 },
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [74.662, 25.358],
            [74.667, 25.360],
            [74.669, 25.356],
            [74.664, 25.354],
            [74.662, 25.358]
          ]]
        }
      }
    ]
  }
};

export const sampleSatelliteLayers: SatelliteLayerInfo[] = [
  {
    id: 'layer-ndvi-30m',
    name: 'Vegetation Health Index (NDVI 30m)',
    resolution: '30 m spatial resolution (AWiFS/LISS-III Demo Grid)',
    sensor: 'Demo Multi-Spectral 30m Grid (Red & NIR)',
    type: 'NDVI',
    description: 'Normalized Difference Vegetation Index resampled to 30 m spatial resolution for vegetative biomass and crop canopy vigor mapping.',
    provider: 'DEMO DATA',
    sourceMetadata: {
      source_type: 'demo',
      source_name: 'Demo Watershed Dataset',
      source_provider: 'DemoSatelliteProvider',
      source_date: '2026-01-01',
      is_official: false
    },
    availableYears: [2022, 2023, 2024, 2025, 2026],
    colorLegend: [
      { label: 'Dense Vegetation / Forest (NDVI > 0.60)', color: '#15803d', range: '0.60 - 0.85' },
      { label: 'Moderate Canopy / Crops (NDVI 0.40 - 0.60)', color: '#65a30d', range: '0.40 - 0.60' },
      { label: 'Sparse / Scrub Cover (NDVI 0.20 - 0.40)', color: '#facc15', range: '0.20 - 0.40' },
      { label: 'Barren / Fallow Soil (NDVI 0.05 - 0.20)', color: '#d97706', range: '0.05 - 0.20' },
      { label: 'Water / Shadow (NDVI < 0.05)', color: '#0284c7', range: '< 0.05' }
    ]
  },
  {
    id: 'layer-ndwi-30m',
    name: 'Surface Water Extent Index (NDWI 30m)',
    resolution: '30 m spatial resolution (Optical Green & NIR Demo Grid)',
    sensor: 'Demo Optical Green & NIR Spectral Ratio (McFeeters)',
    type: 'NDWI',
    description: 'Normalized Difference Water Index calibrated for delineation of open water reservoirs, check dam impoundments, and farm ponds.',
    provider: 'DEMO DATA',
    sourceMetadata: {
      source_type: 'demo',
      source_name: 'Demo Watershed Dataset',
      source_provider: 'DemoSatelliteProvider',
      source_date: '2026-01-01',
      is_official: false
    },
    availableYears: [2022, 2024, 2026],
    colorLegend: [
      { label: 'Deep Open Water Body', color: '#0369a1', range: '> +0.30' },
      { label: 'Shallow / Silted Water Pond', color: '#38bdf8', range: '+0.10 to +0.30' },
      { label: 'Moist Soil / Wetland Fringe', color: '#0d9488', range: '-0.10 to +0.10' },
      { label: 'Non-Water / Upland', color: '#e2e8f0', range: '< -0.10' }
    ]
  },
  {
    id: 'layer-lulc-30m',
    name: 'Land Use / Land Cover (LULC 30m)',
    resolution: '30 m Multi-temporal Classified Grid',
    sensor: 'Demo Multi-Spectral Classification Grid',
    type: 'LULC',
    description: 'Thematic land classification discerning double-cropped land, kharif crop, scrubland, wasteland, and built-up areas.',
    provider: 'DEMO DATA',
    sourceMetadata: {
      source_type: 'demo',
      source_name: 'Demo Watershed Dataset',
      source_provider: 'DemoSatelliteProvider',
      source_date: '2026-01-01',
      is_official: false
    },
    availableYears: [2024, 2026],
    colorLegend: [
      { label: 'Agricultural Cropland', color: '#84cc16' },
      { label: 'Plantation & Agroforestry', color: '#166534' },
      { label: 'Scrubland / Grazing Common', color: '#ca8a04' },
      { label: 'Barren Rocky / Degraded', color: '#b45309' },
      { label: 'Water Body / Reservoir', color: '#0284c7' },
      { label: 'Settlement / Rural Habitat', color: '#ef4444' }
    ]
  },
  {
    id: 'layer-dem-slope',
    name: 'Digital Elevation Model & Slope (CartoDEM 30m)',
    resolution: '30 m Hypsometric Terrain Grid',
    sensor: 'Demo CartoDEM Hypsography (30m)',
    type: 'DEM',
    description: 'Surface elevation and ridge-to-valley flow accumulation model used for contour trench alignment and check dam siting.',
    provider: 'DEMO DATA',
    sourceMetadata: {
      source_type: 'demo',
      source_name: 'Demo Watershed Dataset',
      source_provider: 'DemoSatelliteProvider',
      source_date: '2026-01-01',
      is_official: false
    },
    availableYears: [2026],
    colorLegend: [
      { label: 'High Ridge (> 520 m AMSL)', color: '#7c2d12' },
      { label: 'Upper Pediment (470 - 520 m)', color: '#d97706' },
      { label: 'Middle Undulating Plain (430 - 470 m)', color: '#eab308' },
      { label: 'Valley Floor / Stream Bed (< 430 m)', color: '#15803d' }
    ]
  }
];

export const sampleChangeDetection: Record<string, ChangeDetectionResult> = {
  'sw-04_2024_2026': {
    watershedId: 'sw-04',
    baseYear: 2024,
    comparisonYear: 2026,
    vegetationChangePercent: +14.2,
    vegetationChangeKm2: +16.8,
    waterBodyChangeKm2: +2.5,
    newInterventionsCommissioned: 31,
    detectedParcels: [
      {
        id: 'chg-01',
        type: 'Water Body Expansion',
        areaHectares: 18.2,
        confidence: 'High',
        latitude: 25.3475,
        longitude: 74.6395,
        description: 'Substantial backwater impoundment expansion upstream of Masonry Check Dam CD-01 due to deepening and desilting.',
        recommendedAction: 'Verify spillway freeboard clearance and monitor downstream channel scouring.',
        coordinates: [
          [25.346, 74.638],
          [25.349, 74.640],
          [25.348, 74.643],
          [25.345, 74.641]
        ]
      },
      {
        id: 'chg-02',
        type: 'Vegetation Increase',
        areaHectares: 46.5,
        confidence: 'High',
        latitude: 25.3550,
        longitude: 74.6500,
        description: 'Canopy vigor and biomass increase detected across Devli community agroforestry plot (PL-04). NDVI rose from 0.31 to 0.58.',
        recommendedAction: 'Maintain live hedge fencing and plan rotational lopping for livestock fodder.',
        coordinates: [
          [25.353, 74.648],
          [25.357, 74.649],
          [25.358, 74.654],
          [25.354, 74.653]
        ]
      },
      {
        id: 'chg-03',
        type: 'Land Reclamation',
        areaHectares: 32.0,
        confidence: 'Medium',
        latitude: 25.3370,
        longitude: 74.6310,
        description: 'Previously stony fallow converted into double-cropped land following construction of continuous contour trenches (CCT-08).',
        recommendedAction: 'Promote micro-irrigation (sprinkler/drip) to preserve elevated aquifer storage.',
        coordinates: [
          [25.335, 74.629],
          [25.339, 74.630],
          [25.340, 74.634],
          [25.336, 74.633]
        ]
      },
      {
        id: 'chg-04',
        type: 'Erosion Vulnerability',
        areaHectares: 8.4,
        confidence: 'High',
        latitude: 25.3412,
        longitude: 74.6335,
        description: 'Siltation saturation at Loose Boulder Gully Plug GP-02 causing localized bank overtopping risk.',
        recommendedAction: 'Prioritize desilting and construct vegetative vetiver grass hedgerow along side scarp.',
        coordinates: [
          [25.340, 74.632],
          [25.342, 74.633],
          [25.343, 74.635],
          [25.341, 74.636]
        ]
      }
    ],
    executiveSummary: 'Between 2024 and 2026, Kalyanpura Sub-watershed (SW-04) experienced a 14.2% net expansion in vegetative coverage (+16.8 km²) and a 2.5 km² net increase in persistent surface water spread. Thirty-one new water harvesting and soil conservation structures were commissioned.',
    evidenceBasedConclusion: 'The integration of geo-coded field evidence (check dam photographs CD-01, farm ponds FP-03, and ridge trenches CCT-08) directly corroborates the 30 m satellite NDVI and NDWI gains. Ground inspection verifies that water retention within drainage corridors has stimulated surrounding rabi cultivation.'
  }
};
