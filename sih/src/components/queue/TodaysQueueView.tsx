import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import { store } from '../../firebase/unifiedStore';
import { StatusBadge } from '../common/StatusBadge';
import {
  ListOrdered,
  Search,
  Filter,
  Radio,
  Printer,
} from 'lucide-react';

interface TodaysQueueViewProps {
  onSelectAppointmentForSlip?: (appointmentId: string) => void;
  onTrackFarmer?: (farmerId: string) => void;
}

export const TodaysQueueView: React.FC<TodaysQueueViewProps> = ({
  onSelectAppointmentForSlip,
  onTrackFarmer,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterText, setFilterText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [pulse, setPulse] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // Real-time listener from Firestore
    const unsub = store.subscribeAppointments((loaded) => {
      setAppointments(loaded);
      setPulse(true);
      setTimeout(() => setPulse(false), 1000);
    }, todayStr);

    return () => unsub();
  }, [todayStr]);

  const filtered = appointments.filter((a) => {
    const matchesQuery =
      a.tokenNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      a.farmerName.toLowerCase().includes(filterText.toLowerCase()) ||
      a.farmerId.toLowerCase().includes(filterText.toLowerCase()) ||
      a.crop.toLowerCase().includes(filterText.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-gov-navy border border-blue-200">
              <ListOrdered className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Today&apos;s Appointments &amp; Live Mandi Queue
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 transition-all ${
                  pulse
                    ? 'bg-emerald-500 text-white scale-105'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                }`}
              >
                <Radio className="w-3 h-3 animate-pulse" />
                Live Feed
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Real-time synchronization with Mandi check-in desks and procurement counters.
          </p>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search by Token, Farmer Name, Crop..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white text-slate-800"
          >
            <option value="ALL">All Statuses ({appointments.length})</option>
            <option value="Booked">Booked</option>
            <option value="Waiting">Waiting</option>
            <option value="Called">Called</option>
            <option value="Processing">Processing</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Real-time Appointments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
              <tr>
                <th scope="col" className="px-5 py-3.5">
                  Token
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Farmer (Permanent Profile)
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Center
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Crop
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Quantity
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Slot Time
                </th>
                <th scope="col" className="px-5 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-5 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.length > 0 ? (
                filtered.map((appt) => (
                  <tr
                    key={appt.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Token */}
                    <td className="px-5 py-4 font-mono font-black text-sm text-gov-navy">
                      <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                        {appt.tokenNumber}
                      </span>
                    </td>

                    {/* Farmer */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {appt.farmerName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {appt.farmerId} • {appt.farmerVillage}
                      </div>
                    </td>

                    {/* Center */}
                    <td className="px-5 py-4 text-slate-700 font-medium max-w-[160px] truncate">
                      {appt.centerName}
                    </td>

                    {/* Crop */}
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      {appt.crop}
                    </td>

                    {/* Quantity */}
                    <td className="px-5 py-4 font-bold text-emerald-800">
                      {appt.quantity} {appt.unit}
                    </td>

                    {/* Time */}
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {appt.timeSlot}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={appt.status} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectAppointmentForSlip?.(appt.id)}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-semibold text-slate-700 flex items-center gap-1"
                          title="Print Token Slip"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                          Slip
                        </button>
                        <button
                          onClick={() => onTrackFarmer?.(appt.farmerId)}
                          className="px-2.5 py-1 bg-gov-navy hover:bg-gov-navyDark text-white rounded font-semibold flex items-center gap-1"
                          title="Track Real-Time Status"
                        >
                          Track
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No appointments matching criteria for today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
