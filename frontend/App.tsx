import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Sidebar, ActiveTab } from './components/Sidebar.js';
import { DashboardView } from './components/Dashboard/DashboardView.js';
import { GISMap } from './components/Map/GISMap.js';
import { GeoImageModule } from './components/Images/GeoImageModule.js';
import { InterventionModule } from './components/Interventions/InterventionModule.js';
import { SatelliteLayerModule } from './components/Satellite/SatelliteLayerModule.js';
import { ChangeDetectionView } from './components/ChangeDetection/ChangeDetectionView.js';
import { ReportGenerator } from './components/Reports/ReportGenerator.js';
import { ProblemStatementAlignment } from './components/Alignment/ProblemStatementAlignment.js';
import { ImageAnalysisPanel } from './components/Analysis/ImageAnalysisPanel.js';
import { DataSourceModal } from './components/DataSourceModal.js';
import { motion, AnimatePresence } from 'motion/react';
import { tabViewVariants } from './motion.js';

import { 
  Watershed, 
  GeoImage, 
  Intervention, 
  ChangeDetectionResult, 
  UserRole,
  ImageAnalysisResult,
  FocusTarget,
  Village
} from './types/index.js';
import { 
  fetchWatersheds, 
  fetchWatershedLayers, 
  fetchGeoImages, 
  fetchInterventions, 
  fetchChangeDetection 
} from './services/api.js';

const DEFAULT_FALLBACK_WATERSHED: Watershed = {
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
    2022: { year: 2022, vegetationCoveragePercent: 34.2, vegetationAreaKm2: 40.5, averageNDVI: 0.22, waterBodyAreaKm2: 3.8, waterStorageIndex: 42.0, interventionsCount: 38, geoImagesCount: 142, degradedLandPercent: 39.5, cropLandPercent: 26.3, annualRainfallMm: 480 },
    2023: { year: 2023, vegetationCoveragePercent: 41.5, vegetationAreaKm2: 49.2, averageNDVI: 0.28, waterBodyAreaKm2: 4.9, waterStorageIndex: 54.0, interventionsCount: 56, geoImagesCount: 210, degradedLandPercent: 33.1, cropLandPercent: 31.4, annualRainfallMm: 520 },
    2024: { year: 2024, vegetationCoveragePercent: 48.6, vegetationAreaKm2: 57.6, averageNDVI: 0.36, waterBodyAreaKm2: 6.4, waterStorageIndex: 68.5, interventionsCount: 82, geoImagesCount: 315, degradedLandPercent: 26.8, cropLandPercent: 36.2, annualRainfallMm: 590 },
    2025: { year: 2025, vegetationCoveragePercent: 55.4, vegetationAreaKm2: 65.6, averageNDVI: 0.44, waterBodyAreaKm2: 7.9, waterStorageIndex: 79.0, interventionsCount: 104, geoImagesCount: 420, degradedLandPercent: 21.2, cropLandPercent: 41.5, annualRainfallMm: 640 },
    2026: { year: 2026, vegetationCoveragePercent: 62.8, vegetationAreaKm2: 74.4, averageNDVI: 0.52, waterBodyAreaKm2: 8.9, waterStorageIndex: 88.0, interventionsCount: 119, geoImagesCount: 512, degradedLandPercent: 16.4, cropLandPercent: 46.8, annualRainfallMm: 680 }
  },
  summary: 'Kalyanpura Sub-watershed (SW-04) spans 118.5 km² across 5 Gram Panchayats in Bhilwara District, Rajasthan.'
};

