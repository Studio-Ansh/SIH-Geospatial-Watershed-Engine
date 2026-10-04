import React, { useState, useRef, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  ShieldCheck, 
  Info, 
  MapPin, 
  Calendar, 
  Activity, 
  UserCheck,
  Camera,
  X
} from 'lucide-react';
import { Watershed, UserRole, GeoImage, Intervention, Village } from '../types/index.js';

interface HeaderProps {
  watersheds: Watershed[];
  selectedWatershedId: string;
  onSelectWatershed: (id: string) => void;
  selectedYear: number;
  onSelectYear: (year: number) => void;
  userRole: UserRole;
  onChangeUserRole: (role: UserRole) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenGisMap: () => void;
  onOpenDataSources: () => void;
  images?: GeoImage[];
  interventions?: Intervention[];
  villages?: Village[];
  onSelectSearchResultPhoto?: (image: GeoImage) => void;
  onSelectSearchResultIntervention?: (intervention: Intervention) => void;
  onSelectSearchResultVillage?: (village: Village) => void;
}

export const Header: React.FC<HeaderProps> = ({
  watersheds,
  selectedWatershedId,
  onSelectWatershed,
  selectedYear,
  onSelectYear,
  userRole,
  onChangeUserRole,
  searchQuery,
  onSearchChange,
  onOpenGisMap,
  onOpenDataSources,
  images = [],
  interventions = [],
  villages = [],
  onSelectSearchResultPhoto,
  onSelectSearchResultIntervention,
  onSelectSearchResultVillage
}) => {
  const currentWatershed = watersheds.find(w => w.id === selectedWatershedId) || watersheds[0];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const trimmedQuery = searchQuery.trim().toLowerCase();

  const matchedPhotos = trimmedQuery
    ? images.filter(img => 
        img.title.toLowerCase().includes(trimmedQuery) ||
        img.villageName.toLowerCase().includes(trimmedQuery) ||
        img.interventionType.toLowerCase().includes(trimmedQuery) ||
        img.fieldNotes.toLowerCase().includes(trimmedQuery) ||
        img.id.toLowerCase().includes(trimmedQuery)
      ).slice(0, 3)
    : [];

  const matchedInterventions = trimmedQuery
    ? interventions.filter(i =>
        i.name.toLowerCase().includes(trimmedQuery) ||
        i.type.toLowerCase().includes(trimmedQuery) ||
        i.villageName.toLowerCase().includes(trimmedQuery) ||
        i.contractorOrPanchayat.toLowerCase().includes(trimmedQuery) ||
        i.id.toLowerCase().includes(trimmedQuery)
      ).slice(0, 3)
    : [];

  const matchedVillages = trimmedQuery
    ? villages.filter(v =>
        v.name.toLowerCase().includes(trimmedQuery) ||
        v.id.toLowerCase().includes(trimmedQuery)
      ).slice(0, 2)
    : [];

  const totalResults = matchedPhotos.length + matchedInterventions.length + matchedVillages.length;
  const showDropdown = isDropdownOpen && trimmedQuery.length > 0;

  return (
    <header className="sticky top-0 z-30 bg-[#fefffc]/95 backdrop-blur-md border-b border-[#dee2de] px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Brand & Platform Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1f1f29] text-[#fefffc] flex items-center justify-center shadow-sm border border-[#282834]">
            <Layers className="w-5 h-5 text-[#41a1cf]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-normal tracking-tight text-[#171717]">
                GeoWatershed
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#f9faf7] text-[#444141] border border-[#dee2de]">
                SRISHTI-DRISHTI 30m
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200" title="Simulated prototype data clearly labeled">
                DEMO DATA
              </span>
            </div>
            <p className="text-[12px] text-[#646464] font-sans">
              Geo-coded Image Visualization & Geospatial Analysis Platform
            </p>
          </div>
        </div>

        {/* Global Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          
          {/* Watershed Selector */}
          <div className="flex items-center gap-1.5 bg-[#ffffff] border border-[#dee2de] rounded-lg px-2.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <MapPin className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span className="text-[#646464] font-medium">Watershed:</span>
            <select
              aria-label="Select Watershed"
              value={selectedWatershedId}
              onChange={(e) => onSelectWatershed(e.target.value)}
              className="bg-transparent font-medium text-[#171717] focus:outline-none cursor-pointer"
            >
              {watersheds.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.district}, {w.state})
                </option>
              ))}
            </select>
          </div>

          {/* Monitoring Year Selector */}
          <div className="flex items-center gap-1.5 bg-[#ffffff] border border-[#dee2de] rounded-lg px-2.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <Calendar className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span className="text-[#646464] font-medium">Year:</span>
            <select
              aria-label="Select Monitoring Year"
              value={selectedYear}
              onChange={(e) => onSelectYear(parseInt(e.target.value, 10))}
              className="bg-transparent font-medium text-[#171717] focus:outline-none cursor-pointer"
            >
              <option value={2026}>2026 (Matured Impact)</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024 (Midline Audit)</option>
              <option value={2023}>2023</option>
              <option value={2022}>2022 (Baseline)</option>
            </select>
          </div>

          {/* Quick Search with Dropdown Results */}
          <div ref={searchContainerRef} className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#646464] absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search village, structure, photo..."
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setIsDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsDropdownOpen(false);
              }}
              className="w-44 md:w-56 pl-8 pr-7 py-1.5 bg-[#f9faf7] border border-[#dee2de] rounded-lg text-xs text-[#2c2c2c] placeholder-[#646464] focus:outline-none focus:border-[#41a1cf] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  onSearchChange('');
                  setIsDropdownOpen(false);
                }}
                className="absolute right-2 text-[#646464] hover:text-[#171717]"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            {/* Global Search Results Dropdown (Max 8 results, grouped) */}
            {showDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1.5 w-72 md:w-84 bg-[#ffffff] border border-[#dee2de] rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto divide-y divide-[#dee2de]/60 py-1 text-xs">
                {totalResults === 0 ? (
                  <div className="p-3 text-center text-[#646464]">
                    No matching photos, structures, or villages found.
                  </div>
                ) : (
                  <>
                    {/* Geo-coded Photos */}
                    {matchedPhotos.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#646464] font-semibold px-2">
                          <Camera className="w-3 h-3 text-[#41a1cf]" />
                          Photos ({matchedPhotos.length})
                        </span>
                        {matchedPhotos.map(photo => (
                          <div
                            key={photo.id}
                            onClick={() => {
                              if (onSelectSearchResultPhoto) onSelectSearchResultPhoto(photo);
                              setIsDropdownOpen(false);
                              onSearchChange('');
                            }}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#f9faf7] cursor-pointer transition-colors"
                          >
                            <img src={photo.imageUrl} alt={photo.title} className="w-8 h-8 rounded object-cover border border-[#dee2de] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[#171717] truncate">{photo.title}</p>
                              <p className="text-[10px] text-[#646464] truncate">{photo.villageName} • {photo.interventionType}</p>
                            </div>
                            <span className="text-[9px] font-mono text-[#41a1cf] shrink-0">Analysis</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Interventions */}
                    {matchedInterventions.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#646464] font-semibold px-2">
                          <Layers className="w-3 h-3 text-[#16a34a]" />
                          Interventions ({matchedInterventions.length})
                        </span>
                        {matchedInterventions.map(intv => (
                          <div
                            key={intv.id}
                            onClick={() => {
                              if (onSelectSearchResultIntervention) onSelectSearchResultIntervention(intv);
                              setIsDropdownOpen(false);
                              onSearchChange('');
                            }}
                            className="p-2 rounded-lg hover:bg-[#f9faf7] cursor-pointer transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-[#171717] truncate">{intv.name}</p>
                              <span className="text-[9px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {intv.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#646464] truncate">{intv.type} • {intv.villageName}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Villages */}
                    {matchedVillages.length > 0 && (
                      <div className="p-2 space-y-1">
                        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[#646464] font-semibold px-2">
                          <MapPin className="w-3 h-3 text-[#d97706]" />
                          Villages ({matchedVillages.length})
                        </span>
                        {matchedVillages.map(village => (
                          <div
                            key={village.id}
                            onClick={() => {
                              if (onSelectSearchResultVillage) onSelectSearchResultVillage(village);
                              setIsDropdownOpen(false);
                              onSearchChange('');
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#f9faf7] cursor-pointer transition-colors"
                          >
                            <div>
                              <p className="font-medium text-[#171717]">{village.name}</p>
                              <p className="text-[10px] text-[#646464]">Pop: {village.population.toLocaleString()} • {village.households} households</p>
                            </div>
                            <span className="text-[9px] font-mono text-[#41a1cf]">Fly Map</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* User Role Switcher */}
          <div className="flex items-center gap-1.5 bg-[#ffffff] border border-[#dee2de] rounded-lg px-2.5 py-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <UserCheck className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span className="text-[#646464]">Role:</span>
            <select
              aria-label="Select User Role"
              value={userRole}
              onChange={(e) => onChangeUserRole(e.target.value as UserRole)}
              className="bg-transparent font-medium text-[#171717] focus:outline-none cursor-pointer"
            >
              <option value="Administrator">Administrator</option>
              <option value="GIS Analyst">GIS Analyst</option>
              <option value="Field Officer">Field Officer</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>

          {/* Data Sources Guide Button */}
          <button
            onClick={onOpenDataSources}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#dee2de] bg-[#ffffff] text-[#444141] hover:text-[#171717] hover:border-[#b4b8b4] font-medium text-xs transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
            title="Where to get official SRISHTI-DRISHTI, satellite & GIS datasets"
          >
            <Info className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span>Data Sources</span>
          </button>

          {/* Map Direct CTA */}
          <button
            onClick={onOpenGisMap}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#41a1cf] text-[#41a1cf] hover:bg-[#41a1cf]/10 font-medium text-xs transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>GIS View</span>
          </button>
        </div>

      </div>
    </header>
  );
};
