# GeoWatershed: Geospatial Analysis & Geo-coded Image Platform for Watershed Development

> **A decision-support and evidence-based monitoring platform designed for watershed planning, soil & water conservation tracking, and multi-temporal impact assessment.**
> 
> *Transparently operating with deterministic **DEMO DATA** for prototype verification, while providing a clean, modular integration architecture for authorized **ISRO Bhuvan** and **SRISHTI-DRISHTI** services.*

---

## 1. What the Project Does

Watershed development projects (such as those under WDC-PMKSY in India) involve large-scale field interventions:
- Masonry & earthen check dams
- Excavated farm ponds and percolation tanks
- Continuous contour trenches (CCT) along hill ridges
- Afforestation and silvi-pasture plantations
- Loose boulder gully stabilization structures

Traditionally, monitoring these distributed assets relies either solely on remote satellite data (which lacks ground-level physical validation) or on field photographs filed as static bureaucratic documentation.

**GeoWatershed** integrates:
$$\text{Geo-coded Field Photos} + \text{GPS Coordinates} + \text{30 m Satellite Indices} + \text{GIS Layers} + \text{Change Detection} \implies \text{Watershed Intelligence}$$

---

## 2. Why Geo-Coded Images Are Important

Field photographs with precision GPS tags provide **irrefutable ground-truth evidence**:
1. **Verification of Physical Assets**: Confirms that a check dam or trench exists at the exact surveyed latitude/longitude.
2. **Structural Health & Maintenance Auditing**: Captures siltation levels, spillway cracks, or bank erosion that satellite sensors cannot discern.
3. **Calibrating Satellite Indices**: Links observed water ponding or tree growth with 30 m pixel signals (NDVI/NDWI).
4. **AI-Assisted Tripartite Verification**: The platform strictly delineates:
   - **Observed Information**: Physical objects visibly confirmed (e.g. masonry weir wall, apron riprap).
   - **Inferred Information**: Hydrological deductions (e.g. localized aquifer recharge).
   - **Unavailable Information**: Limits of surface photographs (e.g. bedrock permeability, subsoil infiltration rates).

---

## 3. How Satellite & Geospatial Information Is Integrated

The platform coordinates multiple GIS layers across a unified interactive Leaflet map canvas:
- **Vector Layers**:
  - Catchment boundaries (GeoJSON polygons)
  - Drainage networks categorized by stream order (Order 2 and Order 3 lines)
  - Water body spread polygons
  - Village habitations & demographic points
  - Intervention points color-coded by operational status
- **Raster Overlays (30 m Spatial Resolution)**:
  - **Vegetation Health Index (NDVI)**: Delineating biomass vigor and canopy expansion.
  - **Surface Water Index (NDWI)**: Delineating reservoir spread and post-monsoon water persistence.
  - **Land Use / Land Cover (LULC)**: Classifying cropland, double cropping, scrubland, and degraded fallows.
  - **CartoDEM Elevation Model**: Hypsometry and terrain slope contours for ridge-to-valley planning.

---

## 4. How the Bhuvan / SRISHTI Architecture Works

The application architecture separates concerns into clean layers:

```
                      ┌──────────────────────────────────────────────┐
                      │          WEB GIS CLIENT (React 19)           │
                      │ • Leaflet Multi-Layer Map + Swipe Compare    │
                      │ • Field Photo Upload & Tripartite AI Panel   │
                      │ • Multi-Temporal Change Detection Dashboard  │
                      └──────────────────────┬───────────────────────┘
                                             │ REST API (JSON / GeoJSON)
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │        BACKEND SERVER (Express / tsx)        │
                      │ • Routes: /api/watersheds, /api/images, ...  │
                      │ • AI Engine: @google/genai (Gemini 3.8 Flash)│
                      │ • Spatial Change Computation Engine          │
                      └──────────────────────┬───────────────────────┘
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    SatelliteDataProvider Interface (Core)    │
                      ├──────────────────────┬───────────────────────┤
                      │                      │                       │
                      ▼                      ▼                       ▼
            DemoSatelliteProvider      BhuvanProvider       SRISHTIDrishtiProvider
             [Active by Default]     [Integration-Ready]     [Integration-Ready]
            • Local deterministic   • Future official ISRO  • Future official DoLR/
              30m spatial grids       Bhuvan WMS adapter      NRSC service adapter
            • Clearly labeled:      • No fake endpoints     • No fake endpoints
              "DEMO DATA"           • No hard-coded keys    • No hard-coded keys
```

