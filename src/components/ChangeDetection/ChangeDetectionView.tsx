import React, { useState, useRef, useMemo } from 'react';
import { 
  GitCompare, 
  Calendar, 
  ArrowRight, 
  TrendingUp, 
  Droplets, 
  TreePine, 
  AlertTriangle, 
  Layers, 
  CheckCircle2, 
  MapPin,
  Sparkles,
  Sliders
} from 'lucide-react';
import { Watershed, ChangeDetectionResult } from '../../types/index.js';

interface ChangeDetectionViewProps {
  watershed: Watershed;
  changeResult?: ChangeDetectionResult;
  selectedYear: number;
  baseYear?: number;
  compYear?: number;
  onSelectYear: (year: number) => void;
  onOpenGisMap: () => void;
  onUpdateComparison: (baseYear: number, compYear: number) => void;
}

// Deterministic cell noise generator
function getCellNdvi(col: number, row: number, year: number, watershedId: string): number {
  const hash = Math.sin(col * 12.9898 + row * 78.233 + year * 37.719 + watershedId.charCodeAt(0) * 11) * 43758.5453;
  const rand = hash - Math.floor(hash);
  // Base progress: later years are greener
  const progress = (year - 2022) / 4;
  return Math.min(0.85, Math.max(0.08, 0.18 + rand * 0.45 + progress * 0.22));
}

function getNdviColor(val: number): string {
  if (val > 0.60) return '#15803d'; // Dense Canopy
  if (val > 0.45) return '#16a34a'; // Moderate Crop
  if (val > 0.32) return '#65a30d'; // Light Vegetation
  if (val > 0.20) return '#ca8a04'; // Scrub/Fallow
  if (val > 0.12) return '#d97706'; // Exposed Soil
  return '#0284c7'; // Water
}

