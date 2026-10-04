import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Sparkles, 
  Download, 
  CheckCircle2, 
  Calendar, 
  Compass, 
  ShieldCheck, 
  RotateCw, 
  Layers, 
  Camera,
  AlertCircle,
  Info
} from 'lucide-react';
import { 
  Watershed, 
  Intervention, 
  GeoImage, 
  ChangeDetectionResult 
} from '../../types/index.js';
import { fetchAiWatershedSummary } from '../../services/api.js';

interface ReportGeneratorProps {
  watershed: Watershed;
  interventions: Intervention[];
  images: GeoImage[];
  changeDetection?: ChangeDetectionResult;
  selectedYear: number;
  baseYear?: number;
  compYear?: number;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  watershed,
  interventions,
  images,
  changeDetection,
  selectedYear,
  baseYear = 2024,
  compYear = 2026
}) => {
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiResult, setAiResult] = useState<{ summaryText: string; source: 'gemini' | 'fallback'; model?: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateAiSummary = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    try {
      const res = await fetchAiWatershedSummary(watershed.id, baseYear, compYear);
      setAiResult({
        summaryText: res.summaryText,
        source: res.source as 'gemini' | 'fallback',
        model: res.model
      });
    } catch (err: any) {
      setAiError(err.message || 'Failed to synthesize AI summary. Please check backend connection.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const baseMetrics = watershed.yearlyMetrics[baseYear] || watershed.yearlyMetrics[2024];
  const compMetrics = watershed.yearlyMetrics[compYear] || watershed.yearlyMetrics[2026];

  const vegDiff = +(compMetrics.vegetationCoveragePercent - baseMetrics.vegetationCoveragePercent).toFixed(1);
  const ndviDiff = +(compMetrics.averageNDVI - baseMetrics.averageNDVI).toFixed(2);
  const waterDiff = +(compMetrics.waterBodyAreaKm2 - baseMetrics.waterBodyAreaKm2).toFixed(1);
  const degradedDiff = +(baseMetrics.degradedLandPercent - compMetrics.degradedLandPercent).toFixed(1);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#646464]">
            <FileText className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span>REPORT GENERATION ENGINE</span>
          </div>
          <h2 className="font-serif text-xl font-normal text-[#171717] mt-0.5">
            Watershed Monitoring Assessment Report
          </h2>
          <p className="text-xs text-[#646464]">
            Evidence-based synthesis combining geo-coded ground photos and 30m satellite datasets (As of Year {selectedYear}).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleGenerateAiSummary}
            disabled={isGeneratingAi}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#41a1cf] text-[#41a1cf] hover:bg-[#41a1cf]/10 font-medium text-xs transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
            <span>{isGeneratingAi ? 'Synthesizing with Gemini...' : 'Generate AI Synthesis'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Inline Error Notice if AI fails */}
      {aiError && (
        <div className="print:hidden p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{aiError}</span>
        </div>
      )}

      {/* Actual Printable Report Sheet */}
      <div className="bg-[#ffffff] border border-[#dee2de] rounded-2xl p-6 md:p-10 space-y-8 shadow-md print:shadow-none print:border-none print:p-0 print:m-0">
        
        {/* Report Official Header */}
        <div className="border-b-2 border-[#171717] pb-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#646464]">
            <span>DEPARTMENT OF LAND RESOURCES • WATERSHED DEVELOPMENT</span>
            <span>SRISHTI-DRISHTI COMPATIBLE</span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-normal text-[#171717]">
                Watershed Monitoring & Evidence Assessment Report
              </h1>
              <p className="text-sm font-medium text-[#444141] mt-1">
                {watershed.name} — Comprehensive Impact Evaluation ({baseYear} – {compYear}) [As of {selectedYear}]
              </p>
            </div>
            <div className="text-right text-xs font-mono text-[#646464]">
              <p>DOC ID: <span className="font-bold text-[#171717]">{watershed.code}-AUDIT</span></p>
              <p>DATE: {new Date().toLocaleDateString()}</p>
              <p className="font-semibold text-amber-800">STATUS: DRAFT — DEMO DATA</p>
            </div>
          </div>

          {/* Data Sources & Transparency Notice (Requirement 16) */}
          <div className="mt-3 p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] text-xs space-y-1">
            <span className="font-mono font-bold text-[10px] text-[#646464] uppercase block">
              Data Sources:
            </span>
            <ul className="list-disc pl-5 text-[11px] text-[#2c2c2c] space-y-0.5 font-medium">
              <li>User-uploaded geo-coded field photographs ({images.length} verified ground points)</li>
              <li>Demo watershed geospatial dataset (Baseline: {baseYear}, Monitoring: {compYear})</li>
            </ul>
            <p className="text-[11px] text-amber-800 italic pt-1 border-t border-[#dee2de]/60">
              "Satellite/geospatial indicators shown in this prototype are demonstration data and do not represent official SRISHTI-DRISHTI observations."
            </p>
          </div>
        </div>

        {/* Section 1: Watershed Location & Administrative Context */}
        <div className="space-y-3">
          <h2 className="font-serif text-base font-semibold text-[#171717] uppercase tracking-wider text-xs border-b border-[#dee2de] pb-1">
            1. Watershed Details & Catchment Delineation
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-[#f9faf7] p-4 rounded-xl border border-[#dee2de]">
            <div>
              <span className="text-[#646464]">Catchment Code:</span>
              <p className="font-mono font-medium text-[#171717]">{watershed.code}</p>
            </div>
            <div>
              <span className="text-[#646464]">District & State:</span>
              <p className="font-medium text-[#171717]">{watershed.district}, {watershed.state}</p>
            </div>
            <div>
              <span className="text-[#646464]">Total Area:</span>
              <p className="font-mono font-medium text-[#171717]">{watershed.totalAreaKm2} km²</p>
            </div>
            <div>
              <span className="text-[#646464]">Gram Panchayats:</span>
              <p className="font-medium text-[#171717]">{watershed.villages.length} Villages</p>
            </div>
          </div>
          <p className="text-xs text-[#444141] leading-relaxed">
            {watershed.summary}
          </p>
        </div>

        {/* Section 2: AI / Hydrological Executive Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#dee2de] pb-1">
            <h2 className="font-serif text-base font-semibold text-[#171717] uppercase tracking-wider text-xs">
              2. Scientific Synthesis & Evidence Interpretation
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] font-mono">
              {aiResult ? (
                aiResult.source === 'gemini' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Gemini Vision & LLM Synthesis
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                    Rule-Based Synthesis (Dynamic Fallback)
                  </span>
                )
              ) : (
                <span className="text-[#646464]">Baseline Analysis Framework</span>
              )}
            </div>
          </div>

          <div className="p-4 bg-[#f9faf7] rounded-xl border border-[#dee2de] text-xs text-[#2c2c2c] whitespace-pre-line leading-relaxed font-sans">
            {aiResult?.summaryText || `EXECUTIVE WATERSHED MONITORING ASSESSMENT
Watershed: ${watershed.name} (${watershed.district}, ${watershed.state})
Evaluation Horizon: ${baseYear} – ${compYear}
Catchment Delineation Area: ${watershed.totalAreaKm2} km²

1. EXECUTIVE ASSESSMENT:
Between ${baseYear} and ${compYear}, ${watershed.name} exhibited a verified positive hydrological response. Satellite 30m NDVI indicates a net vegetation canopy shift of ${vegDiff >= 0 ? '+' : ''}${vegDiff}%, while NDWI analysis confirms a net change of ${waterDiff >= 0 ? '+' : ''}${waterDiff} km² in persistent surface water spread. A cumulative total of ${interventions.length} conservation structures are cataloged across the catchment.

2. OBSERVED EVIDENCE:
- Interventions Monitored: ${interventions.filter(i => i.status === 'Operational').length} operational structures with aggregate designed storage capacity of ${interventions.reduce((s, i) => s + (i.storageCapacityM3 || 0), 0).toLocaleString()} m³.
- Field Photo Corroboration: ${images.length} geo-coded field inspection photographs confirm water impoundment and vegetative stabilization along treated stream channels.
- Priority Change Parcels: ${(changeDetection?.detectedParcels || []).length} zones verified via multi-temporal satellite differencing.

3. INFERRED HYDROLOGICAL IMPACT:
- Ground evidence indicates enhanced localized infiltration and elevated post-monsoon soil moisture retention across middle and lower catchment pediments.
- Extended water storage availability reported for livestock and supplementary agricultural irrigation.

4. CONFIDENCE LEVEL:
HIGH (Multi-source corroboration between 30m satellite indices, registered interventions, and geo-coded ground photographic evidence).`}
          </div>
        </div>

        {/* Section 3: Satellite Indicators Comparison Table */}
        <div className="space-y-3">
          <h2 className="font-serif text-base font-semibold text-[#171717] uppercase tracking-wider text-xs border-b border-[#dee2de] pb-1">
            3. Multi-temporal 30m Satellite Indicators ({baseYear} vs {compYear})
          </h2>

          <table className="w-full text-left text-xs border-collapse border border-[#dee2de]">
            <thead>
              <tr className="bg-[#f9faf7] border-b border-[#dee2de] text-[#646464] font-mono text-[11px]">
                <th className="p-2.5">Indicator Parameter</th>
                <th className="p-2.5">Sensor Resolution</th>
                <th className="p-2.5">Baseline ({baseYear})</th>
                <th className="p-2.5">Monitoring ({compYear})</th>
                <th className="p-2.5">Net Spatial Shift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dee2de] text-[#171717]">
              <tr>
                <td className="p-2.5 font-medium">Vegetation Coverage (% of Catchment)</td>
                <td className="p-2.5 font-mono text-[#646464]">AWiFS 30m</td>
                <td className="p-2.5 font-mono">{baseMetrics.vegetationCoveragePercent}%</td>
                <td className="p-2.5 font-mono">{compMetrics.vegetationCoveragePercent}%</td>
                <td className="p-2.5 font-mono font-semibold text-[#15803d]">
                  {vegDiff >= 0 ? `+${vegDiff}%` : `${vegDiff}%`}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Mean NDVI Canopy Index</td>
                <td className="p-2.5 font-mono text-[#646464]">LISS-III 30m</td>
                <td className="p-2.5 font-mono">{baseMetrics.averageNDVI.toFixed(2)}</td>
                <td className="p-2.5 font-mono">{compMetrics.averageNDVI.toFixed(2)}</td>
                <td className="p-2.5 font-mono font-semibold text-[#15803d]">
                  {ndviDiff >= 0 ? `+${ndviDiff}` : ndviDiff}
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Persistent Water Body Area</td>
                <td className="p-2.5 font-mono text-[#646464]">NDWI 30m</td>
                <td className="p-2.5 font-mono">{baseMetrics.waterBodyAreaKm2} km²</td>
                <td className="p-2.5 font-mono">{compMetrics.waterBodyAreaKm2} km²</td>
                <td className="p-2.5 font-mono font-semibold text-[#0284c7]">
                  {waterDiff >= 0 ? `+${waterDiff}` : waterDiff} km²
                </td>
              </tr>
              <tr>
                <td className="p-2.5 font-medium">Degraded Land / Fallow Proportion</td>
                <td className="p-2.5 font-mono text-[#646464]">LULC 30m</td>
                <td className="p-2.5 font-mono">{baseMetrics.degradedLandPercent}%</td>
                <td className="p-2.5 font-mono">{compMetrics.degradedLandPercent}%</td>
                <td className="p-2.5 font-mono font-semibold text-[#15803d]">
                  -{degradedDiff}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 4: Physical Structures Verification */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#dee2de] pb-1">
            <h2 className="font-serif text-base font-semibold text-[#171717] uppercase tracking-wider text-xs">
              4. Ground Interventions Verified with Geo-Coded Photographs
            </h2>
            <span className="text-[11px] font-mono text-[#646464]">
              {interventions.length} Total Structures Logged
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interventions.slice(0, 4).map((intv) => {
              const linkedPhotos = images.filter(img => intv.linkedImageIds.includes(img.id));
              const samplePhoto = linkedPhotos[0] || images.find(img => img.interventionType === intv.type);

              return (
                <div key={intv.id} className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] flex gap-3 text-xs">
                  {samplePhoto && (
                    <div className="w-24 h-20 rounded-lg overflow-hidden border border-[#dee2de] shrink-0 bg-white">
                      <img src={samplePhoto.imageUrl} alt={intv.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#171717] truncate">{intv.name}</span>
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {intv.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#646464]">{intv.type} • {intv.villageName}</p>
                    <p className="font-mono text-[10px] text-[#646464]">
                      {intv.latitude.toFixed(4)}°N, {intv.longitude.toFixed(4)}°E (Installed: {intv.installationYear})
                    </p>
                    {intv.storageCapacityM3 && (
                      <p className="text-[10px] text-[#0284c7] font-medium">
                        Capacity: {intv.storageCapacityM3.toLocaleString()} m³
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Official Sign-Off & Verification Stamp */}
        <div className="pt-6 border-t-2 border-[#171717] grid grid-cols-3 gap-6 text-xs text-center font-mono">
          <div className="space-y-6">
            <span className="text-[#646464]">Field Inspection Officer</span>
            <div className="border-b border-[#dee2de] pb-2 font-serif text-[#171717] italic">
              Verified via Geo-Photos
            </div>
            <span className="text-[10px] text-[#646464]">GPS Ground Verification</span>
          </div>

          <div className="space-y-6">
            <span className="text-[#646464]">GIS / Remote Sensing Analyst</span>
            <div className="border-b border-[#dee2de] pb-2 font-serif text-[#171717] italic">
              Validated 30m Orthorectified
            </div>
            <span className="text-[10px] text-[#646464]">AWiFS / LISS-III Layer Differencing</span>
          </div>

          <div className="space-y-6">
            <span className="text-[#646464]">Project Director (WDC-PMKSY)</span>
            <div className="border-b border-[#dee2de] pb-2 font-serif text-[#171717] italic">
              Draft Demonstration Approval
            </div>
            <span className="text-[10px] text-amber-800 font-bold">DEMO DATASET ENVIRONMENT</span>
          </div>
        </div>

      </div>
    </div>
  );
};
