import { ChangeDetectionResult, ChangeDetectionParcel } from '../../models/index.js';
import { sampleWatersheds } from '../../database/index.js';

export function computeChangeDetection(watershedId: string, baseYear: number, comparisonYear: number): ChangeDetectionResult {
  const watershed = sampleWatersheds.find(w => w.id === watershedId) || sampleWatersheds[0];
  const years = Object.keys(watershed.yearlyMetrics).map(Number).sort((a, b) => a - b);
  
  const baseMetrics = watershed.yearlyMetrics[baseYear] || watershed.yearlyMetrics[years[0]] || {
    vegetationCoveragePercent: 40,
    vegetationAreaKm2: 48,
    waterBodyAreaKm2: 5,
    interventionsCount: 50,
    degradedLandPercent: 30,
    averageNDVI: 0.30
  };
  
  const compMetrics = watershed.yearlyMetrics[comparisonYear] || watershed.yearlyMetrics[years[years.length - 1]] || {
    vegetationCoveragePercent: 55,
    vegetationAreaKm2: 65,
    waterBodyAreaKm2: 7,
    interventionsCount: 80,
    degradedLandPercent: 20,
    averageNDVI: 0.45
  };

  const vegDeltaPercent = +(compMetrics.vegetationCoveragePercent - baseMetrics.vegetationCoveragePercent).toFixed(1);
  const vegDeltaKm2 = +(compMetrics.vegetationAreaKm2 - baseMetrics.vegetationAreaKm2).toFixed(1);
  const waterDeltaKm2 = +(compMetrics.waterBodyAreaKm2 - baseMetrics.waterBodyAreaKm2).toFixed(1);
  const waterBodyPercentChange = baseMetrics.waterBodyAreaKm2 > 0 
    ? +(((compMetrics.waterBodyAreaKm2 - baseMetrics.waterBodyAreaKm2) / baseMetrics.waterBodyAreaKm2) * 100).toFixed(1)
    : 0;
  const degradedLandChangePercent = +(compMetrics.degradedLandPercent - baseMetrics.degradedLandPercent).toFixed(1);
  const newInterventions = Math.max(0, compMetrics.interventionsCount - baseMetrics.interventionsCount);

  // Generate dynamic change parcels based on watershed bounds
  const [cLat, cLng] = watershed.centerCoordinates;

  const dynamicParcels: ChangeDetectionParcel[] = [
    {
      id: `chg-${watershedId}-1`,
      type: vegDeltaPercent >= 0 ? 'Vegetation Increase' : 'Vegetation Loss',
      areaHectares: Math.max(10, Math.abs(Math.round(vegDeltaKm2 * 100 * 0.45))),
      confidence: 'High',
      latitude: +(cLat + 0.008).toFixed(4),
      longitude: +(cLng + 0.006).toFixed(4),
      description: `Satellite 30m NDVI indicates significant canopy biomass expansion across pediment treatment zones (${vegDeltaPercent >= 0 ? '+' : ''}${vegDeltaPercent}% net change).`,
      recommendedAction: 'Verify field establishment with geo-coded mobile camera inspection.',
      coordinates: [
        [+(cLat + 0.006).toFixed(4), +(cLng + 0.004).toFixed(4)],
        [+(cLat + 0.010).toFixed(4), +(cLng + 0.005).toFixed(4)],
        [+(cLat + 0.011).toFixed(4), +(cLng + 0.009).toFixed(4)],
        [+(cLat + 0.007).toFixed(4), +(cLng + 0.008).toFixed(4)]
      ]
    },
    {
      id: `chg-${watershedId}-2`,
      type: waterDeltaKm2 >= 0 ? 'Water Body Expansion' : 'Water Body Shrinkage',
      areaHectares: Math.max(5, Math.abs(Math.round(waterDeltaKm2 * 100 * 0.35))),
      confidence: 'High',
      latitude: +(cLat - 0.004).toFixed(4),
      longitude: +(cLng - 0.002).toFixed(4),
      description: `NDWI surface water index confirms post-monsoon storage impoundment across check dam cascades (${waterDeltaKm2 >= 0 ? '+' : ''}${waterDeltaKm2} km²).`,
      recommendedAction: 'Assess catchment silt traps before onset of the next monsoon.',
      coordinates: [
        [+(cLat - 0.006).toFixed(4), +(cLng - 0.004).toFixed(4)],
        [+(cLat - 0.002).toFixed(4), +(cLng - 0.003).toFixed(4)],
        [+(cLat - 0.003).toFixed(4), +(cLng + 0.001).toFixed(4)],
        [+(cLat - 0.007).toFixed(4), +(cLng + 0.000).toFixed(4)]
      ]
    },
    {
      id: `chg-${watershedId}-3`,
      type: 'Land Reclamation',
      areaHectares: Math.max(8, Math.abs(Math.round(degradedLandChangePercent * 100 * 0.25))),
      confidence: 'Medium',
      latitude: +(cLat + 0.003).toFixed(4),
      longitude: +(cLng - 0.007).toFixed(4),
      description: `Degraded fallows transformed to crop or silvi-pasture cover (${degradedLandChangePercent}%) under contour trenching.`,
      recommendedAction: 'Support local water user groups with micro-irrigation scheduling.',
      coordinates: [
        [+(cLat + 0.001).toFixed(4), +(cLng - 0.008).toFixed(4)],
        [+(cLat + 0.005).toFixed(4), +(cLng - 0.007).toFixed(4)],
        [+(cLat + 0.006).toFixed(4), +(cLng - 0.004).toFixed(4)],
        [+(cLat + 0.002).toFixed(4), +(cLng - 0.005).toFixed(4)]
      ]
    },
    {
      id: `chg-${watershedId}-4`,
      type: 'Erosion Vulnerability',
      areaHectares: 8.4,
      confidence: 'High',
      latitude: +(cLat - 0.001).toFixed(4),
      longitude: +(cLng + 0.005).toFixed(4),
      description: 'Siltation saturation at drainage incision; structural apron requires desilting.',
      recommendedAction: 'Prioritize desilting and vegetative barrier fortification along banks.',
      coordinates: [
        [+(cLat - 0.003).toFixed(4), +(cLng + 0.004).toFixed(4)],
        [+(cLat + 0.001).toFixed(4), +(cLng + 0.005).toFixed(4)],
        [+(cLat + 0.002).toFixed(4), +(cLng + 0.007).toFixed(4)],
        [+(cLat - 0.002).toFixed(4), +(cLng + 0.006).toFixed(4)]
      ]
    }
  ];

  return {
    watershedId,
    baseYear,
    comparisonYear,
    vegetationChangePercent: vegDeltaPercent,
    vegetationChangeKm2: vegDeltaKm2,
    waterBodyChangeKm2: waterDeltaKm2,
    waterBodyPercentChange,
    degradedLandChangePercent,
    newInterventionsCommissioned: newInterventions,
    detectedParcels: dynamicParcels,
    executiveSummary: `Spatial comparison between ${baseYear} and ${comparisonYear} reveals a ${vegDeltaPercent >= 0 ? '+' : ''}${vegDeltaPercent}% shift in vegetative cover (${vegDeltaKm2 >= 0 ? '+' : ''}${vegDeltaKm2} km²) and ${waterDeltaKm2 >= 0 ? '+' : ''}${waterDeltaKm2} km² change in open water surface area in ${watershed.name}.`,
    evidenceBasedConclusion: `Corroboration between geo-coded field evidence and 30m satellite layers demonstrates that water harvesting interventions commissioned between ${baseYear} and ${comparisonYear} have arrested surface velocity and recharged downstream shallow aquifers.`
  };
}
