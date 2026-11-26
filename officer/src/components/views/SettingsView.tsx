import React, { useState } from 'react';
import { 
  Settings, 
  ShieldCheck, 
  Scale, 
  Droplet, 
  Save, 
  CheckCircle
} from 'lucide-react';
import type { ProcurementOfficer } from '../../types/procurement';

interface SettingsViewProps {
  officer: ProcurementOfficer;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ officer }) => {
  const [paddyMoistureLimit, setPaddyMoistureLimit] = useState(17.0);
  const [wheatMoistureLimit, setWheatMoistureLimit] = useState(12.0);
  const [scaleTareTimeoutMinutes, setScaleTareTimeoutMinutes] = useState(30);
  const [autoDeductionEnabled, setAutoDeductionEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Title Bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">
              Procurement Center & System Parameters
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure weighbridge calibration thresholds, moisture tolerances, and DSC security settings.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Mandi Parameters</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-900 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-700" />
          <span>Settings saved and synchronized with Haryana APMC Mandi Core Database.</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Quality Tolerances */}
        <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Droplet className="w-4 h-4 text-blue-800" />
            <h3 className="font-bold text-slate-800 uppercase tracking-tight">
              Grain Moisture & Quality Tolerances
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Paddy Max Permissible Moisture (Standard: 14.0%):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.5"
                  value={paddyMoistureLimit}
                  onChange={(e) => setPaddyMoistureLimit(parseFloat(e.target.value))}
                  className="w-24 px-2.5 py-1 border border-slate-300 rounded font-mono font-bold"
                />
                <span className="text-slate-500">% (Rejection cutoff: &gt;17.0%)</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Wheat Max Permissible Moisture (Standard: 12.0%):
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.5"
                  value={wheatMoistureLimit}
                  onChange={(e) => setWheatMoistureLimit(parseFloat(e.target.value))}
                  className="w-24 px-2.5 py-1 border border-slate-300 rounded font-mono font-bold"
                />
                <span className="text-slate-500">% (Rejection cutoff: &gt;12.0%)</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDeductionEnabled}
                  onChange={(e) => setAutoDeductionEnabled(e.target.checked)}
                  className="rounded text-blue-900 accent-blue-900"
                />
                <span className="font-semibold text-slate-800">
                  Enable automatic pro-rata moisture deduction calculator
                </span>
              </label>
              <p className="text-[11px] text-slate-500 mt-0.5 ml-5">
                Automatically computes value reduction on WSR receipt when grain moisture is between standard and maximum limits.
              </p>
            </div>
          </div>
        </div>

        {/* Weighbridge & Scale Settings */}
        <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <Scale className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-slate-800 uppercase tracking-tight">
              Weighbridge & Tare Configuration
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-600 font-medium mb-1">
                Empty Vehicle Tare Expiration Window:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={scaleTareTimeoutMinutes}
                  onChange={(e) => setScaleTareTimeoutMinutes(parseInt(e.target.value))}
                  className="w-24 px-2.5 py-1 border border-slate-300 rounded font-mono font-bold"
                />
                <span className="text-slate-500">Minutes (Requires re-weighing if exceeded)</span>
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-1">
              <div className="font-semibold text-slate-800">Weights & Measures Dept. Verification</div>
              <div className="text-slate-500 text-[11px]">
                Valid Till: <strong>31-December-2026</strong> • Seal #WM-HR-KNL-99124
              </div>
              <div className="text-emerald-700 font-mono text-[10px] font-bold">
                Status: VERIFIED & SEALED
              </div>
            </div>
          </div>
        </div>

        {/* Officer DSC & Security Settings */}
        <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-slate-800 uppercase tracking-tight">
              Officer Digital Signature Certificate (DSC) & Biometric Token
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded p-2.5 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase">Officer Name:</span>
              <span className="font-bold text-slate-900">{officer.name}</span>
              <div className="text-slate-500 text-[11px] font-mono">{officer.id}</div>
            </div>

            <div className="border border-slate-200 rounded p-2.5 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase">e-Sign DSC Token:</span>
              <span className="font-mono font-bold text-emerald-700">Class 3 Government Token</span>
              <div className="text-slate-500 text-[11px]">Issuer: e-Mudhra / CCA India</div>
            </div>

            <div className="border border-slate-200 rounded p-2.5 space-y-1">
              <span className="text-slate-500 text-[10px] block uppercase">Center Nodal Code:</span>
              <span className="font-mono font-bold text-blue-900">{officer.mandiCode}</span>
              <div className="text-slate-500 text-[11px]">{officer.mandiName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
