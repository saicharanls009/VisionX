import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Bell, 
  UserCheck, 
  ChevronDown, 
  Clock, 
  Radio, 
  LogOut, 
  ShieldAlert, 
  FileText, 
  CheckCircle2
} from 'lucide-react';
import type { ProcurementOfficer, AlertItem } from '../../types/procurement';

interface HeaderProps {
  officer: ProcurementOfficer;
  alerts: AlertItem[];
  onOpenAlerts: () => void;
  onSelectMandi?: (mandiName: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ officer, alerts, onOpenAlerts }) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [mandiDropdownOpen, setMandiDropdownOpen] = useState(false);
  const [selectedYard, setSelectedYard] = useState('Yard No. 4 (Grain & Oilseeds)');

  const unreadAlerts = alerts.filter(a => !a.resolved).length;

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentTime(now.toLocaleString('en-IN', options) + ' IST');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Topmost National Portal Sub-Strip */}
      <div className="bg-slate-950 px-4 py-1 text-xs text-slate-300 flex flex-wrap justify-between items-center border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-amber-500 tracking-wide">भारत सरकार | GOVT. OF INDIA</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">Department of Food, Civil Supplies & Consumer Affairs</span>
          <span className="text-slate-500">•</span>
          <span className="text-emerald-400 font-medium">Haryana State Agricultural Marketing Board</span>
        </div>
        <div className="flex items-center space-x-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-emerald-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px]">AgriStack & PFMS: ONLINE</span>
          </span>
          <span className="text-slate-500">|</span>
          <span className="font-mono text-[11px] text-slate-300">{currentTime || 'Loading IST...'}</span>
        </div>
      </div>

      {/* Main Operational Header Bar */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Branding & Mandi Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* National Emblem / Ashoka Emblem Representation */}
            <div className="w-10 h-10 rounded-md bg-gradient-to-b from-amber-600 to-amber-700 p-0.5 flex flex-col items-center justify-center shadow-inner border border-amber-400/40">
              <span className="text-[9px] font-black tracking-widest text-white leading-none">सत्यमेव</span>
              <span className="text-[9px] font-black tracking-widest text-white leading-none">जयते</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-bold tracking-tight text-white">
                  KRISHI-UPARJAN
                </span>
                <span className="text-[10px] uppercase font-semibold bg-emerald-700/80 text-emerald-100 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  PROCUREMENT OFFICER PORTAL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                National Agricultural MSP Procurement Operations System
              </p>
            </div>
          </div>

          <div className="hidden lg:block h-8 w-px bg-slate-800" />

          {/* Mandi Yard Selector */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setMandiDropdownOpen(!mandiDropdownOpen)}
              className="flex items-center space-x-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 text-left transition"
              title="Click to switch mandi yard"
            >
              <Building2 className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-100">{officer.mandiName}</span>
                  <span className="text-[10px] bg-slate-700 text-slate-300 font-mono px-1 rounded">{officer.mandiCode}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span>{selectedYard}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            </button>

            {mandiDropdownOpen && (
              <div className="absolute left-0 mt-1 w-72 bg-slate-900 border border-slate-700 rounded-md shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-1.5 font-semibold text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                  Switch Active Yard / Sub-Center
                </div>
                {[
                  'Yard No. 4 (Grain & Oilseeds)',
                  'Yard No. 1 (Commercial Cotton & Coarse Grain)',
                  'Yard No. 2 (Wheat Silo Terminal)',
                  'Sub-Center Nilokheri (Satellite Mandi)',
                ].map((yard) => (
                  <button
                    key={yard}
                    onClick={() => {
                      setSelectedYard(yard);
                      setMandiDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-slate-800 flex items-center justify-between ${
                      selectedYard === yard ? 'text-amber-400 font-medium bg-slate-800/50' : 'text-slate-300'
                    }`}
                  >
                    <span>{yard}</span>
                    {selectedYard === yard && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Operational Status, Alerts, Officer Profile */}
        <div className="flex items-center space-x-3">
          {/* Operational Status Pill */}
          <div className="hidden xl:flex items-center space-x-2 bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-1 rounded-md text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-emerald-300 font-medium">Center Live</span>
            <span className="text-emerald-500 text-[11px]">• 2 Weighbridges Active</span>
          </div>

          {/* Notifications / Alerts Button */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            title="Operational Alerts"
            aria-label="View Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900">
                {unreadAlerts}
              </span>
            )}
          </button>

          {/* Officer Profile & Quick Handover Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-2.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-md text-left transition"
            >
              <div className="w-7 h-7 rounded bg-blue-900 text-amber-300 font-bold flex items-center justify-center text-xs border border-blue-700">
                RK
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-100 leading-tight">{officer.name}</div>
                <div className="text-[10px] text-amber-400/90 font-mono leading-tight">{officer.id} • {officer.shift.split(' ')[0]}</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-md shadow-2xl py-2 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="font-bold text-slate-100">{officer.name}</div>
                  <div className="text-[11px] text-slate-400">{officer.designation}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
                    <UserCheck className="w-3 h-3" /> Digital DSC Token: ACTIVE
                  </div>
                </div>

                <div className="py-1">
                  <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Officer Controls
                  </div>
                  <button 
                    onClick={() => { alert('Shift Handover Protocol initiated. Awaiting relieving officer biometric verification.'); setProfileOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Shift Handover / Day Close</span>
                  </button>
                  <button 
                    onClick={() => { alert('Weighbridge Calibration Audit log opened.'); setProfileOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-slate-300 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" />
                    <span>Daily Tare Audit Sheet</span>
                  </button>
                  <button 
                    onClick={() => { alert('Emergency Mandi Lock protocol is reserved for District Magistrate / Director Agriculture.'); setProfileOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-red-300 hover:bg-red-950/40 flex items-center space-x-2"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                    <span>Emergency Mandi Hold</span>
                  </button>
                </div>

                <div className="border-t border-slate-800 pt-1 mt-1">
                  <button 
                    onClick={() => { alert('Officer session locked.'); setProfileOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-slate-400 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-400" />
                    <span>Lock Session / Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
