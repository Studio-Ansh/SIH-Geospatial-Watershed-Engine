import React, { useState, useEffect } from 'react';
import { 
  Satellite, 
  Layers, 
  Info, 
  CheckCircle, 
  AlertTriangle, 
  Cpu,
  MapPin,
  Calendar,
  Lock,
  Compass
} from 'lucide-react';
import { SatelliteLayerInfo } from '../../types/index.js';
import { fetchSatelliteLayers, fetchSatelliteProviderStatus } from '../../services/api.js';

interface SatelliteLayerModuleProps {
  onOpenGisMap: () => void;
}

export const SatelliteLayerModule: React.FC<SatelliteLayerModuleProps> = ({
  onOpenGisMap
}) => {
  const [selectedProvider, setSelectedProvider] = useState<'demo' | 'bhuvan' | 'srishti'>('demo');
  const [layers, setLayers] = useState<SatelliteLayerInfo[]>([]);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<SatelliteLayerInfo | null>(null);

  useEffect(() => {
    loadProviderData(selectedProvider);
  }, [selectedProvider]);

  const loadProviderData = async (provId: string) => {
    setIsLoading(true);
    try {
      const [layerList, statusRes] = await Promise.all([
        fetchSatelliteLayers(provId),
        fetchSatelliteProviderStatus(provId)
      ]);
      setLayers(layerList);
      setProviderStatus(statusRes.data || statusRes.status);
      if (layerList.length > 0) {
        setSelectedLayer(layerList[0]);
      } else {
        setSelectedLayer(null);
      }
    } catch (err) {
      console.error('Failed to load satellite data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#646464]">
            <Satellite className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span>REMOTE SENSING & SATELLITE LAYERS ARCHITECTURE</span>
          </div>
          <h2 className="mt-1 font-serif text-2xl font-normal text-[#171717]">
            30 m Geospatial Data Providers
          </h2>
          <p className="mt-1 text-xs text-[#646464]">
            Pluggable <code className="font-mono text-[#171717]">SatelliteDataProvider</code> framework supporting local demonstration grids and integration-ready adapters for official national geospatial portals.
          </p>
        </div>

        <button
          onClick={onOpenGisMap}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors shadow-sm self-start md:self-auto"
        >
          <Layers className="w-4 h-4 text-[#41a1cf]" />
          <span>View on GIS Map</span>
        </button>
      </div>

      {/* Provider Selector Panel (Requirement 8) */}
      <div className="p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase text-[#646464]">Select Remote Sensing Provider</span>
            <div className="flex items-center gap-2">
              <label htmlFor="satellite-provider-select" className="text-xs font-medium text-[#171717]">Data Provider:</label>
              <select
                id="satellite-provider-select"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as any)}
                className="px-3 py-1.5 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs font-medium text-[#171717] focus:outline-none focus:border-[#41a1cf] cursor-pointer"
              >
                <option value="demo">Demo Watershed Dataset</option>
                <option value="bhuvan">Bhuvan / NRSC (Integration Ready)</option>
                <option value="srishti">SRISHTI-DRISHTI (Integration Ready)</option>
              </select>
            </div>
          </div>

          {/* Provider Status Indicator */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {selectedProvider === 'demo' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="font-medium text-emerald-900">Status: ● Available</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs">
                <span className="w-2 h-2 rounded-full border border-amber-600"></span>
                <span className="font-medium text-amber-900">Status: ○ Integration Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* State Banner Based on Selected Provider */}
        {selectedProvider === 'demo' ? (
          <div className="p-4 bg-[#f9faf7] rounded-xl border border-[#dee2de] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                  DEMO DATA — NOT OFFICIAL SATELLITE DATA
                </span>
                <span className="text-[#646464] text-[11px]">Active working prototype provider</span>
              </div>
              <p className="text-[#444141] text-[11px] leading-relaxed">
                Deterministic 30 m spatial resolution data emulating Resourcesat AWiFS & LISS-III grids for testing vegetative indicators (NDVI), water spread (NDWI), and land classification.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[#0284c7] font-semibold shrink-0">
              Provider: DemoSatelliteProvider
            </span>
          </div>
        ) : selectedProvider === 'bhuvan' ? (
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>Official Bhuvan/NRSC service access has not been configured.</span>
            </div>
            <p className="text-[#444141] text-[11px] leading-relaxed">
              The <code className="font-mono text-amber-950 font-semibold bg-white px-1 py-0.5 rounded border border-amber-200">BhuvanProvider</code> adapter is implemented as an integration-ready interface in <code className="font-mono">server/services/satelliteProvider.ts</code>. Authorized institutional OGC WMS/WMTS endpoints can be connected once official departmental permissions are granted. No fake credentials or mock endpoints are used.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-900 font-medium">
              <Lock className="w-4 h-4 text-amber-700" />
              <span>SRISHTI-DRISHTI integration requires an authorized data/service connection. The current application is using demonstration data.</span>
            </div>
            <p className="text-[#444141] text-[11px] leading-relaxed">
              The <code className="font-mono text-amber-950 font-semibold bg-white px-1 py-0.5 rounded border border-amber-200">SRISHTIDrishtiProvider</code> adapter is structured to interface with Department of Land Resources (DoLR) and NRSC geospatial data protocols. In development and demonstration mode, the application operates purely local-first with deterministic demonstration datasets.
            </p>
          </div>
        )}
      </div>

      {/* Main Content Grid: Display demo layers when Demo is selected */}
      {selectedProvider === 'demo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Layer Catalog (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-normal text-[#171717]">
                Demonstration 30 m Layer Catalog
              </h3>
              <span className="text-[10px] font-mono text-[#646464]">DEMO DATA</span>
            </div>

            <div className="space-y-2.5">
              {layers.map((layer) => {
                const isSelected = selectedLayer?.id === layer.id;

                return (
                  <div
                    key={layer.id}
                    onClick={() => setSelectedLayer(layer)}
                    className={`p-4 bg-[#ffffff] rounded-xl border transition-all cursor-pointer shadow-sm ${
                      isSelected
                        ? 'border-[#41a1cf] ring-1 ring-[#41a1cf]/20 bg-sky-50/20'
                        : 'border-[#dee2de] hover:border-[#b4b8b4]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-medium bg-[#f9faf7] text-[#2c2c2c] border border-[#dee2de]">
                            {layer.resolution}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                            DEMO DATA
                          </span>
                        </div>
                        <h4 className="font-serif text-base font-medium text-[#171717] mt-1">
                          {layer.name}
                        </h4>
                      </div>
                    </div>

                    <p className="mt-1.5 text-xs text-[#646464] line-clamp-2">
                      {layer.description}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#646464] pt-2 border-t border-[#dee2de]/60">
                      <span className="font-mono text-[10px]">{layer.sensor}</span>
                      <span className="font-mono text-[10px]">{layer.availableYears.join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Layer Dossier & Symbology (7 cols) */}
          <div className="lg:col-span-7">
            {selectedLayer ? (
              <div className="p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4">
                
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#dee2de]">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#646464]">DEMO LAYER SPECIFICATION</span>
                    <h3 className="font-serif text-xl font-medium text-[#171717]">
                      {selectedLayer.name}
                    </h3>
                    <p className="text-xs text-[#646464] mt-0.5">
                      Sensor Emulation: {selectedLayer.sensor}
                    </p>
                  </div>

                  <button
                    onClick={onOpenGisMap}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#41a1cf] text-[#41a1cf] hover:bg-[#41a1cf]/10 text-xs font-medium"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Overlay on Map</span>
                  </button>
                </div>

                {/* Technical Specifications */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-[#f9faf7] p-3.5 rounded-xl border border-[#dee2de]">
                  <div>
                    <span className="text-[#646464] text-[10px]">Data Classification:</span>
                    <p className="font-medium text-amber-800">DEMO DATA — NOT OFFICIAL</p>
                  </div>
                  <div>
                    <span className="text-[#646464] text-[10px]">Spatial Resolution:</span>
                    <p className="font-mono font-medium text-[#171717]">{selectedLayer.resolution}</p>
                  </div>
                  <div>
                    <span className="text-[#646464] text-[10px]">Coordinate Grid:</span>
                    <p className="font-mono font-medium text-[#171717]">EPSG:4326 (WGS 84)</p>
                  </div>
                  <div>
                    <span className="text-[#646464] text-[10px]">Active Adapter:</span>
                    <p className="font-medium text-[#0284c7]">DemoSatelliteProvider</p>
                  </div>
                </div>

                {/* Symbology Color Legend */}
                <div className="space-y-2">
                  <span className="text-xs font-serif font-medium text-[#171717] block">
                    Classification & Symbology Legend
                  </span>

                  <div className="space-y-1.5 border border-[#dee2de] rounded-xl p-3 bg-[#ffffff]">
                    {selectedLayer.colorLegend.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs py-1 border-b border-[#dee2de]/50 last:border-none">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-4 h-4 rounded shadow-sm border border-black/10 shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-[#2c2c2c] font-medium">{item.label}</span>
                        </div>
                        {item.range && (
                          <span className="font-mono text-[11px] text-[#646464]">
                            {item.range}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear demarcation message */}
                <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] text-[11px] text-[#646464]">
                  <p>
                    <strong>Note:</strong> All spatial indices and grid cells shown above are synthesized demonstration values representing semi-arid Indian catchments. They allow testing analytical change-detection workflows without claiming unauthorized live access.
                  </p>
                </div>

              </div>
            ) : (
              <div className="p-8 bg-[#ffffff] rounded-2xl border border-[#dee2de] text-center text-[#646464] text-xs">
                Select a demonstration layer to view specifications.
              </div>
            )}
          </div>

        </div>
      ) : (
        /* Integration Ready Placeholder View for Bhuvan or SRISHTI */
        <div className="p-8 bg-[#ffffff] rounded-2xl border border-[#dee2de] text-center space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-medium text-[#171717]">
              {selectedProvider === 'bhuvan' ? 'Bhuvan / NRSC Integration Ready' : 'SRISHTI-DRISHTI Integration Ready'}
            </h3>
            <p className="mt-1 text-xs text-[#646464] leading-relaxed">
              {selectedProvider === 'bhuvan'
                ? 'Official Bhuvan/NRSC service access has not been configured.'
                : 'SRISHTI-DRISHTI integration requires an authorized data/service connection. The current application is using demonstration data.'}
            </p>
          </div>
          <div className="p-3.5 bg-[#f9faf7] rounded-xl border border-[#dee2de] text-left text-xs text-[#444141] space-y-2">
            <span className="font-semibold text-[#171717] block">How real data integration works:</span>
            <p className="text-[11px] leading-relaxed">
              1. The architecture defines clean provider adapters in <code className="font-mono text-[#0284c7]">server/services/satelliteProvider.ts</code>.<br/>
              2. When official credentials or endpoints are approved by NRSC / DoLR, they are configured in the server adapter without modifying GIS or frontend code.<br/>
              3. To continue testing the watershed monitoring workflow right now, switch back to <strong>Demo Watershed Dataset</strong>.
            </p>
          </div>
          <button
            onClick={() => setSelectedProvider('demo')}
            className="px-4 py-2 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors"
          >
            Switch to Demo Watershed Dataset
          </button>
        </div>
      )}

    </div>
  );
};