---

## 5. Why Demo Mode Exists

Official remote-sensing services from ISRO/NRSC (such as Bhuvan-Srishti and Bhoonidhi) operate under departmental authentication protocols for authorized institutions (Department of Land Resources, State Nodal Agencies, and District Watershed Committees). 

To ensure **100% functionality and reproducibility** without fabricating or simulating unauthorized governmental API endpoints:
- The prototype operates on `DemoSatelliteProvider` by default.
- All demo data is **deterministic** (predictable, consistent results across reloads).
- Every synthetic layer is clearly marked: **`DEMO DATA — NOT OFFICIAL SATELLITE DATA`**.
- The user can evaluate the complete analytical workflow without needing external credentials.

---

## 6. Real Data Integration

> **IMPORTANT:** This project does **NOT** assume, invent, or fabricate a public `SRISHTI_API_ENDPOINT` or `SRISHTI_API_KEY`. The application runs completely without requiring these variables.

When authorized departmental access is granted:
1. Open `server/services/satelliteProvider.ts`.
2. Locate the integration-ready adapters:
   - `BhuvanProvider`: Connects to authorized ISRO Bhuvan OGC WMS/WMTS endpoints.
   - `SRISHTIDrishtiProvider`: Connects to authorized Ministry of Rural Development / NRSC data feeds.
3. Configure the official institutional endpoint and authentication within the designated adapter methods.
4. Set `DATA_PROVIDER="bhuvan"` or `DATA_PROVIDER="srishti"` in your private deployment environment.
5. The core GIS engine, map canvas, and analytical dashboards will ingest the live feed without requiring any frontend refactoring.

---

## 7. Folder Architecture

The project is structured into clean, modular directories:

```
├── models/                     # Shared TypeScript domain models & schemas
│   ├── watershed.ts            # Watershed, Village & yearly metrics
│   ├── intervention.ts         # Check dams, farm ponds, trenches, statuses
│   ├── geoImage.ts             # Geo-coded photos, quality checks, AI results
│   ├── satellite.ts            # SatelliteLayerInfo & SatelliteDataProvider contracts
│   ├── changeDetection.ts      # Change detection results & spatial parcels
│   ├── user.ts                 # User profile & RBAC roles
│   └── index.ts                # Central barrel export
│
├── database/                   # Data storage & repository layer
│   ├── seedData.ts             # Deterministic watershed boundaries, drainage & interventions
│   ├── db.ts                   # In-memory & JSON file persistence repository
│   └── index.ts                # Database barrel export
│
├── backend/                    # Server-side API & engines
│   ├── routes/                 # Modular Express endpoints
│   │   ├── watershedRoutes.ts  # /api/watersheds & layer geometries
│   │   ├── imageRoutes.ts      # /api/images & /api/images/analyze
│   │   ├── interventionRoutes.ts# /api/interventions
│   │   ├── satelliteRoutes.ts  # /api/satellite/layers & provider statuses
│   │   ├── changeDetectionRoutes.ts # /api/change-detection
│   │   ├── aiRoutes.ts         # /api/ai/watershed-summary
│   │   └── index.ts            # Aggregated /api router
│   ├── services/
│   │   ├── satelliteProvider.ts # Demo, Bhuvan & SRISHTI adapters
│   │   ├── analysisEngine.ts   # Gemini Vision & heuristic image inspection
│   │   └── changeDetectionEngine.ts # 30 m pixel difference algorithm
│   └── index.ts                # Backend barrel export
│
├── frontend/                   # Client-side React 19 SPA
│   ├── components/             # Reusable UI & geospatial views
│   │   ├── Dashboard/          # Watershed overview, biomass & water metrics
│   │   ├── Map/                # Leaflet interactive GIS canvas (GISMap.tsx)
│   │   ├── Images/             # Geo-coded photographic evidence catalogue
│   │   ├── Interventions/      # Conservation structures inventory & dossier
│   │   ├── Satellite/          # 30 m remote sensing layer catalog
│   │   ├── ChangeDetection/    # Swipe comparison simulator & parcel table
│   │   ├── Reports/            # Printable evaluation dossiers
│   │   ├── Analysis/           # Deep-dive photo evidence modal
│   │   ├── Header.tsx          # Multi-watershed selector & global search
│   │   └── Sidebar.tsx         # Primary module navigation
│   ├── services/               # Frontend HTTP API client
│   ├── motion.ts               # Framer Motion transitions
│   ├── App.tsx                 # Root application controller & state
│   ├── main.tsx                # SPA entry point
│   └── index.css               # Tailwind CSS styles
│
├── server.ts                   # Full-stack entry point (Express + Vite middlewares)
├── index.html                  # HTML entry point (targets /frontend/main.tsx)
├── vite.config.ts              # Vite config with @models, @database, @backend, @frontend aliases
└── tsconfig.json               # TypeScript configuration with path mapping
```