export const ChangeDetectionView: React.FC<ChangeDetectionViewProps> = ({
  watershed,
  changeResult,
  selectedYear,
  baseYear = 2024,
  compYear = 2026,
  onSelectYear,
  onOpenGisMap,
  onUpdateComparison
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const availableYears = [2022, 2023, 2024, 2025, 2026];

  const handleBaseChange = (year: number) => {
    onUpdateComparison(year, compYear);
  };

  const handleCompChange = (year: number) => {
    onUpdateComparison(baseYear, year);
  };

  const baseMetrics = watershed.yearlyMetrics[baseYear] || watershed.yearlyMetrics[2024];
  const compMetrics = watershed.yearlyMetrics[compYear] || watershed.yearlyMetrics[2026];

  // Dynamic calculations from actual selected yearly metrics
  const vegChange = +(compMetrics.vegetationCoveragePercent - baseMetrics.vegetationCoveragePercent).toFixed(1);
  const vegKm2 = +(compMetrics.vegetationAreaKm2 - baseMetrics.vegetationAreaKm2).toFixed(1);
  const waterKm2 = +(compMetrics.waterBodyAreaKm2 - baseMetrics.waterBodyAreaKm2).toFixed(1);
  const waterPercent = baseMetrics.waterBodyAreaKm2 > 0 
    ? +(((compMetrics.waterBodyAreaKm2 - baseMetrics.waterBodyAreaKm2) / baseMetrics.waterBodyAreaKm2) * 100).toFixed(1)
    : 0;
  const degradedChange = +(compMetrics.degradedLandPercent - baseMetrics.degradedLandPercent).toFixed(1);
  const intCount = Math.max(0, compMetrics.interventionsCount - baseMetrics.interventionsCount);

  // Generate 24x12 NDVI grid cells for spatial comparison
  const cols = 24;
  const rows = 12;

  const baseGrid = useMemo(() => {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Stream runs through middle
        const isWater = (r === 6 && c >= 8 && c <= 16) || (r === 7 && c >= 14 && c <= 18);
        const val = isWater ? 0.05 : getCellNdvi(c, r, baseYear, watershed.id);
        cells.push({ col: c, row: r, val, color: getNdviColor(val) });
      }
    }
    return cells;
  }, [baseYear, watershed.id]);

  const compGrid = useMemo(() => {
    const cells = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Expanded water spread around structures in monitoring year
        const isWater = (r >= 5 && r <= 7 && c >= 7 && c <= 18);
        const val = isWater ? 0.05 : getCellNdvi(c, r, compYear, watershed.id);
        cells.push({ col: c, row: r, val, color: getNdviColor(val) });
      }
    }
    return cells;
  }, [compYear, watershed.id]);

  // Pointer drag events for swipe slider
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateSliderFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const updateSliderFromClientX = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, pos)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderPosition(prev => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderPosition(prev => Math.min(100, prev + 5));
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#646464]">
            <GitCompare className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span>MULTI-TEMPORAL CHANGE DETECTION MODULE</span>
          </div>
          <h2 className="mt-1 font-serif text-2xl font-normal text-[#171717]">
            Geospatial Change Detection ({baseYear} vs {compYear})
          </h2>
          <p className="mt-1 text-xs text-[#646464]">
            Pixel-level 30m difference analysis quantifying vegetative canopy expansion, surface water persistence, and intervention footprint.
          </p>
        </div>

        <button
          onClick={onOpenGisMap}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors shadow-sm self-start md:self-auto"
        >
          <Layers className="w-4 h-4 text-[#41a1cf]" />
          <span>View Change Overlay on Map</span>
        </button>
      </div>

      {/* Interactive Timeline & Comparison Selector */}
      <div className="p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[#dee2de]">
          <div>
            <h3 className="font-serif text-base font-normal text-[#171717]">
              Multi-Year Timeline & Audit Horizon
            </h3>
            <p className="text-xs text-[#646464]">
              Select baseline reference year and post-treatment monitoring year.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[#646464] font-medium">Before (Baseline):</span>
              <select
                aria-label="Select Baseline Year"
                value={baseYear}
                onChange={(e) => handleBaseChange(parseInt(e.target.value, 10))}
                className="px-2.5 py-1 bg-[#f9faf7] border border-[#dee2de] rounded-lg font-medium text-[#171717] focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y} disabled={y >= compYear}>{y}</option>
                ))}
              </select>
            </div>

            <ArrowRight className="w-4 h-4 text-[#646464]" />

            <div className="flex items-center gap-1.5">
              <span className="text-[#646464] font-medium">After (Monitoring):</span>
              <select
                aria-label="Select Monitoring Year"
                value={compYear}
                onChange={(e) => handleCompChange(parseInt(e.target.value, 10))}
                className="px-2.5 py-1 bg-[#f9faf7] border border-[#dee2de] rounded-lg font-medium text-[#171717] focus:outline-none cursor-pointer"
              >
                {availableYears.map(y => (
                  <option key={y} value={y} disabled={y <= baseYear}>{y}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Timeline Slider Track */}
        <div className="pt-3 pb-1">
          <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4">
            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-[#dee2de] z-0" />
            
            {availableYears.map((yr) => {
              const isBase = yr === baseYear;
              const isComp = yr === compYear;
              const isInRange = yr >= baseYear && yr <= compYear;

              return (
                <div key={yr} className="relative z-10 flex flex-col items-center gap-1.5">
                  <button
                    onClick={() => {
                      if (yr < compYear) handleBaseChange(yr);
                      else handleCompChange(yr);
                    }}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium transition-all ${
                      isBase
                        ? 'bg-[#282834] text-white ring-4 ring-[#282834]/15'
                        : isComp
                        ? 'bg-[#41a1cf] text-white ring-4 ring-[#41a1cf]/20'
                        : isInRange
                        ? 'bg-[#15803d] text-white'
                        : 'bg-[#ffffff] text-[#646464] border-2 border-[#dee2de] hover:border-[#b4b8b4]'
                    }`}
                  >
                    {yr.toString().slice(2)}
                  </button>
                  <span className={`text-[11px] font-mono ${isBase || isComp ? 'font-bold text-[#171717]' : 'text-[#646464]'}`}>
                    {yr}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Demo-Derived Change Statistics Banner */}
      <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
              Demo-derived change statistics
            </span>
            <span className="font-semibold text-amber-950">Workflow Demonstration Mode</span>
          </div>
          <p className="text-[#444141] text-[11px] leading-relaxed">
            These results are generated from demonstration datasets and are intended to demonstrate the analytical workflow.
          </p>
        </div>
        <span className="text-[11px] font-mono text-amber-900 font-medium shrink-0">
          Source: DemoSatelliteProvider (30m Grid)
        </span>
      </div>

      {/* Quantified Shift Cards Grid (Computed dynamically from selected years) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Vegetation Delta */}
        <div className="p-4 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-mono uppercase">
              Vegetation: {vegChange >= 0 ? `+${vegChange}%` : `${vegChange}%`}
            </span>
            <TreePine className="w-4 h-4 text-[#16a34a]" />
          </div>
          <p className="mt-2 text-2xl font-mono font-medium text-[#171717]">
            {vegChange >= 0 ? `+${vegChange}%` : `${vegChange}%`}
          </p>
          <p className="mt-1 text-[11px] text-[#16a34a] font-medium">
            Demo vegetation indicator ({baseYear}: {baseMetrics.averageNDVI.toFixed(2)} → {compYear}: {compMetrics.averageNDVI.toFixed(2)})
          </p>
        </div>

        {/* Water Spread Delta */}
        <div className="p-4 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-mono uppercase">
              Water-body area: {waterPercent >= 0 ? `+${waterPercent}%` : `${waterPercent}%`}
            </span>
            <Droplets className="w-4 h-4 text-[#0ea5e9]" />
          </div>
          <p className="mt-2 text-2xl font-mono font-medium text-[#171717]">
            {waterKm2 >= 0 ? `+${waterKm2}` : waterKm2} <span className="text-xs font-normal">km²</span>
          </p>
          <p className="mt-1 text-[11px] text-[#0ea5e9] font-medium">
            From {baseMetrics.waterBodyAreaKm2} to {compMetrics.waterBodyAreaKm2} km² ({waterPercent >= 0 ? `+${waterPercent}%` : `${waterPercent}%`} change)
          </p>
        </div>

        {/* Interventions Installed */}
        <div className="p-4 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-mono uppercase">Interventions Added</span>
            <Layers className="w-4 h-4 text-[#41a1cf]" />
          </div>
          <p className="mt-2 text-2xl font-mono font-medium text-[#171717]">
            +{intCount} <span className="text-xs font-normal">units</span>
          </p>
          <p className="mt-1 text-[11px] text-[#41a1cf] font-medium">
            New structures commissioned ({baseMetrics.interventionsCount} → {compMetrics.interventionsCount})
          </p>
        </div>

        {/* Degraded Land Change */}
        <div className="p-4 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <div className="flex items-center justify-between text-[#646464]">
            <span className="text-[11px] font-mono uppercase">
              Barren/degraded area: {degradedChange >= 0 ? `+${degradedChange}%` : `${degradedChange}%`}
            </span>
            <TrendingUp className="w-4 h-4 text-[#d97706]" />
          </div>
          <p className="mt-2 text-2xl font-mono font-medium text-[#171717]">
            {degradedChange >= 0 ? `+${degradedChange}%` : `${degradedChange}%`}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium">
            From {baseMetrics.degradedLandPercent}% to {compMetrics.degradedLandPercent}% reclaimed
          </p>
        </div>

      </div>

      {/* Interactive Before/After Split View Simulator with 30m NDVI Spatial Grids */}
      <div className="p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#171717]">
              Spatial Difference Visualization (30m NDVI Pixel Swipe)
            </h3>
            <p className="text-xs text-[#646464]">
              Drag divider handle or use Left/Right arrows to reveal post-treatment spatial canopy & water changes.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-stone-100 text-[#171717]">{baseYear} Baseline</span>
            <span className="text-[#41a1cf]">⟷</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">{compYear} Monitoring</span>
          </div>
        </div>

        {/* Interactive Split Swipe Window */}
        <div 
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative h-72 md:h-84 w-full rounded-xl overflow-hidden border border-[#dee2de] bg-[#0c120c] select-none cursor-ew-resize touch-none"
        >
          {/* Base Layer: Baseline 30m NDVI Grid (baseYear) */}
          <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-3 pointer-events-none">
            {/* Visual 30m Raster Grid for baseYear */}
            <div className="absolute inset-0 grid grid-cols-24 grid-rows-12 gap-[1px] p-2 bg-stone-900">
              {baseGrid.map((c, i) => (
                <div
                  key={i}
                  style={{ backgroundColor: c.color }}
                  className="w-full h-full opacity-75 hover:opacity-100 transition-opacity"
                  title={`30m Cell [${c.col},${c.row}] NDVI: ${c.val.toFixed(2)}`}
                />
              ))}
            </div>

            {/* Baseline Overlay Badge (Left) */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="px-2.5 py-1 rounded bg-[#171717]/90 backdrop-blur-md text-white text-xs font-mono border border-stone-700 shadow-md">
                {baseYear} Baseline • NDVI {baseMetrics.averageNDVI} • Water {baseMetrics.waterBodyAreaKm2} km²
              </span>
            </div>

            <div className="relative z-10 flex items-end justify-between">
              <span className="text-[10px] font-mono text-stone-300 bg-[#171717]/80 px-2 py-0.5 rounded">
                Pre-treatment: Sparse scrub & barren drainage pediment
              </span>
            </div>
          </div>

          {/* Reveal Layer: Monitoring 30m NDVI Grid (compYear) with clip-path */}
          <div
            className="absolute inset-0 w-full h-full flex flex-col justify-between p-3 pointer-events-none"
            style={{
              clipPath: `inset(0 0 0 ${sliderPosition}%)`
            }}
          >
            {/* Visual 30m Raster Grid for compYear */}
            <div className="absolute inset-0 grid grid-cols-24 grid-rows-12 gap-[1px] p-2 bg-stone-900">
              {compGrid.map((c, i) => (
                <div
                  key={i}
                  style={{ backgroundColor: c.color }}
                  className="w-full h-full opacity-90 hover:opacity-100 transition-opacity"
                  title={`30m Cell [${c.col},${c.row}] NDVI: ${c.val.toFixed(2)}`}
                />
              ))}
            </div>

            {/* Monitoring Overlay Badge (Right) */}
            <div className="relative z-10 flex items-center justify-end">
              <span className="px-2.5 py-1 rounded bg-[#15803d]/95 backdrop-blur-md text-white text-xs font-mono border border-emerald-400 shadow-md">
                {compYear} Post-Treatment • NDVI {compMetrics.averageNDVI} • Water {compMetrics.waterBodyAreaKm2} km²
              </span>
            </div>

            <div className="relative z-10 flex items-end justify-end">
              <span className="text-[10px] font-mono text-emerald-100 bg-[#15803d]/80 px-2 py-0.5 rounded">
                Post-treatment: Canopy closure & impounded storage
              </span>
            </div>
          </div>

          {/* Draggable Divider Handle with Keyboard Accessibility */}
          <div
            role="slider"
            tabIndex={0}
            aria-valuenow={sliderPosition}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Swipe comparison slider"
            onKeyDown={handleKeyDown}
            className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#41a1cf] z-20"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-[#171717] border-2 border-white text-white flex items-center justify-center text-[10px] font-bold shadow-xl">
              ⟷
            </div>
          </div>
        </div>

        {/* Legend with Dynamic Values */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#15803d]"></span>
              <span className="text-[#2c2c2c] font-medium">
                Vegetation Canopy Shift ({vegChange >= 0 ? `+${vegChange}%` : `${vegChange}%`})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#0284c7]"></span>
              <span className="text-[#2c2c2c] font-medium">
                Surface Water Impoundment ({waterKm2 >= 0 ? `+${waterKm2}` : waterKm2} km²)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#ca8a04]"></span>
              <span className="text-[#2c2c2c] font-medium">
                Degraded Fallow Proportion ({degradedChange >= 0 ? `+${degradedChange}%` : `${degradedChange}%`})
              </span>
            </div>
          </div>

          <span className="text-[11px] text-[#646464] font-mono">
            Position: {sliderPosition.toFixed(0)}% (Drag or Arrow keys)
          </span>
        </div>
      </div>

      {/* Priority Change Parcels Table */}
      <div className="p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#171717]">
              Detected Change Parcels & Field Recommendations
            </h3>
            <p className="text-xs text-[#646464]">
              Algorithmic delineation of change polygons requiring administrative attention.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#dee2de] bg-[#f9faf7] text-[#646464] font-mono text-[11px]">
                <th className="py-2.5 px-3">Parcel Type</th>
                <th className="py-2.5 px-3">Extracted Area</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3">Observation & Location</th>
                <th className="py-2.5 px-3">Recommended Field Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2de] text-[#171717]">
              {(changeResult?.detectedParcels || []).map((parcel) => {
                const isVeg = parcel.type.includes('Vegetation');
                const isWater = parcel.type.includes('Water');
                const isSilt = parcel.type.includes('Siltation');

                return (
                  <tr key={parcel.id} className="hover:bg-[#f9faf7]/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          isVeg ? 'bg-emerald-600' : isWater ? 'bg-sky-600' : 'bg-amber-600'
                        }`} />
                        <span className="font-medium">{parcel.type}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-medium">
                      {parcel.areaHectares} ha
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#f9faf7] text-[#2c2c2c] border border-[#dee2de]">
                        {parcel.confidence}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#444141] max-w-xs">
                      {parcel.description}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium inline-block ${
                        isSilt 
                          ? 'bg-amber-50 text-amber-900 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      }`}>
                        {parcel.recommendedAction}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
