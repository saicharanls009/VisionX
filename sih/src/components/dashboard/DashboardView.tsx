import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Appointment, DailyStatistics } from '../../types';
import { store } from '../../firebase/unifiedStore';
import { StatusBadge } from '../common/StatusBadge';
import {
  Users,
  UserPlus,
  CalendarCheck,
  Clock,
  CheckCircle2,
  Search,
  Printer,
  Activity,
  ArrowRight,
  ShieldCheck,
  Radio,
  Building2,
} from 'lucide-react';
import { NavTab } from '../common/Sidebar';

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onSelectAppointmentForSlip?: (appointmentId: string) => void;
  onTrackFarmer?: (farmerId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onSelectAppointmentForSlip,
  onTrackFarmer,
}) => {
  const { session } = useAuth();
  const { t } = useLanguage();

  const todayStr = new Date().toISOString().split('T')[0];
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<DailyStatistics>(() => store.getDailyStatistics(todayStr));
  const [livePulse, setLivePulse] = useState<boolean>(false);

  useEffect(() => {
    const unsub = store.subscribeAppointments((list) => {
      setAppointments(list);
      const dailyStats = store.getDailyStatistics(todayStr);
      const appointmentsScheduledToday = list.filter(
        (appointment) => appointment.appointmentDate === todayStr
      );
      setStats({
        ...dailyStats,
        appointmentsBooked: appointmentsScheduledToday.length,
        pendingRequests: appointmentsScheduledToday.filter(
          (appointment) =>
            appointment.status === 'Pending' ||
            appointment.status === 'Booked' ||
            appointment.status === 'Checked In' ||
            appointment.status === 'Waiting'
        ).length,
        completedRequests: appointmentsScheduledToday.filter((appointment) => appointment.status === 'Completed').length,
      });
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 900);
    });

    return () => unsub();
  }, [todayStr]);

  const todaysAppointments = appointments.filter((appointment) => appointment.appointmentDate === todayStr);
  const pendingAppointments = todaysAppointments.filter(
    (a) => a.status === 'Pending' || a.status === 'Booked' || a.status === 'Checked In' || a.status === 'Waiting' || a.status === 'Called'
  );

  return (
    <div className="space-y-8">
      {/* Welcome & Center Identity Banner */}
      <div className="bg-gradient-to-r from-gov-navy to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        {/* Background watermark badge */}
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <img src="/emblem.svg" alt="" className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Authorized Assistant Desk</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Assistant Dashboard
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <strong>{session?.centerId}</strong>: {session?.centerName}
              </span>
              <span>•</span>
              <span>Signed in as {session?.operatorName || 'Assistant'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs">
            <Radio className={`w-3.5 h-3.5 ${livePulse ? 'text-emerald-400 animate-ping' : 'text-emerald-400 animate-pulse'}`} />
            <span className="font-semibold text-white">Central Firestore Live</span>
          </div>
        </div>
      </div>

      {/* Today's Statistics Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Today&apos;s Assistance Statistics
          </h3>
          <span className="text-xs text-slate-400">
            Date: <strong className="text-slate-700">{todayStr}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Farmers Assisted */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t('farmersAssisted')}</span>
              <Users className="w-4 h-4 text-gov-navy" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.farmersAssisted}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Permanent profiles serviced</p>
          </div>

          {/* New Registrations */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t('newRegistrations')}</span>
              <UserPlus className="w-4 h-4 text-gov-green" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.newRegistrations}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Assisted registrations today</p>
          </div>

          {/* Appointments Booked */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t('appointmentsBooked')}</span>
              <CalendarCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">{stats.appointmentsBooked}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Slots confirmed at Mandis</p>
          </div>

          {/* Pending Requests */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t('pendingRequests')}</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-extrabold text-amber-700">{stats.pendingRequests}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting weighing &amp; check</p>
          </div>

          {/* Completed Requests */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase">{t('completedRequests')}</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700">{stats.completedRequests}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">DBT payments approved</p>
          </div>
        </div>
      </div>

      <section aria-label="Assistant actions">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assistant Actions</h3>
          <span className="text-xs text-slate-400">Start a farmer service task</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { tab: 'farmers' as NavTab, label: 'Find farmer', detail: 'Search profile or mobile', icon: Search, tone: 'text-gov-navy bg-blue-50 border-blue-100' },
            { tab: 'register-farmer' as NavTab, label: 'Register farmer', detail: 'Create a permanent profile', icon: UserPlus, tone: 'text-gov-green bg-emerald-50 border-emerald-100' },
            { tab: 'booking' as NavTab, label: 'Schedule visit', detail: 'Book a Mandi appointment', icon: CalendarCheck, tone: 'text-amber-700 bg-amber-50 border-amber-100' },
            { tab: 'status' as NavTab, label: 'Track status', detail: 'Follow intake and payment', icon: Activity, tone: 'text-violet-700 bg-violet-50 border-violet-100' },
          ].map(({ tab, label, detail, icon: Icon, tone }) => (
            <button
              key={tab}
              type="button"
              onClick={() => onNavigate(tab)}
              className="group flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3.5 text-left shadow-sm hover:border-slate-300 hover:shadow transition-all"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-slate-900">{label}</span>
                <span className="block truncate text-[11px] text-slate-500">{detail}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Split Section: Today's Appointments Preview & Pending Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Today's Appointments Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Today&apos;s Appointments
              </h3>
              <p className="text-xs text-slate-500">Live feed from central Mandi schedule</p>
            </div>
            <button
              onClick={() => onNavigate('queue')}
              className="text-xs font-bold text-gov-navy hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Token</th>
                  <th className="px-4 py-3">Farmer</th>
                  <th className="px-4 py-3">Crop</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {todaysAppointments.slice(0, 5).map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-gov-navy text-xs">
                      {appt.tokenNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{appt.farmerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{appt.farmerId}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {appt.crop} ({appt.quantity} {appt.unit})
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {appt.timeSlot}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appt.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onSelectAppointmentForSlip?.(appt.id)}
                        className="text-slate-600 hover:text-slate-900 font-semibold text-[11px] p-1 rounded hover:bg-slate-100"
                        title="View Slip"
                      >
                        Slip
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Column: Pending Requests & Recent Farmer Activity */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pending Queue Activity ({pendingAppointments.length})
            </h3>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          </div>

          <div className="space-y-3">
            {pendingAppointments.map((item) => (
              <div
                key={item.id}
                onClick={() => onTrackFarmer?.(item.farmerId)}
                className="cursor-pointer p-3 rounded-lg border border-slate-200 hover:border-gov-navy hover:bg-slate-50/60 transition-all text-xs space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gov-navy font-mono">
                    Token {item.tokenNumber}
                  </span>
                  <StatusBadge status={item.status} size="sm" />
                </div>
                <div className="font-semibold text-slate-900">{item.farmerName}</div>
                <div className="text-slate-500 text-[11px] flex justify-between">
                  <span>{item.crop} • {item.quantity} {item.unit}</span>
                  <span className="font-mono">{item.timeSlot.split(' - ')[0]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => onNavigate('status')}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Track All Live Mandi Statuses</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
