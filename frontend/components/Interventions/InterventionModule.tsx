import React, { useState } from 'react';
import { 
  Layers, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Camera, 
  History, 
  Droplet,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { modalBackdropVariants, modalPanelVariants } from '../../motion.js';
import { 
  Intervention, 
  Watershed, 
  InterventionType, 
  InterventionStatus, 
  GeoImage 
} from '../../types/index.js';
import { createIntervention } from '../../services/api.js';

interface InterventionModuleProps {
  watershed: Watershed;
  interventions: Intervention[];
  images: GeoImage[];
  selectedInterventionId?: string | null;
  onSelectIntervention: (int: Intervention) => void;
  onLocateOnMap: (int: Intervention) => void;
  onSelectImage: (img: GeoImage) => void;
  onInterventionCreated: (newInt: Intervention) => void;
}

export const InterventionModule: React.FC<InterventionModuleProps> = ({
  watershed,
  interventions,
  images,
  selectedInterventionId,
  onSelectIntervention,
  onLocateOnMap,
  onSelectImage,
  onInterventionCreated
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDetailInt, setSelectedDetailInt] = useState<Intervention | null>(
    (selectedInterventionId && interventions.find(i => i.id === selectedInterventionId)) || interventions[0] || null
  );

  React.useEffect(() => {
    if (selectedInterventionId) {
      const found = interventions.find(i => i.id === selectedInterventionId);
      if (found) setSelectedDetailInt(found);
    }
  }, [selectedInterventionId, interventions]);

  // New intervention form
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<InterventionType>('Check Dam');
  const [newVillageId, setNewVillageId] = useState(watershed.villages[0]?.id || 'v-01');
  const [newLat, setNewLat] = useState(watershed.centerCoordinates[0].toString());
  const [newLng, setNewLng] = useState(watershed.centerCoordinates[1].toString());
  const [newYear, setNewYear] = useState('2025');
  const [newCapacity, setNewCapacity] = useState('12000');
  const [newCatchment, setNewCatchment] = useState('150');
  const [newAgency, setNewAgency] = useState('Gram Panchayat / WDC-PMKSY');
  const [newObs, setNewObs] = useState('Commissioned structure functioning at design storage capacity.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredInterventions = interventions.filter(i => {
    if (selectedType !== 'ALL' && i.type !== selectedType) return false;
    if (selectedStatus !== 'ALL' && i.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        i.name.toLowerCase().includes(q) ||
        i.villageName.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        i.contractorOrPanchayat.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const villageObj = watershed.villages.find(v => v.id === newVillageId);
      const created = await createIntervention({
        watershedId: watershed.id,
        name: newName,
        type: newType,
        villageId: newVillageId,
        villageName: villageObj?.name || 'Kalyanpura',
        latitude: parseFloat(newLat),
        longitude: parseFloat(newLng),
        installationYear: parseInt(newYear, 10),
        storageCapacityM3: newCapacity ? parseFloat(newCapacity) : undefined,
        catchmentAreaHa: newCatchment ? parseFloat(newCatchment) : undefined,
        contractorOrPanchayat: newAgency,
        status: 'Operational',
        observations: newObs
      });

      onInterventionCreated(created);
      setSelectedDetailInt(created);
      setShowAddModal(false);
      setNewName('');
    } catch (err: any) {
      alert(err.message || 'Failed to create intervention');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalStorageCapacity = interventions.reduce((acc, i) => acc + (i.storageCapacityM3 || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Module Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#646464]">
            <Layers className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span>WATERSHED INTERVENTIONS INVENTORY & AUDIT</span>
          </div>
          <h2 className="mt-1 font-serif text-2xl font-normal text-[#171717]">
            Soil & Water Conservation Works
          </h2>
          <p className="mt-1 text-xs text-[#646464]">
            Tracking ridge-to-valley treatments: check dams, farm ponds, continuous contour trenches (CCT), loose stone structures, and silvi-pasture plantations.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-[#41a1cf]" />
          <span>Register New Intervention</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <span className="text-[11px] font-mono text-[#646464] uppercase">Total Structures</span>
          <p className="mt-1 text-xl font-mono font-medium text-[#171717]">{interventions.length} units</p>
          <p className="text-[10px] text-[#646464]">Across {watershed.villages.length} habitations</p>
        </div>
        <div className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <span className="text-[11px] font-mono text-[#646464] uppercase">Operational Rate</span>
          <p className="mt-1 text-xl font-mono font-medium text-[#15803d]">
            {Math.round((interventions.filter(i => i.status === 'Operational').length / interventions.length) * 100)}%
          </p>
          <p className="text-[10px] text-[#15803d]">Healthy functioning</p>
        </div>
        <div className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <span className="text-[11px] font-mono text-[#646464] uppercase">Cumulative Storage</span>
          <p className="mt-1 text-xl font-mono font-medium text-[#0284c7]">
            {(totalStorageCapacity / 1000).toFixed(1)}k <span className="text-xs font-normal">m³</span>
          </p>
          <p className="text-[10px] text-[#0284c7]">Harvested runoff capacity</p>
        </div>
        <div className="p-3.5 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm">
          <span className="text-[11px] font-mono text-[#646464] uppercase">Attention Required</span>
          <p className="mt-1 text-xl font-mono font-medium text-[#d97706]">
            {interventions.filter(i => i.status !== 'Operational').length} units
          </p>
          <p className="text-[10px] text-[#d97706]">Desilting or repair needed</p>
        </div>
      </div>

      {/* Main Split Layout: Table / List on Left (7 cols), Detailed Dossier on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Interventions Explorer (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Filters Bar */}
          <div className="p-3 bg-[#ffffff] rounded-xl border border-[#dee2de] shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#646464] absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Search intervention name, agency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 pl-8 pr-2.5 py-1.5 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by Intervention Type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2 py-1.5 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs font-medium text-[#171717] focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="Check Dam">Check Dam</option>
                <option value="Farm Pond">Farm Pond</option>
                <option value="Contour Trench">Contour Trench</option>
                <option value="Plantation / Afforestation">Plantation</option>
                <option value="Gully Plug">Gully Plug</option>
                <option value="Percolation Tank">Percolation Tank</option>
              </select>

              <select
                aria-label="Filter by Intervention Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2 py-1.5 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs font-medium text-[#171717] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Operational">Operational</option>
                <option value="Requires Desilting">Requires Desilting</option>
                <option value="Damaged / Under Repair">Under Repair</option>
              </select>
            </div>
          </div>

          {/* Interventions Cards List */}
          <div className="space-y-2.5">
            {filteredInterventions.map((int) => {
              const isSelected = selectedDetailInt?.id === int.id;
              const isOperational = int.status === 'Operational';

              return (
                <motion.div
                  key={int.id}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setSelectedDetailInt(int);
                    onSelectIntervention(int);
                  }}
                  className={`p-4 bg-[#ffffff] rounded-xl border transition-all cursor-pointer shadow-sm ${
                    isSelected
                      ? 'border-[#41a1cf] ring-1 ring-[#41a1cf]/20 bg-sky-50/20'
                      : 'border-[#dee2de] hover:border-[#b4b8b4]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#f9faf7] text-[#2c2c2c] border border-[#dee2de]">
                          {int.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          isOperational ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {int.status}
                        </span>
                      </div>
                      <h3 className="font-serif text-base font-normal text-[#171717] mt-1">
                        {int.name}
                      </h3>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocateOnMap(int);
                      }}
                      className="p-1.5 rounded-lg border border-[#dee2de] text-[#444141] hover:text-[#41a1cf] hover:border-[#41a1cf] transition-all"
                      title="Locate on GIS Map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2.5 grid grid-cols-3 gap-2 text-[11px] text-[#646464] pt-2 border-t border-[#dee2de]/60">
                    <div>
                      <span>Village:</span>
                      <p className="font-medium text-[#171717]">{int.villageName}</p>
                    </div>
                    <div>
                      <span>Installed:</span>
                      <p className="font-mono text-[#171717]">{int.installationYear}</p>
                    </div>
                    <div>
                      <span>Storage:</span>
                      <p className="font-mono text-[#171717]">
                        {int.storageCapacityM3 ? `${int.storageCapacityM3.toLocaleString()} m³` : 'N/A'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

        </div>

        {/* Right Column: Detailed Selected Dossier (5 cols) */}
        <div className="lg:col-span-5">
          <AnimatePresence mode="wait">
            {selectedDetailInt ? (
              <motion.div
                key={selectedDetailInt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="p-5 bg-[#ffffff] rounded-2xl border border-[#dee2de] shadow-sm space-y-4 sticky top-20"
              >
              
              <div className="flex items-center justify-between pb-3 border-b border-[#dee2de]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#646464]">STRUCTURE DOSSIER</span>
                  <h3 className="font-serif text-lg font-medium text-[#171717]">
                    {selectedDetailInt.name}
                  </h3>
                </div>
                <button
                  onClick={() => onLocateOnMap(selectedDetailInt)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#41a1cf] text-[#41a1cf] hover:bg-[#41a1cf]/10 text-xs font-medium"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Map Pin</span>
                </button>
              </div>

              {/* Specifications Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-[#f9faf7] p-3.5 rounded-xl border border-[#dee2de]">
                <div>
                  <span className="text-[#646464] text-[10px]">Structure Type:</span>
                  <p className="font-medium text-[#171717]">{selectedDetailInt.type}</p>
                </div>
                <div>
                  <span className="text-[#646464] text-[10px]">Status:</span>
                  <p className="font-medium text-[#15803d]">{selectedDetailInt.status}</p>
                </div>
                <div>
                  <span className="text-[#646464] text-[10px]">Storage Capacity:</span>
                  <p className="font-mono font-medium text-[#171717]">
                    {selectedDetailInt.storageCapacityM3 ? `${selectedDetailInt.storageCapacityM3.toLocaleString()} m³` : 'Non-storage treatment'}
                  </p>
                </div>
                <div>
                  <span className="text-[#646464] text-[10px]">Catchment Intercepted:</span>
                  <p className="font-mono font-medium text-[#171717]">
                    {selectedDetailInt.catchmentAreaHa ? `${selectedDetailInt.catchmentAreaHa} Hectares` : 'Localized'}
                  </p>
                </div>
                <div>
                  <span className="text-[#646464] text-[10px]">GPS Coordinates:</span>
                  <p className="font-mono text-[#171717]">
                    {selectedDetailInt.latitude.toFixed(4)}°N, {selectedDetailInt.longitude.toFixed(4)}°E
                  </p>
                </div>
                <div>
                  <span className="text-[#646464] text-[10px]">Commissioning Agency:</span>
                  <p className="text-[#171717] truncate">{selectedDetailInt.contractorOrPanchayat}</p>
                </div>
              </div>

              {/* Linked Geo-coded Field Photographs */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-serif font-medium text-[#171717]">
                    Linked Geo-Coded Photographs
                  </span>
                  <span className="text-[11px] font-mono text-[#646464]">
                    {images.filter(img => selectedDetailInt.linkedImageIds.includes(img.id) || img.interventionId === selectedDetailInt.id).length} photos
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {images
                    .filter(img => selectedDetailInt.linkedImageIds.includes(img.id) || img.interventionId === selectedDetailInt.id)
                    .map((img) => (
                      <div
                        key={img.id}
                        onClick={() => onSelectImage(img)}
                        className="group cursor-pointer rounded-lg border border-[#dee2de] overflow-hidden bg-[#f9faf7] hover:border-[#41a1cf] transition-all"
                      >
                        <div className="h-20 w-full overflow-hidden">
                          <img
                            src={img.imageUrl}
                            alt={img.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="p-1.5 text-[10px] text-[#2c2c2c] truncate">
                          {img.title}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Periodic Monitoring Inspection Log */}
              <div>
                <span className="text-xs font-serif font-medium text-[#171717] block mb-2">
                  Periodic Monitoring History Log
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedDetailInt.monitoringHistory.map((log, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#f9faf7] rounded-lg border border-[#dee2de] text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px] text-[#646464]">
                        <span className="font-mono">{log.date}</span>
                        <span className="font-medium text-[#171717]">{log.inspector}</span>
                      </div>
                      <p className="text-[11px] text-[#444141] leading-relaxed">
                        {log.observations}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              </motion.div>
            ) : (
              <div className="p-8 bg-[#ffffff] rounded-2xl border border-[#dee2de] text-center text-[#646464] text-xs">
                Select an intervention from the list to view specifications and monitoring history.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Register Intervention Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-[1200] bg-[#171717]/50 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto"
          >
            <motion.div 
              variants={modalPanelVariants}
              className="bg-[#ffffff] border border-[#dee2de] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
            >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#dee2de] bg-[#f9faf7]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#41a1cf]" />
                <h3 className="font-serif text-base font-normal text-[#171717]">
                  Register New Watershed Structure
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#646464] hover:text-[#171717]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-[#2c2c2c] mb-1">
                  Structure Name & Identification Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masonry Check Dam CD-03 (East Nala)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2c2c2c] mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as InterventionType)}
                    className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                  >
                    <option value="Check Dam">Check Dam</option>
                    <option value="Farm Pond">Farm Pond</option>
                    <option value="Contour Trench">Contour Trench</option>
                    <option value="Plantation / Afforestation">Plantation</option>
                    <option value="Gully Plug">Gully Plug</option>
                    <option value="Percolation Tank">Percolation Tank</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#2c2c2c] mb-1">Village</label>
                  <select
                    value={newVillageId}
                    onChange={(e) => setNewVillageId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                  >
                    {watershed.villages.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2c2c2c] mb-1">Latitude (°N)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs font-mono text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2c2c2c] mb-1">Longitude (°E)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs font-mono text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#2c2c2c] mb-1">Capacity (cu.m)</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs font-mono text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#2c2c2c] mb-1">Catchment Area (Ha)</label>
                  <input
                    type="number"
                    value={newCatchment}
                    onChange={(e) => setNewCatchment(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs font-mono text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#2c2c2c] mb-1">
                  Commissioning Agency / Scheme
                </label>
                <input
                  type="text"
                  value={newAgency}
                  onChange={(e) => setNewAgency(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] focus:outline-none focus:border-[#41a1cf]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#dee2de]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#dee2de] text-[#444141] hover:bg-[#f9faf7] text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-[#1f1f29] text-white hover:bg-[#282834] font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Structure'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    </div>
  );
};
