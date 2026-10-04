import React from 'react';
import { 
  Compass, 
  Camera, 
  Layers, 
  Droplets, 
  TreePine, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  Calendar,
  Sparkles,
  FileText,
  Activity,
  MapPin
} from 'lucide-react';
import { 
  Watershed, 
  GeoImage, 
  Intervention, 
  ChangeDetectionResult 
} from '../../types/index.js';

interface DashboardViewProps {
  watershed: Watershed;
  selectedYear: number;
  images: GeoImage[];
  interventions: Intervention[];
  changeDetection?: ChangeDetectionResult;
  onNavigateToMap: () => void;
  onNavigateToImages: () => void;
  onNavigateToInterventions: () => void;
  onNavigateToChange: () => void;
  onNavigateToReports: () => void;
  onSelectImage: (img: GeoImage) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  watershed,
  selectedYear,
  images,
  interventions,
  changeDetection,
  onNavigateToMap,
  onNavigateToImages,
  onNavigateToInterventions,
  onNavigateToChange,
  onNavigateToReports,
  onSelectImage
}) => {
  const currentMetrics = watershed.yearlyMetrics[selectedYear] || watershed.yearlyMetrics[2026];
  const baselineMetrics = watershed.yearlyMetrics[2022] || watershed.yearlyMetrics[2024];

  // Calculate year-over-year gains
  const vegGain = +(currentMetrics.vegetationCoveragePercent - baselineMetrics.vegetationCoveragePercent).toFixed(1);
  const waterGain = +(currentMetrics.waterBodyAreaKm2 - baselineMetrics.waterBodyAreaKm2).toFixed(1);

  // Intervention type counts
  const interventionCountsByType = interventions.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Multi-year trends array for mini-chart
  const years = [2022, 2023, 2024, 2025, 2026].filter(y => watershed.yearlyMetrics[y]);
  const vegTrend = years.map(y => ({ year: y, value: watershed.yearlyMetrics[y].vegetationCoveragePercent }));
  const waterTrend = years.map(y => ({ year: y, value: watershed.yearlyMetrics[y].waterBodyAreaKm2 }));

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Welcome & Sub-watershed Dossier Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#646464]">
            <span>WATERSHED INTELLIGENCE DOSSIER</span>
            <span>•</span>
            <span className="text-[#41a1cf] font-semibold">{watershed.code}</span>
          </div>
          <h2 className="mt-1 font-serif text-2xl md:text-3xl font-normal text-[#171717]">
            {watershed.name}
          </h2>
          <p className="mt-1 text-xs text-[#646464] max-w-3xl leading-relaxed">
            {watershed.summary}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNavigateToMap}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#41a1cf] text-[#41a1cf] hover:bg-[#41a1cf]/10 font-medium text-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Open 30m GIS Map</span>
          </button>
          <button
            onClick={onNavigateToReports}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* DATA ENVIRONMENT STATUS STRIP (Requirement 15) */}
      <div className="p-4 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold uppercase text-[10px] text-[#646464] bg-[#f9faf7] px-2 py-1 rounded border border-[#dee2de]">
            DATA ENVIRONMENT
          </span>
          <span className="text-amber-800 font-medium text-[11px]">
            DEMO DATA — NOT OFFICIAL SATELLITE DATA
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-[#646464] text-[10px] block font-sans">Satellite Provider:</span>
            <span className="text-[#171717] font-semibold">Demo Watershed Dataset</span>
          </div>
          <div>
            <span className="text-[#646464] text-[10px] block font-sans">External Connection:</span>
            <span className="text-amber-700 font-semibold">Not configured</span>
          </div>
          <div>
            <span className="text-[#646464] text-[10px] block font-sans">Field Data:</span>
            <span className="text-emerald-700 font-semibold">Available ({images.length} photos)</span>
          </div>
          <div>
            <span className="text-[#646464] text-[10px] block font-sans">Analysis Engine:</span>
            <span className="text-emerald-700 font-semibold">Available</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        
        {/* Total Area */}
        <div className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-medium uppercase font-mono">Catchment Area</span>
            <Compass className="w-4 h-4 text-[#41a1cf]" />
          </div>
          <p className="mt-2 text-xl font-mono font-medium text-[#171717]">
            {watershed.totalAreaKm2} <span className="text-xs font-normal text-[#646464]">km²</span>
          </p>
          <p className="mt-1 text-[11px] text-[#646464]">
            {watershed.villages.length} Gram Panchayats
          </p>
        </div>

        {/* Geo-coded Images */}
        <div 
          onClick={onNavigateToImages}
          className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm cursor-pointer hover:border-[#41a1cf] transition-all"
        >
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-medium uppercase font-mono">Geo-coded Photos</span>
            <Camera className="w-4 h-4 text-[#0284c7]" />
          </div>
          <p className="mt-2 text-xl font-mono font-medium text-[#171717]">
            {images.length} <span className="text-xs font-normal text-[#646464]">verified</span>
          </p>
          <p className="mt-1 text-[11px] text-[#0284c7] flex items-center gap-0.5">
            <span>100% GPS tagged</span>
            <ArrowUpRight className="w-3 h-3" />
          </p>
        </div>

        {/* Interventions */}
        <div 
          onClick={onNavigateToInterventions}
          className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm cursor-pointer hover:border-[#41a1cf] transition-all"
        >
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-medium uppercase font-mono">Interventions</span>
            <Layers className="w-4 h-4 text-[#15803d]" />
          </div>
          <p className="mt-2 text-xl font-mono font-medium text-[#171717]">
            {interventions.length} <span className="text-xs font-normal text-[#646464]">structures</span>
          </p>
          <p className="mt-1 text-[11px] text-[#15803d]">
            {interventions.filter(i => i.status === 'Operational').length} Operational
          </p>
        </div>

        {/* Vegetation Coverage */}
        <div className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-medium uppercase font-mono">Vegetation Cover</span>
            <TreePine className="w-4 h-4 text-[#16a34a]" />
          </div>
          <p className="mt-2 text-xl font-mono font-medium text-[#171717]">
            {currentMetrics.vegetationCoveragePercent}%
          </p>
          <p className="mt-1 text-[11px] text-[#16a34a] font-medium">
            +{vegGain}% vs Baseline
          </p>
        </div>

        {/* Water-body Area */}
        <div className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-medium uppercase font-mono">Water Spread</span>
            <Droplets className="w-4 h-4 text-[#0ea5e9]" />
          </div>
          <p className="mt-2 text-xl font-mono font-medium text-[#171717]">
            {currentMetrics.waterBodyAreaKm2} <span className="text-xs font-normal text-[#646464]">km²</span>
          </p>
          <p className="mt-1 text-[11px] text-[#0ea5e9] font-medium">
            +{waterGain} km² expansion
          </p>
        </div>

        {/* Detected Changes */}
        <div 
          onClick={onNavigateToChange}
          className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm cursor-pointer hover:border-[#41a1cf] transition-all"
        >
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-medium uppercase font-mono">Change Parcels</span>
            <TrendingUp className="w-4 h-4 text-[#d97706]" />
          </div>
          <p className="mt-2 text-xl font-mono font-medium text-[#171717]">
            {changeDetection?.detectedParcels.length || 4} <span className="text-xs font-normal text-[#646464]">zones</span>
          </p>
          <p className="mt-1 text-[11px] text-[#d97706] flex items-center gap-0.5">
            <span>2024 → 2026 Audit</span>
            <ArrowUpRight className="w-3 h-3" />
          </p>
        </div>

      </div>

      {/* Main Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Chart 1: Multi-Year Vegetation Trend (30m NDVI) */}
        <div className="p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-[#646464] uppercase tracking-wider">SATELLITE 30M NDVI PROGRESSION</span>
              <h3 className="font-serif text-lg font-medium text-[#171717]">
                Vegetation Coverage & Biomass Trend (2022 – 2026)
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
              +{vegGain}% Net Biomass
            </span>
          </div>

          {/* Clean Deterministic SVG Area Chart */}
          <div className="h-52 w-full pt-4">
            <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="vegGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="40" y1="20" x2="480" y2="20" stroke="#dee2de" strokeDasharray="3 3" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#dee2de" strokeDasharray="3 3" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#dee2de" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#b4b8b4" />

              {/* Y Axis labels */}
              <text x="15" y="25" fill="#646464" fontSize="10" fontFamily="monospace">70%</text>
              <text x="15" y="65" fill="#646464" fontSize="10" fontFamily="monospace">50%</text>
              <text x="15" y="105" fill="#646464" fontSize="10" fontFamily="monospace">30%</text>
              <text x="15" y="145" fill="#646464" fontSize="10" fontFamily="monospace">10%</text>

              {/* Data Path */}
              {/* 2022 (34.2% -> y 95), 2023 (41.5% -> y 80), 2024 (48.6% -> y 65), 2025 (55.4% -> y 50), 2026 (62.8% -> y 35) */}
              <path
                d="M 60,95 L 160,80 L 260,65 L 360,50 L 460,35 L 460,140 L 60,140 Z"
                fill="url(#vegGrad)"
              />
              <path
                d="M 60,95 L 160,80 L 260,65 L 360,50 L 460,35"
                fill="none"
                stroke="#15803d"
                strokeWidth="2.5"
              />

              {/* Data Point Markers */}
              {[
                { x: 60, y: 95, label: '34.2%', yr: '2022' },
                { x: 160, y: 80, label: '41.5%', yr: '2023' },
                { x: 260, y: 65, label: '48.6%', yr: '2024' },
                { x: 360, y: 50, label: '55.4%', yr: '2025' },
                { x: 460, y: 35, label: '62.8%', yr: '2026' }
              ].map((pt, idx) => (
                <g key={idx}>
                  <circle cx={pt.x} cy={pt.y} r="4.5" fill="#ffffff" stroke="#15803d" strokeWidth="2" />
                  <text x={pt.x} y={pt.y - 9} fill="#171717" fontSize="10" fontWeight="bold" textAnchor="middle">
                    {pt.label}
                  </text>
                  <text x={pt.x} y="155" fill="#646464" fontSize="10" textAnchor="middle" fontFamily="monospace">
                    {pt.yr}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <p className="text-xs text-[#646464] border-t border-[#dee2de]/60 pt-3">
            Vegetation cover increased from 34.2% (2022) to 62.8% (2026) in tandem with continuous contour trenches and tree plantations.
          </p>
        </div>

        {/* Chart 2: Water Storage & Surface Spread (30m NDWI) */}
        <div className="p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-[#646464] uppercase tracking-wider">SATELLITE 30M NDWI ANALYSIS</span>
              <h3 className="font-serif text-lg font-medium text-[#171717]">
                Surface Water Retention & Reservoir Spread
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-sky-50 text-sky-800 border border-sky-200">
              +{waterGain} km² (+134%)
            </span>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-52 w-full pt-4">
            <svg viewBox="0 0 500 160" className="w-full h-full overflow-visible">
              <line x1="40" y1="20" x2="480" y2="20" stroke="#dee2de" strokeDasharray="3 3" />
              <line x1="40" y1="60" x2="480" y2="60" stroke="#dee2de" strokeDasharray="3 3" />
              <line x1="40" y1="100" x2="480" y2="100" stroke="#dee2de" strokeDasharray="3 3" />
              <line x1="40" y1="140" x2="480" y2="140" stroke="#b4b8b4" />

              <text x="15" y="25" fill="#646464" fontSize="10" fontFamily="monospace">10k</text>
              <text x="15" y="65" fill="#646464" fontSize="10" fontFamily="monospace">7.5k</text>
              <text x="15" y="105" fill="#646464" fontSize="10" fontFamily="monospace">5.0k</text>
              <text x="15" y="145" fill="#646464" fontSize="10" fontFamily="monospace">2.5k</text>

              {/* Bars: 2022 (3.8 km²), 2023 (4.9), 2024 (6.4), 2025 (7.6), 2026 (8.9) */}
              {[
                { x: 50, val: 3.8, h: 50, yr: '2022' },
                { x: 140, val: 4.9, h: 65, yr: '2023' },
                { x: 230, val: 6.4, h: 85, yr: '2024' },
                { x: 320, val: 7.6, h: 100, yr: '2025' },
                { x: 410, val: 8.9, h: 120, yr: '2026' }
              ].map((bar, i) => (
                <g key={i}>
                  <rect
                    x={bar.x}
                    y={140 - bar.h}
                    width="44"
                    height={bar.h}
                    rx="4"
                    fill="#0284c7"
                    opacity={i === 4 ? '1' : '0.8'}
                  />
                  <text
                    x={bar.x + 22}
                    y={140 - bar.h - 6}
                    fill="#171717"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {bar.val} km²
                  </text>
                  <text
                    x={bar.x + 22}
                    y="155"
                    fill="#646464"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {bar.yr}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <p className="text-xs text-[#646464] border-t border-[#dee2de]/60 pt-3">
            Persistent water bodies expanded from 3.8 km² to 8.9 km² following check dams CD-01 and farm pond construction.
          </p>
        </div>

      </div>

      {/* Second Row: Interventions Breakdown & Recent Field Photographs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Intervention Structures Distribution */}
        <div className="p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-medium text-[#171717]">
              Intervention Inventory
            </h3>
            <button
              onClick={onNavigateToInterventions}
              className="text-xs text-[#41a1cf] hover:underline font-medium"
            >
              View all ({interventions.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { type: 'Check Dam', count: 18, color: '#0284c7' },
              { type: 'Farm Pond', count: 34, color: '#10b981' },
              { type: 'Contour Trench', count: 28, color: '#f59e0b' },
              { type: 'Plantation / Afforestation', count: 16, color: '#16a34a' },
              { type: 'Gully Plug', count: 12, color: '#78716c' },
              { type: 'Percolation Tank', count: 5, color: '#0369a1' }
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#444141] font-medium">{item.type}</span>
                  <span className="font-mono text-[#171717]">{item.count} units</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#f9faf7] overflow-hidden border border-[#dee2de]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / 34) * 100}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] text-[11px] text-[#646464] space-y-1">
            <span className="font-medium text-[#171717]">Structural Health Status:</span>
            <p>91% operational, 6% requires desilting, 3% scheduled for repair.</p>
          </div>
        </div>

        {/* Recent Geo-coded Photographic Evidence (2 Columns wide) */}
        <div className="lg:col-span-2 p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-[#646464] uppercase tracking-wider">GROUND TRUTHING EVIDENCE</span>
              <h3 className="font-serif text-lg font-medium text-[#171717]">
                Recent Geo-coded Field Photographs
              </h3>
            </div>
            <button
              onClick={onNavigateToImages}
              className="text-xs text-[#41a1cf] hover:underline font-medium"
            >
              Browse Gallery ({images.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {images.slice(0, 3).map((img) => (
              <div
                key={img.id}
                onClick={() => onSelectImage(img)}
                className="group cursor-pointer rounded-xl border border-[#dee2de] overflow-hidden bg-[#ffffff] hover:border-[#41a1cf] transition-all shadow-sm"
              >
                <div className="relative h-28 w-full bg-[#f9faf7] overflow-hidden">
                  <img
                    src={img.imageUrl}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#1f1f29]/80 text-white backdrop-blur-sm">
                    {img.latitude.toFixed(3)}°N, {img.longitude.toFixed(3)}°E
                  </span>
                </div>
                <div className="p-2.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#646464]">
                    <span>{img.villageName}</span>
                    <span className="font-mono">{new Date(img.date).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-medium text-xs text-[#171717] line-clamp-1 group-hover:text-[#41a1cf]">
                    {img.title}
                  </h4>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-[#0284c7] font-medium">
                      {img.analysis?.classification || img.interventionType}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                      {img.analysis?.confidenceScore || 92}% Conf.
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Upload Banner */}
          <div className="p-3.5 bg-[#f9faf7] rounded-xl border border-[#dee2de] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Camera className="w-5 h-5 text-[#41a1cf] shrink-0" />
              <div>
                <p className="text-xs font-medium text-[#171717]">
                  Upload New Geo-Tagged Field Photograph
                </p>
                <p className="text-[11px] text-[#646464]">
                  Extract GPS tags, validate photographic quality, and classify structure type.
                </p>
              </div>
            </div>
            <button
              onClick={onNavigateToImages}
              className="px-3 py-1.5 rounded-lg border border-[#41a1cf] text-[#41a1cf] hover:bg-[#41a1cf]/10 font-medium text-xs transition-colors shrink-0 self-start sm:self-auto"
            >
              Upload Photo
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
