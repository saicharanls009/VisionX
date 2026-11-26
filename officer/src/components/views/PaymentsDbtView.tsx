import React, { useState } from 'react';
import { IndianRupee, RefreshCw, Search } from 'lucide-react';
import type { QueueItem } from '../../types/procurement';

interface PaymentsDbtViewProps {
  items: QueueItem[];
  onSelectRecord: (item: QueueItem) => void;
}

export const PaymentsDbtView: React.FC<PaymentsDbtViewProps> = ({ items, onSelectRecord }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const paymentItems = items.filter((item) => item.paymentDbt);
  const filteredItems = paymentItems.filter((item) => `${item.farmer.name} ${item.tokenNumber} ${item.paymentDbt?.pfmsReferenceNumber || ''}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const credited = paymentItems.filter((item) => ['Credited', 'PFMS Cleared'].includes(item.paymentDbt?.dbtStatus || '')).reduce((sum, item) => sum + (item.paymentDbt?.netPayable || 0), 0);
  const pending = paymentItems.filter((item) => ['Pending', 'Initiated'].includes(item.paymentDbt?.dbtStatus || '')).reduce((sum, item) => sum + (item.paymentDbt?.netPayable || 0), 0);
  const sync = () => { setIsSyncing(true); setTimeout(() => { setIsSyncing(false); alert('PFMS Gateway synchronized successfully.'); }, 1200); };

  return <div className="space-y-4">
    <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="flex items-center space-x-2"><IndianRupee className="w-5 h-5 text-emerald-800" /><h2 className="text-base font-bold text-slate-900">Direct Benefit Transfer (DBT) & PFMS Settlement Console</h2></div><p className="text-xs text-slate-500 mt-0.5">Current-session payment records and PFMS settlement status.</p></div><button onClick={sync} disabled={isSyncing} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow-xs"><RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /><span>{isSyncing ? 'Syncing with PFMS...' : 'Sync PFMS Gateway'}</span></button></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-white"><div className="bg-emerald-950 rounded p-3.5 border border-emerald-800"><div className="text-emerald-400 font-semibold uppercase text-[10px]">Credited to Farmers Today</div><div className="text-2xl font-black font-mono text-emerald-300">Rs.{credited.toLocaleString()}</div><div className="text-[11px] text-emerald-200 font-mono">{paymentItems.length} payment records</div></div><div className="bg-slate-900 rounded p-3.5 border border-slate-800"><div className="text-amber-400 font-semibold uppercase text-[10px]">Pending Bank Clearance</div><div className="text-2xl font-black font-mono text-amber-300">Rs.{pending.toLocaleString()}</div><div className="text-[11px] text-slate-300 font-mono">Awaiting PFMS settlement</div></div><div className="bg-slate-900 rounded p-3.5 border border-slate-800"><div className="text-rose-400 font-semibold uppercase text-[10px]">PFMS Exceptions / Returns</div><div className="text-2xl font-black font-mono text-rose-400">0</div><div className="text-[11px] text-slate-300 font-mono">No payment exceptions</div></div></div>
    <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs space-y-3"><div className="relative w-full sm:w-72"><Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" /><input type="text" placeholder="Search PFMS Ref, Farmer, Token..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-800" /></div>{filteredItems.length === 0 ? <div className="py-8 text-center text-xs text-slate-500">No DBT payment records for this session.</div> : <table className="w-full text-left text-xs"><tbody>{filteredItems.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="py-2.5 px-3 font-mono font-bold">{item.paymentDbt?.pfmsReferenceNumber || 'Pending reference'}</td><td className="py-2.5 px-3">{item.farmer.name}</td><td className="py-2.5 px-3 text-right font-mono">Rs.{(item.paymentDbt?.netPayable || 0).toLocaleString()}</td><td className="py-2.5 px-3 text-right"><button onClick={() => onSelectRecord(item)} className="text-blue-800 hover:text-blue-950 font-semibold underline">Audit Slip</button></td></tr>)}</tbody></table>}</div>
  </div>;
};
