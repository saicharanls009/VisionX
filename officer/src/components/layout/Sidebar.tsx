import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Scale, 
  FileCheck2, 
  IndianRupee, 
  BarChart3, 
  Settings, 
  ShieldCheck, 
  Building
} from 'lucide-react';
import type { ProcurementOfficer } from '../../types/procurement';

export type ViewType = 
  | 'dashboard' 
  | 'queue' 
  | 'weighment' 
  | 'records' 
  | 'payments' 
  | 'reports' 
  | 'settings';

interface SidebarProps {
  currentView: ViewType;
  onSelectView: (view: ViewType) => void;
  queueCount: number;
  weighmentCount: number;
  pendingDbtCount: number;
  officer: ProcurementOfficer;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  queueCount,
  weighmentCount,
  pendingDbtCount,
  officer,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const navItems: {
    id: ViewType;
    label: string;
    sublabel: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sublabel: 'Operations Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'queue',
      label: "Today's Queue",
      sublabel: 'Token & Gate Arrivals',
      icon: Users,
      badge: queueCount,
      badgeColor: 'bg-blue-900 text-blue-200 border-blue-700',
    },
    {
      id: 'weighment',
      label: 'Weighment & Quality',
      sublabel: 'Scale & Grain Lab',
      icon: Scale,
      badge: weighmentCount,
      badgeColor: 'bg-amber-900/80 text-amber-200 border-amber-700',
    },
    {
      id: 'records',
      label: 'Procurement Records',
      sublabel: 'J-Forms & WSR Archive',
      icon: FileCheck2,
    },
    {
      id: 'payments',
      label: 'Money Settlements',
      sublabel: 'Pending & Settled Payments',
      icon: IndianRupee,
      badge: pendingDbtCount,
      badgeColor: 'bg-emerald-900/80 text-emerald-200 border-emerald-700',
    },
    {
      id: 'reports',
      label: 'Reports & Analytics',
      sublabel: 'MIS & Target Tracking',
      icon: BarChart3,
    },
    {
      id: 'settings',
      label: 'Settings',
      sublabel: 'Scale & Mandi Params',
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile} 
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Main Sidebar Container - Independent Vertical Scrolling */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 h-full overflow-hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation Head / Center Badge */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/40 shrink-0">
            <div className="flex items-center space-x-2 text-slate-300">
              <Building className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  PROCUREMENT CENTER
                </div>
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {officer.mandiName}
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700/60 font-mono">
              <span className="text-amber-300">{officer.yardNumber.split(' ')[0]} {officer.yardNumber.split(' ')[1]}</span>
              <span className="text-emerald-400">Rabi/Kharif 2026-27</span>
            </div>
          </div>

          {/* Independent Scrollable Nav List */}
          <nav className="p-2 space-y-1 flex-1 overflow-y-auto min-h-0">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Operations Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectView(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-900/90 text-white font-semibold shadow-inner border border-blue-600/60'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon 
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'
                      }`} 
                    />
                    <div className="text-left">
                      <div className="leading-tight">{item.label}</div>
                      <div className="text-[10px] text-slate-400 group-hover:text-slate-300 font-normal leading-none mt-0.5">
                        {item.sublabel}
                      </div>
                    </div>
                  </div>

                  {item.badge !== undefined && (
                    <span 
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
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

        {/* Bottom Operational Status Card - Pinned to bottom of Sidebar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2 shrink-0">
          {/* Active Shift details */}
          <div className="bg-slate-900 border border-slate-800 rounded p-2 text-xs">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Shift: Morning</span>
              <span className="text-emerald-400 font-mono text-[10px]">08:00 - 16:00</span>
            </div>
            <div className="text-slate-200 font-medium text-xs mt-1 truncate">
              {officer.name}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Badge: {officer.id}
            </div>
          </div>

          {/* Quick System Compliance Badges */}
          <div className="text-[11px] text-slate-400 flex items-center justify-between px-1">
            <span className="flex items-center gap-1 text-emerald-400 text-[10px]">
              <ShieldCheck className="w-3 h-3" /> UIDAI / e-NAM
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              Ver 4.2.8
            </span>
          </div>

          {/* Mandi Support Helpline */}
          <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 flex items-center justify-between">
            <span>Control Room:</span>
            <span className="font-mono text-amber-400 font-medium">1800-180-1551</span>
          </div>
        </div>
      </aside>
    </>
  );
};
