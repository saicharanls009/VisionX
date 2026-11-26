import React, { useState, useEffect, useCallback } from 'react';
import { Farmer, Appointment, ProcurementTransaction } from '../../types';
import { store } from '../../firebase/unifiedStore';
import { maskMobile, formatDateTimeIndian, formatCurrencyINR } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import {
  Activity,
  Search,
  Clock,
  Radio,
  Scale,
  CreditCard,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

interface FarmerStatusViewProps {
  initialFarmerId?: string;
}

const APPOINTMENT_STAGES = [
  'Pending',
  'Booked',
  'Checked In',
  'Waiting',
  'Called',
  'Processing',
  'Completed',
];

const PROCUREMENT_STAGES = [
  'Pending',
  'Verification',
  'Crop Verified',
  'Weighing',
  'Quality Check',
  'Approved',
  'Completed',
];

const PAYMENT_STAGES = ['Pending', 'Settled'];

export const FarmerStatusView: React.FC<FarmerStatusViewProps> = ({
  initialFarmerId,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>(initialFarmerId || '');
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [procurement, setProcurement] = useState<ProcurementTransaction | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [livePulse, setLivePulse] = useState<boolean>(false);

  const triggerPulse = useCallback(() => {
    setLivePulse(true);
    setTimeout(() => setLivePulse(false), 1200);
  }, []);

  const searchFarmer = useCallback(async (identifier: string) => {
    const clean = identifier.trim();
    if (!clean) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const found = await store.findFarmer(clean);
      if (found) {
        setFarmer(found);
      } else {
        setFarmer(null);
        setAppointment(null);
        setProcurement(null);
        setSearchError('No farmer found with ID or Mobile: ' + clean);
      }
    } catch (err: any) {
      setSearchError('Search failed: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Search farmer
  const handleSearch = (e?: React.FormEvent, customId?: string) => {
    if (e) e.preventDefault();
    searchFarmer(customId || searchQuery);
  };

  useEffect(() => {
    if (initialFarmerId) {
      setSearchQuery(initialFarmerId);
      searchFarmer(initialFarmerId);
    }
  }, [initialFarmerId, searchFarmer]);

  // Real-Time Listeners via onSnapshot
  useEffect(() => {
    if (!farmer) return;

    let unsubAppt: (() => void) | undefined;
    let unsubProc: (() => void) | undefined;

    if (farmer.activeAppointmentId) {
      unsubAppt = store.subscribeAppointmentById(farmer.activeAppointmentId, (appt) => {
        setAppointment(appt);
        triggerPulse();
      });
    } else {
      setAppointment(null);
    }

    if (farmer.activeProcurementId) {
      unsubProc = store.subscribeProcurementById(farmer.activeProcurementId, (proc) => {
        setProcurement(proc);
        triggerPulse();
      });
    } else {
      setProcurement(null);
    }

    return () => {
      unsubAppt?.();
      unsubProc?.();
    };
  }, [farmer, triggerPulse]);

  const getStageIndex = (stages: string[], currentStatus: string) => {
    const idx = stages.indexOf(currentStatus);
    return idx >= 0 ? idx : 0;
  };

  const apptIndex = appointment ? getStageIndex(APPOINTMENT_STAGES, appointment.status) : -1;
  const procurementStatus = procurement?.procurementStatus || 'pending';
  const paymentStatus = procurement?.paymentStatus || 'pending';
  const procIndex = procurement
    ? getStageIndex(PROCUREMENT_STAGES, procurementStatus === 'completed' ? 'Completed' : procurementStatus)
    : -1;
  const payIndex = procurement
    ? getStageIndex(PAYMENT_STAGES, paymentStatus === 'settled' ? 'Settled' : 'Pending')
    : -1;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-gov-navy border border-blue-200">
              <Activity className="w-5 h-5" />
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">
                Real-Time Farmer Status &amp; Mandi Queue Tracker
              </h2>
              {/* Real-time listener pulse badge */}
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 transition-all ${
                  livePulse
                    ? 'bg-emerald-500 text-white scale-105 shadow-md'
                    : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                }`}
              >
                <Radio className={`w-3 h-3 ${livePulse ? 'animate-spin' : 'animate-pulse'}`} />
                <span>{livePulse ? 'Syncing...' : 'Live Firestore Sync'}</span>
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Assistant view of queue calls, weighbridge measurements, and DBT disbursements.
          </p>
        </div>

      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-3 max-w-3xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Farmer ID (e.g. FID-BHARAT-3210) or Mobile"
              className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-bold rounded-lg shadow-sm"
          >
            {isSearching ? 'Searching...' : 'Track Farmer'}
          </button>
        </form>

        {searchError && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Main Status Display */}
      {farmer && (
        <div className="space-y-6">
          {/* Farmer Overview Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gov-navy text-white flex items-center justify-center font-bold text-xl">
                {farmer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{farmer.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Permanent Profile
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Permanent Farmer ID: <span className="font-mono font-bold text-slate-900">{farmer.officialFarmerId}</span> • Mobile: {maskMobile(farmer.mobileNumber)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Village: {farmer.village}, Taluka: {farmer.district}, {farmer.state}
                </div>
              </div>
            </div>

            {/* Token Badge */}
            {appointment ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl px-4 py-3 text-center min-w-[140px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                  Today&apos;s Active Token
                </span>
                <span className="text-3xl font-black text-gov-navy font-mono block">
                  {appointment.tokenNumber}
                </span>
                <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">
                  {appointment.centerName}
                </span>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-500">
                No active token for today.
              </div>
            )}
          </div>

          {procurement && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Procurement Status</span>
                <div className="mt-2"><StatusBadge status={procurementStatus} size="md" /></div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Status</span>
                <div className="mt-2"><StatusBadge status={paymentStatus} size="md" /></div>
              </div>
            </div>
          )}

          {/* Timeline Section: 3 Progress Tracks */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-8">
            {/* Track 1: Appointment Lifecycle */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gov-navy" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Track 1: Appointment &amp; Queue Status
                  </h4>
                </div>
                {appointment && <StatusBadge status={appointment.status} size="sm" />}
              </div>

              {appointment ? (
                <div className="mt-5">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0"></div>
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gov-navy z-0 transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          0,
                          (apptIndex / (APPOINTMENT_STAGES.length - 1)) * 100
                        )}%`,
                      }}
                    ></div>

                    {APPOINTMENT_STAGES.map((stage, idx) => {
                      const isPast = idx < apptIndex;
                      const isCurrent = idx === apptIndex;
                      return (
                        <div key={stage} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-gov-navy text-white ring-4 ring-blue-100 scale-110 shadow'
                                : isPast
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border-2 border-slate-300 text-slate-400'
                            }`}
                          >
                            {isPast ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] mt-2 font-semibold text-center whitespace-nowrap ${
                              isCurrent
                                ? 'text-gov-navy font-bold'
                                : isPast
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic mt-3">
                  No active appointment records to track.
                </p>
              )}
            </div>

            {/* Track 2: Physical Procurement (Verification, Weighing, Quality Check, Approval) */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-gov-green" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Track 2: Physical Procurement &amp; Weighing Status
                  </h4>
                </div>
                {procurement && (
                  <StatusBadge status={procurementStatus} size="sm" />
                )}
              </div>

              {procurement ? (
                <div className="mt-5">
                  <div className="relative flex items-center justify-between">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0"></div>
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gov-green z-0 transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          0,
                          (procIndex / (PROCUREMENT_STAGES.length - 1)) * 100
                        )}%`,
                      }}
                    ></div>

                    {PROCUREMENT_STAGES.map((stage, idx) => {
                      const isPast = idx < procIndex;
                      const isCurrent = idx === procIndex;
                      return (
                        <div key={stage} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-gov-green text-white ring-4 ring-emerald-100 scale-110 shadow'
                                : isPast
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border-2 border-slate-300 text-slate-400'
                            }`}
                          >
                            {isPast ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] mt-2 font-semibold text-center whitespace-nowrap ${
                              isCurrent
                                ? 'text-gov-green font-bold'
                                : isPast
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Weighment & Quality Data Card if Available */}
                  {(procurement.grossWeightKg || procurement.qualityGrade) && (
                    <div className="mt-6 bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Net Weight:</span>
                        <span className="text-sm font-bold text-slate-900">
                          {procurement.netWeightKg || procurement.grossWeightKg} kg
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Moisture %:</span>
                        <span className="text-sm font-bold text-slate-900">
                          {procurement.moisturePercentage || '12.4'}%
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Quality Grade:</span>
                        <span className="text-sm font-bold text-emerald-800">
                          {procurement.qualityGrade || 'Grade A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Payout Amount:</span>
                        <span className="text-sm font-bold text-gov-navy">
                          {formatCurrencyINR(procurement.totalAmount || 11600)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic mt-3">
                  Physical intake not started yet at the Mandi.
                </p>
              )}
            </div>

            {/* Track 3: Payment (DBT Transfer) */}
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gov-saffron" />
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Track 3: Direct Benefit Transfer (DBT) Payment
                  </h4>
                </div>
                {procurement && <StatusBadge status={paymentStatus} size="sm" />}
              </div>

              {procurement ? (
                <div className="mt-5">
                  <div className="relative flex items-center justify-between max-w-md mx-auto">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0"></div>
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gov-saffron z-0 transition-all duration-500"
                      style={{
                        width: `${Math.max(
                          0,
                          (payIndex / (PAYMENT_STAGES.length - 1)) * 100
                        )}%`,
                      }}
                    ></div>

                    {PAYMENT_STAGES.map((stage, idx) => {
                      const isPast = idx < payIndex;
                      const isCurrent = idx === payIndex;
                      return (
                        <div key={stage} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                              isCurrent
                                ? 'bg-gov-saffron text-white ring-4 ring-orange-100 scale-110 shadow'
                                : isPast
                                ? 'bg-emerald-600 text-white'
                                : 'bg-white border-2 border-slate-300 text-slate-400'
                            }`}
                          >
                            {isPast ? '✓' : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] mt-2 font-semibold text-center whitespace-nowrap ${
                              isCurrent
                                ? 'text-gov-saffron font-bold'
                                : isPast
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}
                          >
                            {stage}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {procurement.paymentReference && (
                    <div className="mt-4 text-center text-xs text-slate-600">
                      PFMS Reference: <span className="font-mono font-bold text-emerald-800">{procurement.paymentReference}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic mt-3">
                  Payment will initiate upon procurement approval.
                </p>
              )}
            </div>
          </div>

          {/* Audit Trail & Status History Log */}
          {appointment && appointment.statusHistory && appointment.statusHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Real-Time Event Log
              </h4>
              <div className="space-y-3">
                {appointment.statusHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-gov-navy mt-1.5 flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          Status updated to: <span className="text-gov-navy font-semibold">{item.status}</span>
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {formatDateTimeIndian(item.updatedAt)}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-0.5">
                        Action performed by: <span className="font-semibold">{item.updatedBy}</span>
                      </div>
                      {item.notes && (
                        <div className="text-slate-500 mt-0.5 italic">&quot;{item.notes}&quot;</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