export default function App() {
  const [watersheds, setWatersheds] = useState<Watershed[]>([DEFAULT_FALLBACK_WATERSHED]);
  const [selectedWatershedId, setSelectedWatershedId] = useState<string>('sw-04');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [baseYear, setBaseYear] = useState<number>(2024);
  const [compYear, setCompYear] = useState<number>(2026);
  const [userRole, setUserRole] = useState<UserRole>('GIS Analyst');
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lifted focus and selection states
  const [focusTarget, setFocusTarget] = useState<FocusTarget | null>(null);
  const [selectedInterventionId, setSelectedInterventionId] = useState<string | null>(null);

  // Data states
  const [drainageData, setDrainageData] = useState<any>(null);
  const [waterBodiesData, setWaterBodiesData] = useState<any>(null);
  const [images, setImages] = useState<GeoImage[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [changeDetection, setChangeDetection] = useState<ChangeDetectionResult | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Inspector modal states
  const [inspectingImage, setInspectingImage] = useState<GeoImage | null>(null);
  const [showDataSources, setShowDataSources] = useState<boolean>(false);

  // Load Initial Watersheds
  useEffect(() => {
    async function init() {
      try {
        const list = await fetchWatersheds();
        setWatersheds(list);
        if (list.length > 0 && !selectedWatershedId) {
          setSelectedWatershedId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch initial watersheds:', err);
      }
    }
    init();
  }, []);

  // Load Data for Selected Watershed
  useEffect(() => {
    if (!selectedWatershedId) return;

    async function loadWatershedData() {
      setIsLoading(true);
      try {
        const [layers, imageList, intList, change] = await Promise.all([
          fetchWatershedLayers(selectedWatershedId),
          fetchGeoImages({ watershedId: selectedWatershedId }),
          fetchInterventions({ watershedId: selectedWatershedId }),
          fetchChangeDetection({ watershedId: selectedWatershedId, baseYear, comparisonYear: compYear })
        ]);

        setDrainageData(layers.drainage);
        setWaterBodiesData(layers.waterBodies);
        setImages(imageList);
        setInterventions(intList);
        setChangeDetection(change);
      } catch (err) {
        console.error('Failed to load watershed data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadWatershedData();
  }, [selectedWatershedId, baseYear, compYear]);

  const activeWatershed = watersheds.find(w => w.id === selectedWatershedId) || watersheds[0] || DEFAULT_FALLBACK_WATERSHED;

  const handleUpdateImageAnalysis = (updatedAnalysis: ImageAnalysisResult) => {
    if (!inspectingImage) return;
    const updated = { ...inspectingImage, analysis: updatedAnalysis };
    setInspectingImage(updated);
    setImages(prev => prev.map(img => img.id === updated.id ? updated : img));
  };

  const handleImageUploaded = (newImage: GeoImage) => {
    setImages(prev => [newImage, ...prev]);
  };

  const handleInterventionCreated = (newInt: Intervention) => {
    setInterventions(prev => [newInt, ...prev]);
  };

  // Locate on Map handler with FocusTarget state
  const handleLocateOnMap = (target: FocusTarget | GeoImage | Intervention | Village) => {
    let ft: FocusTarget;
    if ('kind' in target) {
      ft = target;
    } else if ('imageUrl' in target) {
      ft = { kind: 'image', id: target.id, lat: target.latitude, lng: target.longitude, title: target.title };
    } else if ('contractorOrPanchayat' in target || 'type' in target) {
      ft = { kind: 'intervention', id: target.id, lat: target.latitude, lng: target.longitude, title: (target as Intervention).name };
    } else {
      const v = target as Village;
      ft = { kind: 'village', id: v.id, lat: v.latitude, lng: v.longitude, title: v.name };
    }
    setFocusTarget(ft);
    setActiveTab('map');
  };

  // Open intervention dossier and switch tab
  const handleSelectIntervention = (int: Intervention) => {
    setSelectedInterventionId(int.id);
    setActiveTab('interventions');
  };

  const handleUpdateComparison = async (base: number, comp: number) => {
    setBaseYear(base);
    setCompYear(comp);
    if (!selectedWatershedId) return;
    try {
      const res = await fetchChangeDetection({
        watershedId: selectedWatershedId,
        baseYear: base,
        comparisonYear: comp
      });
      setChangeDetection(res);
    } catch (err) {
      console.error('Error fetching updated change detection:', err);
    }
  };

  if (!activeWatershed && isLoading) {
    return (
      <div className="min-h-screen bg-[#fefffc] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-xs font-mono text-[#646464]">
          <div className="w-8 h-8 rounded-full border-2 border-[#1f1f29] border-t-transparent animate-spin" />
          <span>INITIALIZING GEOWATERSHED GIS PLATFORM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#fefffc] text-[#2c2c2c] flex flex-col font-sans overflow-hidden">
      
      {/* Top Header (Hidden when printing reports) */}
      <div className="print:hidden sticky top-0 z-40 shrink-0">
        <Header
          watersheds={watersheds}
          selectedWatershedId={selectedWatershedId}
          onSelectWatershed={(id) => setSelectedWatershedId(id)}
          selectedYear={selectedYear}
          onSelectYear={(yr) => setSelectedYear(yr)}
          userRole={userRole}
          onChangeUserRole={(role) => setUserRole(role)}
          searchQuery={searchQuery}
          onSearchChange={(q) => setSearchQuery(q)}
          onOpenGisMap={() => setActiveTab('map')}
          onOpenDataSources={() => setShowDataSources(true)}
          images={images}
          interventions={interventions}
          villages={activeWatershed?.villages || []}
          onSelectSearchResultPhoto={(img) => setInspectingImage(img)}
          onSelectSearchResultIntervention={handleSelectIntervention}
          onSelectSearchResultVillage={(v) => handleLocateOnMap({ kind: 'village', id: v.id, lat: v.latitude, lng: v.longitude, title: v.name })}
        />
      </div>

      {/* Main Body with Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Sidebar Navigation (Hidden when printing reports) */}
        <div className="print:hidden shrink-0 h-full">
          <Sidebar
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
            watershed={activeWatershed}
            imageCount={images.length}
            interventionCount={interventions.length}
          />
        </div>

        {/* Viewport Content Area with Smooth Tab Transitions */}
        <main className="flex-1 h-full overflow-y-auto min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={tabViewVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className={activeTab === 'map' ? 'w-full h-full flex flex-col flex-1' : 'min-h-full'}
              style={activeTab === 'map' ? { height: '100%', width: '100%', minHeight: 'calc(100vh - 61px)' } : undefined}
            >
              {activeTab === 'dashboard' && (
                <DashboardView
                  watershed={activeWatershed}
                  selectedYear={selectedYear}
                  images={images}
                  interventions={interventions}
                  changeDetection={changeDetection}
                  onNavigateToMap={() => setActiveTab('map')}
                  onNavigateToImages={() => setActiveTab('images')}
                  onNavigateToInterventions={() => setActiveTab('interventions')}
                  onNavigateToChange={() => setActiveTab('change')}
                  onNavigateToReports={() => setActiveTab('reports')}
                  onSelectImage={(img) => setInspectingImage(img)}
                />
              )}

              {activeTab === 'map' && (
                <GISMap
                  watershed={activeWatershed}
                  drainageData={drainageData}
                  waterBodiesData={waterBodiesData}
                  images={images}
                  interventions={interventions}
                  changeDetection={changeDetection}
                  selectedYear={selectedYear}
                  focusTarget={focusTarget}
                  onClearFocusTarget={() => setFocusTarget(null)}
                  onSelectImage={(img) => setInspectingImage(img)}
                  onSelectIntervention={handleSelectIntervention}
                  onAnalyzeImage={(img) => setInspectingImage(img)}
                />
              )}

              {activeTab === 'images' && (
                <GeoImageModule
                  watershed={activeWatershed}
                  images={images}
                  onSelectImage={(img) => setInspectingImage(img)}
                  onAnalyzeImage={(img) => setInspectingImage(img)}
                  onLocateOnMap={(img) => handleLocateOnMap(img)}
                  onImageUploaded={handleImageUploaded}
                />
              )}

              {activeTab === 'interventions' && (
                <InterventionModule
                  watershed={activeWatershed}
                  interventions={interventions}
                  images={images}
                  selectedInterventionId={selectedInterventionId}
                  onSelectIntervention={(int) => setSelectedInterventionId(int.id)}
                  onLocateOnMap={(int) => handleLocateOnMap(int)}
                  onSelectImage={(img) => setInspectingImage(img)}
                  onInterventionCreated={handleInterventionCreated}
                />
              )}

              {activeTab === 'satellite' && (
                <SatelliteLayerModule
                  onOpenGisMap={() => setActiveTab('map')}
                />
              )}

              {activeTab === 'change' && (
                <ChangeDetectionView
                  watershed={activeWatershed}
                  changeResult={changeDetection}
                  selectedYear={selectedYear}
                  baseYear={baseYear}
                  compYear={compYear}
                  onSelectYear={(yr) => setSelectedYear(yr)}
                  onOpenGisMap={() => setActiveTab('map')}
                  onUpdateComparison={handleUpdateComparison}
                />
              )}

              {activeTab === 'reports' && (
                <ReportGenerator
                  watershed={activeWatershed}
                  interventions={interventions}
                  images={images}
                  changeDetection={changeDetection}
                  selectedYear={selectedYear}
                  baseYear={baseYear}
                  compYear={compYear}
                />
              )}

              {activeTab === 'alignment' && (
                <ProblemStatementAlignment />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Global AI Image Analysis Modal */}
      <AnimatePresence>
        {inspectingImage && (
          <ImageAnalysisPanel
            image={inspectingImage}
            onClose={() => setInspectingImage(null)}
            onUpdateImageAnalysis={handleUpdateImageAnalysis}
            onLocateOnMap={(img) => {
              handleLocateOnMap(img);
              setInspectingImage(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Official Data Sources & Acquisition Guide Modal */}
      <AnimatePresence>
        {showDataSources && (
          <DataSourceModal
            onClose={() => setShowDataSources(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
