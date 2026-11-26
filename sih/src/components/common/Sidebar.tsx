import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  UserCheck,
  UserPlus,
  CalendarCheck,
  ListOrdered,
  Activity,
  Printer,
  HelpCircle,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'farmers'
  | 'register-farmer'
  | 'booking'
  | 'queue'
  | 'status'
  | 'token-print';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Assistant Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'farmers' as NavTab,
      label: 'Find Farmer',
      icon: UserCheck,
      badge: null,
    },
    {
      id: 'register-farmer' as NavTab,
      label: 'Register Farmer',
      icon: UserPlus,
      badge: 'Assisted',
    },
    {
      id: 'booking' as NavTab,
      label: 'Schedule Visit',
      icon: CalendarCheck,
      badge: 'Live',
    },
    {
      id: 'queue' as NavTab,
      label: 'Live Mandi Queue',
      icon: ListOrdered,
      badge: 'Real-time',
    },
    {
      id: 'status' as NavTab,
      label: 'Track Farmer Status',
      icon: Activity,
      badge: null,
    },
    {
      id: 'token-print' as NavTab,
      label: 'Print Appointment Slip',
      icon: Printer,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex-shrink-0 flex flex-col justify-between overflow-y-auto overscroll-contain no-print border-r border-slate-800">
      <div className="p-4 space-y-6">
        {/* Role Identity Card */}
        <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Assistant Workspace
          </div>
          <p className="text-xs text-slate-300 mt-1 font-medium leading-snug">
            Supporting farmers at this service center
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gov-navy text-white shadow-md font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                      item.badge === 'Real-time' || item.badge === 'Live'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                        : 'bg-slate-800 text-slate-400'
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

      {/* Operator Advisory Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            Assistant helpline: <span className="text-slate-200 font-semibold">1800-180-1551</span> (Kisan Call Center)
          </p>
        </div>
      </div>
    </aside>
  );
};
