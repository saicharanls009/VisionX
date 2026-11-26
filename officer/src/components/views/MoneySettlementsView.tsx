import React, { useState } from 'react';
import { CheckCircle2, IndianRupee, Search } from 'lucide-react';
import type { SettlementRecord } from '../../firebase/officerStore';

interface MoneySettlementsViewProps {
  records: SettlementRecord[];
  onSettle: (record: SettlementRecord) => void;
}

const displayDate = (value: unknown) => {
  if (!value) return '—';
  if (typeof value === 'string') return new Date(value).toLocaleString('en-IN');
  if (typeof value === 'object' && value && 'toDate' in value && typeof value.toDate === 'function') return value.toDate().toLocaleString('en-IN');
  return '—';
};

export const MoneySettlementsView: React.FC<MoneySettlementsViewProps> = ({ records, onSettle }) => {
  const [search, setSearch] = useState('');
  const matchesSearch = (record: SettlementRecord) => `${record.farmerName} ${record.farmerId} ${record.appointmentId} ${record.procurementId} ${record.crop}`.toLowerCase().includes(search.toLowerCase());
  const pending = records.filter((record) => record.paymentStatus === 'pending' && matchesSearch(record));
  const settled = records.filter((record) => record.paymentStatus === 'settled' && matchesSearch(record));

  const table = (items: SettlementRecord[], allowSettlement: boolean) => items.length === 0 ? (
    <div className="py-8 text-center text-xs text-slate-500">No {allowSettlement ? 'pending' : 'settled'} payments match this search.</div>
  ) : (
    <div className="overflow-x-auto"><table className="w-full min-w-[1100px] text-left text-xs"><thead className="bg-slate-50 border-y border-slate-200 text-[10px] uppercase text-slate-500"><tr>{['Farmer', 'Appointment / Procurement', 'Crop & Quantity', 'Procurement', 'Payment', 'Amount Payable', 'Completed', 'Settled / Reference', 'Action'].map((label) => <th key={label} className="px-3 py-2 font-semibold">{label}</th>)}</tr></thead><tbody>{items.map((record) => <tr key={record.id} className="border-b border-slate-100 align-top"><td className="px-3 py-3 font-semibold text-slate-900">{record.farmerName}<div className="mt-0.5 font-mono text-[10px] text-slate-500">FID: {record.farmerId || '—'}</div></td><td className="px-3 py-3 font-mono text-[10px] text-slate-700">APT: {record.appointmentId || '—'}<div>PROC: {record.procurementId}</div></td><td className="px-3 py-3">{record.crop || '—'}<div className="mt-0.5 text-slate-500">Expected: {record.expectedQuantity} · Actual: {record.actualQuantity}</div></td><td className="px-3 py-3"><span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-800">Completed</span></td><td className="px-3 py-3"><span className={`rounded px-1.5 py-0.5 font-semibold ${record.paymentStatus === 'settled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{record.paymentStatus}</span></td><td className="px-3 py-3 font-mono font-semibold">{record.paymentAmount === undefined ? '—' : `₹${record.paymentAmount.toLocaleString('en-IN')}`}</td><td className="px-3 py-3 text-slate-600">{displayDate(record.completionDate)}</td><td className="px-3 py-3 text-slate-600">{displayDate(record.settlementDate)}<div className="mt-0.5 font-mono text-[10px]">{record.paymentReference || ''}</div></td><td className="px-3 py-3">{allowSettlement ? <button onClick={() => onSettle(record)} className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Settle Payment</button> : <span className="text-emerald-700 font-semibold">Settled</span>}</td></tr>)}</tbody></table></div>
  );

  return <div className="space-y-4"><div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"><div><div className="flex items-center gap-2"><IndianRupee className="w-5 h-5 text-emerald-800" /><h2 className="text-base font-bold text-slate-900">Money Settlements</h2></div><p className="mt-0.5 text-xs text-slate-500">Payment settlement is recorded only after the actual payment is made.</p></div><div className="relative w-full sm:w-72"><Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Farmer, appointment, procurement..." className="w-full rounded border border-slate-300 py-1.5 pl-9 pr-3 text-xs focus:ring-1 focus:ring-blue-800" /></div></div><section className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden"><div className="border-b border-slate-200 px-4 py-3"><h3 className="text-sm font-bold text-slate-900">Pending Settlements <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800">{pending.length}</span></h3></div>{table(pending, true)}</section><section className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden"><div className="border-b border-slate-200 px-4 py-3"><h3 className="text-sm font-bold text-slate-900">Settled Payments</h3></div>{table(settled, false)}</section></div>;
};