---

## 8. Functional vs Integration-Ready Modules

| Platform Component | Current Status | Details |
|---|---|---|
| **Interactive Leaflet GIS Map** | **Functional** | Full zoom, pan, layer toggles, base maps, and feature inspection. |
| **Geo-coded Image Upload & GPS Locator** | **Functional** | Accepts photos, parses coordinates, binds to villages, and pins to map. |
| **AI Visual Analysis Engine** | **Functional** | Photographic quality check + observed/inferred/unavailable breakdown via Gemini 3.8 Flash or deterministic heuristic. |
| **Interventions Dossier** | **Functional** | Structure inventory, storage capacity ($m^3$), status tracking, and monitoring logs. |
| **Change Detection (2024 vs 2026)** | **Functional** | Quantified metrics (+14% veg, +8% water, -6% degraded), swipe slider, and change parcels. |
| **Executive Reporting** | **Functional** | Printable evidence-based monitoring summary with official data source metadata. |
| **DemoSatelliteProvider** | **Functional** | Deterministic 30m simulated grids labeled as DEMO DATA. |
| **BhuvanProvider** | **Integration-Ready** | Adapter interface ready to receive authorized NRSC/ISRO WMS/WCS services. |
| **SRISHTIDrishtiProvider** | **Integration-Ready** | Adapter interface ready to connect to official DoLR/NRSC data streams. |

---

## 8. How to Run the Application

### Prerequisites
- Node.js 18+ and npm
- (Optional) `GEMINI_API_KEY` for server-side AI visual analysis (configured in AI Studio Secrets)

### Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Start the full-stack development server
npm run dev

# The application runs on: http://localhost:3000
```

### Environment Variables (`.env.example`)
```env
# Optional Gemini API key for AI vision & report synthesis
GEMINI_API_KEY="MY_GEMINI_API_KEY"

# Data provider selector: 'demo' (default), 'bhuvan', or 'srishti'
DATA_PROVIDER="demo"
```
*Note: No satellite API keys or endpoints are required to run the prototype.*

---

## 9. Demonstration Workflow

1. **Select Watershed**: Choose **"Kalyanpura Sub-watershed (SW-04)"** from the top header.
2. **Review Data Environment**: On the Dashboard, verify the **DATA ENVIRONMENT** status (*Satellite Provider: Demo Watershed Dataset*, *External Connection: Not configured*).
3. **Explore GIS Map**: Click **"GIS View"**. Toggle the 30 m raster layers (**NDVI**, **NDWI**, **LULC**) and note the **`DEMO DATA`** indicator.
4. **Inspect Ground Evidence**: Click on photo marker **"Masonry Check Dam CD-01"** and select **"View AI Analysis"** to see observed vs inferred vs unavailable information.
5. **Run Change Detection**: Navigate to **Change Detection**, select **2024 vs 2026**, use the **Swipe Simulator**, and review the **Demo-derived change statistics**.
6. **Generate Report**: Navigate to **Monitoring Reports** and generate a printable report citing the exact data sources used.
