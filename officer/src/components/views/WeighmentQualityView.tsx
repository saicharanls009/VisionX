import React, { useState } from 'react';
import { 
  Scale, 
  FlaskConical, 
  Cpu
} from 'lucide-react';
import type { QueueItem, MspSpec } from '../../types/procurement';
import { MSP_RATES } from '../../types/procurement';

interface WeighmentQualityViewProps {
  items: QueueItem[];
  onOpenWorkflow: (item: QueueItem) => void;
}

export const WeighmentQualityView: React.FC<WeighmentQualityViewProps> = ({
  items,
  onOpenWorkflow,
}) => {
  const [scale1Load, setScale1Load] = useState('8,940 kg (HR-45-D-2219)');
  const [scale2Load, setScale2Load] = useState('Zero Balance (Empty)');

  const activeTestingItems = items.filter(
    (i) => i.status === 'Called' || i.status === 'Processing' || i.status === 'Waiting'
  );

  return (
    <div className="space-y-4">
      {/* Title Bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Scale className="w-5 h-5 text-blue-900" />
            <h2 className="text-base font-bold text-slate-900">
              Weighment Operations & Grain Quality Laboratory
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrated weighbridge digital loadcells and BIS specification grain moisture testers.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-emerald-50 text-emerald-800 font-mono px-2.5 py-1 rounded border border-emerald-200 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Scales & Meters Calibrated Today (07:30 AM)
          </span>
        </div>
      </div>

      {/* Live Weighbridge Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Weighbridge 1 */}
        <div className="bg-slate-900 text-white rounded-md border border-slate-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Weighbridge WB-01 (Heavy Pitless 60 MT)
              </span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700">
              ONLINE
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Current Live Readout</div>
              <div className="text-2xl font-black font-mono text-emerald-400 mt-0.5">
                {scale1Load}
              </div>
            </div>
            <button
              onClick={() => setScale1Load('Zero Balance (0 kg)')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700"
            >
              Zero Tare
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 font-mono">
            <div>Max Cap: <strong>60,000 kg</strong></div>
            <div>Resolution: <strong>&plusmn;10 kg</strong></div>
            <div>Slip Seq: <strong>#WS-4401</strong></div>
          </div>
        </div>

        {/* Weighbridge 2 */}
        <div className="bg-slate-900 text-white rounded-md border border-slate-800 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                Weighbridge WB-02 (Medium Pitless 40 MT)
              </span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-700">
              ONLINE
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-mono">Current Live Readout</div>
              <div className="text-2xl font-black font-mono text-amber-400 mt-0.5">
                {scale2Load}
              </div>
            </div>
            <button
              onClick={() => setScale2Load('Zero Balance (0 kg)')}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded border border-slate-700"
            >
              Zero Tare
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-300 font-mono">
            <div>Max Cap: <strong>40,000 kg</strong></div>
            <div>Resolution: <strong>&plusmn;5 kg</strong></div>
            <div>Slip Seq: <strong>#WS-4402</strong></div>
          </div>
        </div>
      </div>

      {/* Official Quality Standards Table */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-purple-800" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              Statutory MSP Quality Parameters & Moisture Tolerances (Kharif/Rabi 2026-27)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Source: Ministry of Consumer Affairs, Food & Public Distribution
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <tr>
                <th className="py-2 px-3">Crop Commodity</th>
                <th className="py-2 px-3">Official MSP</th>
                <th className="py-2 px-3 text-center">Max Permissible Moisture</th>
                <th className="py-2 px-3 text-center">Inorganic Foreign Matter</th>
                <th className="py-2 px-3 text-center">Damaged / Discolored</th>
                <th className="py-2 px-3">Deduction Rule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {(Object.entries(MSP_RATES) as [string, MspSpec][]).map(([crop, data]) => (
                <tr key={crop} className="hover:bg-slate-50">
                  <td className="py-2 px-3 font-bold text-slate-900">{crop}</td>
                  <td className="py-2 px-3 font-mono font-semibold text-emerald-800">
                    ₹{data.msp.toLocaleString()} / Qtl
                  </td>
                  <td className="py-2 px-3 text-center font-mono font-bold text-blue-900">
                    &le; {data.maxMoisture}%
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-slate-600">&le; 1.0%</td>
                  <td className="py-2 px-3 text-center font-mono text-slate-600">&le; 2.0%</td>
                  <td className="py-2 px-3 text-[11px] text-slate-600">
                    Pro-rata 0.75% value deduction per 1% excess moisture
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Queue Lots Currently at Inspection Bays */}
      <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
          Active Lots in Testing & Weighment Queue ({activeTestingItems.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {activeTestingItems.map((item) => (
            <div
              key={item.id}
              className="border border-slate-200 rounded p-3 text-xs bg-slate-50/50 hover:bg-white hover:border-blue-400 transition cursor-pointer flex flex-col justify-between"
              onClick={() => onOpenWorkflow(item)}
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono font-bold text-sm text-blue-900">{item.tokenNumber}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold">
                    {item.status}
                  </span>
                </div>
                <div className="font-bold text-slate-900">{item.farmer.name}</div>
                <div className="text-slate-500 text-[11px]">{item.crop} ({item.variety}) • {item.estimatedQuantityQuintals} Qtl Est.</div>
                <div className="text-slate-500 text-[11px] mt-1 font-mono">Location: {item.bay}</div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[10px] text-slate-400 font-mono">Tractor: {item.vehicleNumber}</span>
                <span className="text-blue-800 font-semibold hover:underline text-[11px]">
                  Open Lab Record &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
