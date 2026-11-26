import React, { useState } from 'react';
import { Farmer, Appointment, ProcurementTransaction } from '../../types';
import { store } from '../../firebase/unifiedStore';
import { maskMobile, maskFarmerId, formatDateIndian } from '../../utils/formatters';
import { StatusBadge } from '../common/StatusBadge';
import {
  Search,
  UserCheck,
  Phone,
  MapPin,
  Sprout,
  CalendarCheck,
  History,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  Printer,
} from 'lucide-react';

interface FarmerVerificationViewProps {
  onSelectFarmerForBooking?: (farmer: Farmer) => void;
  onViewFarmerStatus?: (farmerId: string) => void;
  onRegisterNewFarmerClick?: () => void;
  onPrintToken?: (appointmentId: string) => void;
}

export const FarmerVerificationView: React.FC<FarmerVerificationViewProps> = ({
  onSelectFarmerForBooking,
  onViewFarmerStatus,
  onRegisterNewFarmerClick,
  onPrintToken,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [activeAppt, setActiveAppt] = useState<Appointment | null>(null);
  const [activeProc, setActiveProc] = useState<ProcurementTransaction | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = searchQuery.trim();
    if (!clean) {
      setError('Please enter an Official Farmer ID, full name, or 10-digit mobile number.');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearched(true);

    try {
      const found = await store.findFarmer(clean);
      setFarmer(found);

      if (found) {
        // Fetch active appointment if any
        if (found.activeAppointmentId) {
          store.subscribeAppointmentById(found.activeAppointmentId, (appt) => {
            setActiveAppt(appt);
          });
        } else {
          setActiveAppt(null);
        }

        // Fetch active procurement if any
        if (found.activeProcurementId) {
          store.subscribeProcurementById(found.activeProcurementId, (proc) => {
            setActiveProc(proc);
          });
        } else {
          setActiveProc(null);
        }
      } else {
        setActiveAppt(null);
        setActiveProc(null);
      }
    } catch (err: any) {
      setError('Error searching central farmer database: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-blue-50 text-gov-navy border border-blue-200">
                <UserCheck className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Farmer Verification & Profile Lookup
              </h2>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              Search permanent centralized farmer records by official Farmer ID, full name, or registered mobile number.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRegisterNewFarmerClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-gov-green hover:bg-gov-greenDark shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Register New Farmer
            </button>
          </div>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="mt-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Farmer ID, full name, or mobile number"
              className="block w-full pl-11 pr-4 py-3 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-gov-navy focus:border-gov-navy shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 bg-gov-navy hover:bg-gov-navyDark text-white text-sm font-bold rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
          >
            {isSearching ? 'Verifying...' : 'Verify Farmer'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-bold">Verification Notice</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Result: Farmer Profile Card */}
      {farmer && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card Top Title Banner */}
          <div className="bg-gradient-to-r from-gov-navy to-slate-800 px-6 py-4 text-white flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg text-emerald-300 border border-white/20">
                {farmer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{farmer.name}</h3>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Permanent Profile Verified
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Village: {farmer.village}, {farmer.district}, {farmer.state}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-300 uppercase tracking-wider font-semibold">
                Permanent Farmer ID
              </div>
              <div className="text-sm font-mono font-bold text-amber-300">
                {farmer.officialFarmerId}
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Personal & Demographic Info */}
            <div className="space-y-4 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Farmer Identity Information
              </h4>

              <div className="space-y-2.5 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Farmer ID (Permanent):</span>
                  <span className="font-mono font-bold text-slate-900">
                    {farmer.officialFarmerId}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    (Masked: {maskFarmerId(farmer.officialFarmerId)})
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Full Name:</span>
                  <span className="font-semibold text-slate-900">{farmer.name}</span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Registered Mobile:</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{maskMobile(farmer.mobileNumber)}</span>
                    <span className="text-xs text-slate-400 font-normal">
                      ({farmer.mobileNumber})
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Residential Address:</span>
                  <div className="flex items-start gap-1.5 text-slate-700 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <span>
                      {farmer.village}, Taluka: {farmer.district}, State: {farmer.state}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-500 block">Preferred Language:</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 uppercase">
                    {farmer.preferredLanguage}
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Registered Crops */}
            <div className="space-y-4 border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-6">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sprout className="w-4 h-4 text-gov-green" />
                  Registered Crop(s)
                </h4>
              </div>

              {farmer.crops && farmer.crops.length > 0 ? (
                <div className="space-y-2.5">
                  {farmer.crops.map((c, i) => (
                    <div
                      key={c.id || i}
                      className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs space-y-1"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-emerald-950 text-sm">{c.cropName}</span>
                        <span className="font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {c.estimatedQuantity} {c.unit}
                        </span>
                      </div>
                      {c.variety && (
                        <div className="text-slate-600">
                          <span className="font-semibold">Variety:</span> {c.variety}
                        </div>
                      )}
                      <div className="text-slate-500 flex justify-between pt-1">
                        <span>Period: {c.harvestPeriod}</span>
                        <span>{formatDateIndian(c.registeredAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200">
                  No crops registered yet. Click &quot;Add Crop&quot; to add procurement details.
                </div>
              )}
            </div>

            {/* Column 3: Current Appointment & Procurement Status */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-blue-600" />
                Current Status & Active Token
              </h4>

              {activeAppt ? (
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                        Today&apos;s Token
                      </span>
                      <div className="text-2xl font-black text-gov-navy tracking-tight">
                        {activeAppt.tokenNumber}
                      </div>
                    </div>
                    <StatusBadge status={activeAppt.status} size="md" />
                  </div>

                  <div className="space-y-1 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-500">Center:</span>{' '}
                      <span className="font-semibold">{activeAppt.centerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Slot:</span>{' '}
                      <span className="font-semibold">
                        {activeAppt.appointmentDate} ({activeAppt.timeSlot})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Appointment ID:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">
                        {activeAppt.id}
                      </span>
                    </div>
                  </div>

                  {activeProc && (
                    <div className="pt-2 border-t border-blue-200/80 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-600 font-semibold">Procurement:</span>
                        <StatusBadge status={activeProc.procurementStatus} size="sm" />
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-600 font-semibold">Payment:</span>
                        <StatusBadge status={activeProc.paymentStatus || 'pending'} size="sm" />
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={() => onPrintToken?.(activeAppt.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded text-xs font-bold text-slate-800 shadow-sm"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      Print Slip
                    </button>
                    <button
                      onClick={() => onViewFarmerStatus?.(farmer.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gov-navy hover:bg-gov-navyDark text-white rounded text-xs font-bold shadow-sm"
                    >
                      Track Live
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <AlertCircle className="w-4 h-4" />
                    <span>No active appointment booked for today.</span>
                  </div>
                  <button
                    onClick={() => onSelectFarmerForBooking?.(farmer)}
                    className="w-full py-2.5 px-3 bg-gov-navy hover:bg-gov-navyDark text-white font-bold rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Book Procurement Slot
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => onViewFarmerStatus?.(farmer.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <History className="w-3.5 h-3.5" />
                  View Full History & Procurement Timeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State: Not Found */}
      {searched && !isSearching && !farmer && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              No Farmer Found with Identifier &quot;{searchQuery}&quot;
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              No matching record found in the central government database. Please check the Farmer ID, full name, or mobile number, or perform a new farmer registration.
            </p>
          </div>
          <div>
            <button
              onClick={onRegisterNewFarmerClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-gov-green hover:bg-gov-greenDark shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Register Farmer Profile Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
