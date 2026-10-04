import React from 'react';
import { 
  Database, 
  ExternalLink, 
  Satellite, 
  Camera, 
  Map, 
  Layers, 
  FileSpreadsheet, 
  CheckCircle2, 
  ShieldAlert,
  Download
} from 'lucide-react';

interface DataSourceModalProps {
  onClose: () => void;
}

export const DataSourceModal: React.FC<DataSourceModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[1300] bg-[#171717]/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-[#ffffff] border border-[#dee2de] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dee2de] bg-[#f9faf7]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-[#1f1f29] text-white">
              <Database className="w-4 h-4 text-[#41a1cf]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-normal text-[#171717]">
                Official Data Sources & Field Acquisition Guide
              </h3>
              <p className="text-xs text-[#646464]">
                Where to obtain authentic official datasets for real-world watershed deployments
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#646464] hover:bg-[#dee2de] hover:text-[#171717]"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          
          {/* Section 1: SRISHTI-DRISHTI */}
          <div className="p-4 bg-sky-50/50 rounded-xl border border-sky-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm font-semibold text-sky-950 flex items-center gap-2">
                <Satellite className="w-4 h-4 text-[#0284c7]" />
                1. Official SRISHTI-DRISHTI Platform (NRSC / ISRO / DoLR)
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-medium">
                Primary Government Portal
              </span>
            </div>
            <p className="text-[#334155] leading-relaxed">
              <strong>SRISHTI</strong> is the web-GIS geoportal and <strong>DRISHTI</strong> is the official mobile field photo capture app developed by National Remote Sensing Centre (NRSC), ISRO for Department of Land Resources (DoLR), Ministry of Rural Development:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#334155]">
              <li>
                <strong>Bhuvan-Srishti Portal:</strong> Access web-GIS layers for WDC-PMKSY watershed development projects at <a href="https://bhuvan-srishti.nrsc.gov.in" target="_blank" rel="noreferrer" className="text-[#0284c7] underline font-medium">bhuvan-srishti.nrsc.gov.in</a>.
              </li>
              <li>
                <strong>Bhuvan-Drishti Mobile App:</strong> Used by Watershed Development Team (WDT) officers and Gram Panchayat field workers to capture GPS-tagged photos with compass bearing and structure ID. Available on Bhuvan mobile portal.
              </li>
              <li>
                <strong>WDC-PMKSY MIS Portal:</strong> Project data, physical/financial progress, and structure codes at <a href="https://wdcpmksy.gov.in" target="_blank" rel="noreferrer" className="text-[#0284c7] underline font-medium">wdcpmksy.gov.in</a>.
              </li>
            </ul>
          </div>

          {/* Section 2: Satellite Remote Sensing */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-[#171717] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#41a1cf]" />
              2. 30 m Spatial Resolution Satellite Datasets (NDVI, NDWI, Elevation)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] space-y-1">
                <span className="font-semibold text-[#171717]">ISRO Bhoonidhi / Bhuvan</span>
                <p className="text-[#646464] text-[11px]">
                  Download Resourcesat-2A AWiFS (56m) and LISS-III (23.5m / 30m gridded) multi-spectral imagery.
                </p>
                <p className="font-mono text-[10px] text-[#0284c7]">bhoonidhi.nrsc.gov.in</p>
              </div>

              <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] space-y-1">
                <span className="font-semibold text-[#171717]">USGS EarthExplorer</span>
                <p className="text-[#646464] text-[11px]">
                  Free global 30 m multi-spectral data (Landsat 8 & 9 OLI/TIRS) with red and NIR bands for NDVI/NDWI.
                </p>
                <p className="font-mono text-[10px] text-[#0284c7]">earthexplorer.usgs.gov</p>
              </div>

              <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] space-y-1">
                <span className="font-semibold text-[#171717]">Google Earth Engine (GEE)</span>
                <p className="text-[#646464] text-[11px]">
                  Cloud computation for multi-year NDVI time-series over watershed boundaries via Python/JS API.
                </p>
                <p className="font-mono text-[10px] text-[#0284c7]">earthengine.google.com</p>
              </div>
            </div>
          </div>

          {/* Section 3: Watershed Vector Boundaries */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-semibold text-[#171717] flex items-center gap-2">
              <Map className="w-4 h-4 text-[#15803d]" />
              3. Watershed Boundaries, Drainage & Village GIS Layers
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] space-y-1">
                <span className="font-semibold text-[#171717]">SLUSI Watershed Atlas of India</span>
                <p className="text-[#646464] text-[11px]">
                  Soil and Land Use Survey of India (SLUSI) provides official digitized micro/sub-watershed boundary shapefiles at 1:50,000 scale.
                </p>
                <p className="font-mono text-[10px] text-[#0284c7]">slusi.dacnet.nic.in</p>
              </div>

              <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] space-y-1">
                <span className="font-semibold text-[#171717]">India-WRIS (Water Resources)</span>
                <p className="text-[#646464] text-[11px]">
                  Hydrological stream networks, surface water spread reservoirs, and river sub-basins in GeoJSON/Shapefile.
                </p>
                <p className="font-mono text-[10px] text-[#0284c7]">indiawris.gov.in</p>
              </div>
            </div>
          </div>

          {/* Section 4: Where Values Live in this Application */}
          <div className="p-4 bg-[#f9faf7] rounded-xl border border-[#dee2de] space-y-2">
            <span className="font-semibold text-[#171717] block">
              4. Where are these values stored in this application codebase?
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white rounded border border-[#dee2de]">
                <code className="font-mono text-[#0284c7]">server/data/watershedData.ts</code>
                <p className="text-[#646464] mt-0.5">
                  Contains all realistic watershed GeoJSON boundaries, drainage lines, village coordinates, check dam structures, and yearly metrics (2022-2026).
                </p>
              </div>
              <div className="p-2 bg-white rounded border border-[#dee2de]">
                <code className="font-mono text-[#0284c7]">server/services/satelliteProvider.ts</code>
                <p className="text-[#646464] mt-0.5">
                  Contains the SatelliteDataProvider abstraction implementing DemoSatelliteProvider, with integration-ready BhuvanProvider and SRISHTIDrishtiProvider adapters.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#dee2de] bg-[#f9faf7] flex items-center justify-between">
          <span className="text-[11px] text-[#646464] font-mono">
            Compliant with WDC-PMKSY Monitoring Standards
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors"
          >
            Close Guide
          </button>
        </div>

      </div>
    </div>
  );
};
