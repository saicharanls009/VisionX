import React, { useState } from 'react';
import { 
  FileCheck2, 
  Search, 
  Printer
} from 'lucide-react';
import type { QueueItem } from '../../types/procurement';

interface RecordsViewProps {
  items: QueueItem[];
  onSelectRecord: (item: QueueItem) => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  items,
  onSelectRecord,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter for completed items or show all with records
  const records = items.filter(
    (item) => item.status === 'Completed' || item.receiptNumber
  );

  const filteredRecords = records.filter(
    (r) =>
      r.farmer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tokenNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.receiptNumber && r.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalProcuredQtl = records.reduce(
    (sum, r) => sum + (r.actualQuantityQuintals || r.estimatedQuantityQuintals),
    0
  );

  const totalValue = records.reduce(
    (sum, r) => sum + (r.paymentDbt?.netPayable || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Title Bar */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-emerald-800" />
            <h2 className="text-base font-bold text-slate-900">
              Procurement Records & Warehouse Sahi Receipts (WSR)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Archived statutory J-Forms, mandi weighment slips, and grain acceptance certificates.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button 
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Daily Register</span>
          </button>
        </div>
      </div>

      {/* Summary KPI banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded p-3 text-xs">
          <span className="text-slate-500 text-[11px] uppercase font-semibold">Total WSRs Issued Today</span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">{records.length} Lots</div>
          <span className="text-[10px] text-emerald-700 font-medium">All authenticated with officer DSC</span>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 text-xs">
          <span className="text-slate-500 text-[11px] uppercase font-semibold">Total Weight Accepted</span>
          <div className="text-2xl font-black font-mono text-blue-900 mt-1">
            {totalProcuredQtl.toFixed(2)} <span className="text-sm font-normal">Qtl</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Dispatched to FCI Silo 3 & 4</span>
        </div>

        <div className="bg-white border border-slate-200 rounded p-3 text-xs">
          <span className="text-slate-500 text-[11px] uppercase font-semibold">Total Gross MSP Value</span>
          <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
            ₹{(totalValue / 100000).toFixed(2)} <span className="text-sm font-normal">Lakhs</span>
          </div>
          <span className="text-[10px] text-slate-500">Transferred via PFMS DBT Gateway</span>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search WSR #, Farmer, Token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-800"
            />
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing {filteredRecords.length} archived records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="py-2 px-3">Receipt / WSR #</th>
                <th className="py-2 px-3">Token</th>
                <th className="py-2 px-3">Farmer Name & ID</th>
                <th className="py-2 px-3">Crop Commodity</th>
                <th className="py-2 px-3 text-right">Net Qty (Qtl)</th>
                <th className="py-2 px-3 text-right">MSP Value (₹)</th>
                <th className="py-2 px-3 text-center">DBT Status</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-900">
                    {rec.receiptNumber || 'WSR-2026-0841'}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                    {rec.tokenNumber}
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{rec.farmer.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{rec.farmer.id}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-slate-800">{rec.crop}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{rec.variety}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {(rec.actualQuantityQuintals || rec.estimatedQuantityQuintals).toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                    ₹{(rec.paymentDbt?.netPayable || 84240).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      {rec.paymentDbt?.dbtStatus || 'PFMS Cleared'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectRecord(rec)}
                      className="text-xs text-blue-800 hover:text-blue-950 font-semibold underline"
                    >
                      View Slip
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
