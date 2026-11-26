import React from 'react';
import {
  CalendarDays,
  CheckCircle2,
  IndianRupee,
  Scale,
  UserCheck,
} from 'lucide-react';
import type { CenterMetrics } from '../../types/procurement';

interface SummaryMetricsProps {
  metrics: CenterMetrics;
  onFilterByStatus?: (status: string) => void;
}

export const SummaryMetrics: React.FC<SummaryMetricsProps> = ({ metrics, onFilterByStatus }) => {
  const cards = [
    {
      id: 'appointments', title: "Today's Appointments", value: metrics.todayAppointments,
      unit: 'Booked Lots', subtext: metrics.todayAppointments === 0 ? 'No lots booked yet' : 'Scheduled for today',
      trend: metrics.todayAppointments === 0 ? 'Awaiting bookings' : 'Live schedule', icon: CalendarDays,
      iconBg: 'bg-blue-100 text-blue-900 border-blue-200', borderColor: 'border-l-4 border-l-blue-800', statusFilter: 'Booked',
    },
    {
      id: 'checked_in', title: 'Farmers Checked In', value: metrics.checkedIn,
      unit: 'At Mandi Gate',
      subtext: metrics.todayAppointments === 0 ? 'No arrivals yet' : `${Math.round((metrics.checkedIn / metrics.todayAppointments) * 100)}% arrival rate so far`,
      trend: metrics.checkedIn === 0 ? 'Gate ready' : 'Arrival activity', icon: UserCheck,
      iconBg: 'bg-emerald-100 text-emerald-900 border-emerald-200', borderColor: 'border-l-4 border-l-emerald-700', statusFilter: 'Checked In',
    },
    {
      id: 'pending_weighments', title: 'Pending Weighments', value: metrics.pendingWeighments,
      unit: 'In Weigh Queue', subtext: metrics.pendingWeighments === 0 ? 'No lots awaiting weighment' : 'Weighbridge 1 & 2 active',
      trend: metrics.pendingWeighments === 0 ? 'Scales ready' : 'Queue in progress', icon: Scale,
      iconBg: 'bg-amber-100 text-amber-900 border-amber-300', borderColor: 'border-l-4 border-l-amber-600', statusFilter: 'Processing',
    },
    {
      id: 'completed', title: 'Completed Procurements', value: metrics.completedProcurements,
      unit: 'Lots Accepted', subtext: metrics.completedProcurements === 0 ? 'No lots accepted yet' : 'Procurement underway',
      trend: metrics.completedProcurements === 0 ? 'Fresh session' : 'Daily progress', icon: CheckCircle2,
      iconBg: 'bg-teal-100 text-teal-900 border-teal-200', borderColor: 'border-l-4 border-l-teal-700', statusFilter: 'Completed',
    },
    {
      id: 'pending_dbt', title: 'Pending DBT Payments', value: metrics.pendingDbt,
      unit: 'Lots in Pipeline', subtext: `Rs.${metrics.pendingDisbursementLakhs} Lakhs awaiting PFMS`,
      trend: `Rs.${metrics.totalDisbursedAmountLakhs}L cleared`, icon: IndianRupee,
      iconBg: 'bg-indigo-100 text-indigo-900 border-indigo-200', borderColor: 'border-l-4 border-l-indigo-700', statusFilter: 'Completed',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            onClick={() => onFilterByStatus?.(card.statusFilter)}
            className={`bg-white rounded-md border border-slate-200 p-3.5 shadow-xs hover:shadow-md transition-shadow cursor-pointer ${card.borderColor} flex flex-col justify-between`}
            title={`Click to filter queue by ${card.title}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-tight">{card.title}</span>
                <div className={`p-1.5 rounded border ${card.iconBg}`}><Icon className="w-4 h-4" /></div>
              </div>
              <div className="mt-2 flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">{card.value}</span>
                <span className="text-[11px] font-medium text-slate-500">{card.unit}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 truncate" title={card.subtext}>{card.subtext}</span>
              <span className="text-emerald-700 font-medium font-mono text-[10px] shrink-0 ml-1">{card.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
