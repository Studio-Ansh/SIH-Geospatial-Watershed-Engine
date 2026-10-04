import React from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  Camera, 
  Layers, 
  Satellite, 
  GitCompare, 
  FileText, 
  CheckCircle2, 
  Compass,
  ArrowRight
} from 'lucide-react';
import { Watershed } from '../types/index.js';

export type ActiveTab = 
  | 'dashboard' 
  | 'map' 
  | 'images' 
  | 'interventions' 
  | 'satellite' 
  | 'change' 
  | 'reports' 
  | 'alignment';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  watershed: Watershed;
  imageCount: number;
  interventionCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  watershed,
  imageCount,
  interventionCount
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'map', label: 'Interactive GIS Map', icon: <MapIcon className="w-4 h-4" />, badge: '30m' },
    { id: 'images', label: 'Geo-coded Photos', icon: <Camera className="w-4 h-4" />, badge: imageCount },
    { id: 'interventions', label: 'Interventions', icon: <Layers className="w-4 h-4" />, badge: interventionCount },
    { id: 'satellite', label: 'Satellite Layers', icon: <Satellite className="w-4 h-4" />, badge: 'DEMO' },
    { id: 'change', label: 'Change Detection', icon: <GitCompare className="w-4 h-4" /> },
    { id: 'reports', label: 'Monitoring Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'alignment', label: 'PS Alignment', icon: <CheckCircle2 className="w-4 h-4" />, badge: 'Verified' }
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#ffffff] border-r border-[#dee2de] flex flex-col justify-between p-3 min-h-[calc(100vh-61px)]">
      <div className="space-y-4">
        
        {/* Active Catchment Summary Card */}
        <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de]">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#646464] uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5 text-[#41a1cf]" />
            <span>Active Catchment</span>
          </div>
          <p className="mt-1 font-serif text-sm font-medium text-[#171717] line-clamp-1" title={watershed.name}>
            {watershed.name}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 pt-2 border-t border-[#dee2de]/60 text-[11px]">
            <div>
              <span className="text-[#646464]">Area:</span>
              <p className="font-mono font-medium text-[#171717]">{watershed.totalAreaKm2} km²</p>
            </div>
            <div>
              <span className="text-[#646464]">Villages:</span>
              <p className="font-mono font-medium text-[#171717]">{watershed.villages.length} units</p>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1f1f29] text-[#ffffff] shadow-sm'
                    : 'text-[#444141] hover:bg-[#f9faf7] hover:text-[#171717]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-[#41a1cf]' : 'text-[#646464]'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                      isActive
                        ? 'bg-[#ffffff]/20 text-[#ffffff]'
                        : 'bg-[#f9faf7] text-[#646464] border border-[#dee2de]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer / Guidance Notes */}
      <div className="p-3 bg-[#f9faf7] rounded-xl border border-[#dee2de] text-[11px] text-[#646464] space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-[#2c2c2c]">SRISHTI-DRISHTI Flow</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="leading-snug">
          Integrating geo-coded field evidence with 30m satellite layers & deterministic change detection.
        </p>
        <button
          onClick={() => onSelectTab('alignment')}
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#41a1cf] hover:underline font-medium"
        >
          <span>View PS compliance</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </aside>
  );
};
