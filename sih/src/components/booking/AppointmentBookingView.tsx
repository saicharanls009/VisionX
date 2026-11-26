import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Farmer, ProcurementCenter, Appointment } from '../../types';
import { store } from '../../firebase/unifiedStore';
import { generateAppointmentId, generateQueueToken, generateProcurementId } from '../../utils/tokenGenerator';
import { StatusBadge } from '../common/StatusBadge';
import {
  Calendar,
  AlertCircle,
  Search,
  Timer,
  ShieldCheck,
  Printer,
} from 'lucide-react';

interface AppointmentBookingViewProps {
  initialFarmer?: Farmer | null;
  onBookingSuccess?: (appointment: Appointment) => void;
  onViewTokenReceipt?: (appointmentId: string) => void;
}

const TIME_SLOTS = [
  '08:30 AM - 09:00 AM',
  '09:00 AM - 09:30 AM',
  '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM',
  '10:30 AM - 11:00 AM',
  '11:00 AM - 11:30 AM',
  '11:30 AM - 12:00 PM',
  '12:00 PM - 12:30 PM',
  '02:00 PM - 02:30 PM',
  '02:30 PM - 03:00 PM',
  '03:00 PM - 03:30 PM',
  '03:30 PM - 04:00 PM',
];

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSlotStartMinutes = (slot: string): number => {
  const [startTime, period] = slot.split(' - ')[0].split(' ');
  const [hourText, minuteText] = startTime.split(':');
  let hour = Number(hourText);

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return hour * 60 + Number(minuteText);
};

const isTimeSlotUnavailable = (date: string, slot: string, now: Date): boolean => {
  if (date !== formatLocalDate(now)) return false;
  return getSlotStartMinutes(slot) <= now.getHours() * 60 + now.getMinutes();
};

export const AppointmentBookingView: React.FC<AppointmentBookingViewProps> = ({
  initialFarmer,
  onBookingSuccess,
  onViewTokenReceipt,
}) => {
  const { session } = useAuth();

  // Farmer Selection
  const [farmer, setFarmer] = useState<Farmer | null>(initialFarmer || null);
  const [searchQuery, setSearchQuery] = useState<string>(initialFarmer?.officialFarmerId || 'DEMO-FARMER-001');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [farmerError, setFarmerError] = useState<string | null>(null);

  // Selected Crop
  const [selectedCropIndex, setSelectedCropIndex] = useState<number>(0);

  // Centers fetched via real-time listener from Firestore
  const [centers, setCenters] = useState<ProcurementCenter[]>([]);
  const [selectedCenterId, setSelectedCenterId] = useState<string>('');

  // Date and Time Slot
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const todayStr = formatLocalDate(currentTime);
  const [appointmentDate, setAppointmentDate] = useState<string>(todayStr);
  const [timeSlot, setTimeSlot] = useState<string>('10:30 AM - 11:00 AM');

  // Booking Execution State
  const [isBooking, setIsBooking] = useState<boolean>(false);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);

  // Subscribe to Procurement Centers from Firestore
  useEffect(() => {
    const unsub = store.subscribeProcurementCenters((loadedCenters) => {
      setCenters(loadedCenters);
      setSelectedCenterId((currentCenterId) =>
        loadedCenters.some((center) => center.id === currentCenterId)
          ? currentCenterId
          : (loadedCenters[0]?.id ?? '')
      );
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (initialFarmer) {
      setFarmer(initialFarmer);
      setSearchQuery(initialFarmer.officialFarmerId);
    }
  }, [initialFarmer]);

  useEffect(() => {
    const intervalId = window.setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (timeSlot && isTimeSlotUnavailable(appointmentDate, timeSlot, currentTime)) {
      const nextAvailableSlot = TIME_SLOTS.find(
        (slot) => !isTimeSlotUnavailable(appointmentDate, slot, currentTime)
      );
      setTimeSlot(nextAvailableSlot ?? '');
    }
  }, [appointmentDate, currentTime, timeSlot]);

  useEffect(() => {
    if (confirmedAppt) {
      confirmationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [confirmedAppt]);

  const handleSearchFarmer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setFarmerError(null);
    try {
      const found = await store.findFarmer(searchQuery.trim());
      if (found) {
        setFarmer(found);
      } else {
        setFarmerError('No registered farmer found with the provided ID, name, or mobile number: ' + searchQuery);
      }
    } catch (err: any) {
      setFarmerError('Error: ' + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!farmer) {
      setBookingError('Please search and verify a farmer before booking.');
      return;
    }
    const center = centers.find((c) => c.id === selectedCenterId);
    if (!center) {
      setBookingError('Please select a valid procurement center.');
      return;
    }
    const procurementCenterId = center.id?.trim();
    if (!procurementCenterId) {
      setBookingError('Selected procurement center is missing its Firestore ID. Please select another center.');
      return;
    }
    if (center.status === 'Full') {
      setBookingError('Selected center has reached daily capacity. Please choose another center.');
      return;
    }
    if (!timeSlot || isTimeSlotUnavailable(appointmentDate, timeSlot, new Date())) {
      setBookingError('The selected time slot is no longer available. Please choose a future time slot.');
      return;
    }

    const cropObj = farmer.crops && farmer.crops.length > 0 ? farmer.crops[selectedCropIndex] : null;
    const cropName = cropObj ? cropObj.cropName : 'Rice';
    const quantity = cropObj ? cropObj.estimatedQuantity : 500;
    const unit = cropObj ? cropObj.unit : 'kg';

    setIsBooking(true);
    setBookingError(null);

    try {
      // 1. Generate IDs using disambiguated rules
      const appointmentId = generateAppointmentId(); // e.g. APT-2026-00045
      const tokenNumber = generateQueueToken(center.code, center.currentQueue + 1); // e.g. B-024
      const procurementId = generateProcurementId(appointmentId); // e.g. PROC-2026-00045

      const now = new Date().toISOString();

      const newAppointment: Appointment = {
        id: appointmentId,
        tokenNumber,
        farmerId: farmer.id, // Firebase Auth UID in configured mode
        farmerName: farmer.name,
        farmerMobile: farmer.mobileNumber,
        farmerVillage: farmer.village,
        centerId: procurementCenterId,
        centerName: center.name,
        crop: cropName,
        quantity,
        unit,
        appointmentDate,
        timeSlot,
        bookedByCenterId: session?.centerId || 'OC-001',
        status: 'Pending',
        statusHistory: [
          {
            status: 'Pending',
            updatedAt: now,
            updatedBy: `Operator (${session?.operatorName || 'Assisted Portal'})`,
            notes: `Procurement appointment submitted for officer verification.`,
          },
        ],
        procurementId,
        createdAt: now,
        updatedAt: now,
      };

      // 2. Commit to centralized Firestore
      await store.createAppointment(newAppointment);

      setConfirmedAppt(newAppointment);
      onBookingSuccess?.(newAppointment);
    } catch (err: any) {
      setBookingError('Booking failure: ' + err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const selectedCenter = centers.find((c) => c.id === selectedCenterId);
  const noAvailableTimeSlots = !TIME_SLOTS.some(
    (slot) => !isTimeSlotUnavailable(appointmentDate, slot, currentTime)
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-gov-navy border border-blue-200">
              <Calendar className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Assisted Procurement Appointment Booking
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Reserve verified procurement slots and allocate official queue tokens at Mandi centers.
          </p>
        </div>
      </div>

      {/* Booking Confirmation Receipt Alert */}
      {confirmedAppt && (
        <div ref={confirmationRef} className="booking-confirmation-enter p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-500 rounded-xl shadow-md space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xl shadow">
                ✓
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-950">
                  Appointment Confirmed & Token Generated!
                </h3>
                <p className="text-xs text-emerald-800">
                  Transaction stored in centralized database. Token ready to be printed or SMS dispatched.
                </p>
              </div>
            </div>

            <div className="text-right bg-white px-4 py-2 rounded-lg border border-emerald-300 shadow-sm">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Assigned Queue Token
              </span>
              <div className="text-3xl font-black text-gov-navy tracking-tight">
                {confirmedAppt.tokenNumber}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/80 p-3.5 rounded-lg border border-emerald-200">
            <div>
              <span className="text-slate-500 block">Farmer ID (Permanent):</span>
              <span className="font-mono font-bold text-slate-900">{confirmedAppt.farmerId}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Appointment ID:</span>
              <span className="font-mono font-bold text-blue-700">{confirmedAppt.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Procurement Center:</span>
              <span className="font-semibold text-slate-900">{confirmedAppt.centerName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Scheduled Time:</span>
              <span className="font-semibold text-slate-900">
                {confirmedAppt.appointmentDate} ({confirmedAppt.timeSlot})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onViewTokenReceipt?.(confirmedAppt.id)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-bold rounded-lg shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Appointment Slip</span>
            </button>
            <button
              onClick={() => setConfirmedAppt(null)}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg"
            >
              Book Another Appointment
            </button>
          </div>
        </div>
      )}

      {bookingError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-sm text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-bold">Booking Warning</div>
            <div>{bookingError}</div>
          </div>
        </div>
      )}

      {/* Main Wizard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Farmer & Slot Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Farmer & Crop Selector */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gov-navy text-white text-[11px] flex items-center justify-center font-bold">1</span>
                Verified Farmer Profile & Crop
              </h3>
              {farmer && (
                <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Farmer Verified
                </span>
              )}
            </div>

            {!farmer ? (
              <form onSubmit={handleSearchFarmer} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter Farmer ID, full name, or mobile number"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2 bg-gov-navy text-white text-xs font-bold rounded-lg hover:bg-gov-navyDark"
                >
                  {isSearching ? 'Verifying...' : 'Load Profile'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-start bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{farmer.name}</span>
                    <div className="text-slate-500 mt-0.5">
                      Village: {farmer.village}, {farmer.district} • Mobile: {farmer.mobileNumber}
                    </div>
                    <div className="text-slate-600 mt-1">
                      Permanent ID: <span className="font-mono font-bold">{farmer.officialFarmerId}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setFarmer(null)}
                    className="text-gov-navy hover:underline font-bold text-xs"
                  >
                    Change Farmer
                  </button>
                </div>

                {/* Crop Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Select Crop for Procurement Slot:
                  </label>
                  {farmer.crops && farmer.crops.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {farmer.crops.map((c, i) => (
                        <div
                          key={c.id || i}
                          onClick={() => setSelectedCropIndex(i)}
                          className={`cursor-pointer p-3 rounded-lg border text-xs transition-all ${
                            selectedCropIndex === i
                              ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-slate-900">{c.cropName}</span>
                            <span className="text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              {c.estimatedQuantity} {c.unit}
                            </span>
                          </div>
                          {c.variety && (
                            <div className="text-slate-500 mt-1">Variety: {c.variety}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                      No crops registered for this farmer. Please add a crop first.
                    </p>
                  )}
                </div>
              </div>
            )}

            {farmerError && (
              <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded border border-rose-200">
                {farmerError}
              </div>
            )}
          </div>

          {/* 2. Procurement Centers Selection (Dynamic Firestore Data) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gov-navy text-white text-[11px] flex items-center justify-center font-bold">2</span>
                Available Procurement Centers (Dynamic Firestore Feeds)
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Live queue & wait times updated automatically
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {centers.map((center) => {
                const isSelected = selectedCenterId === center.id;
                const utilizationPct = Math.round(
                  ((center.dailyCapacity - center.availableSlots) / center.dailyCapacity) * 100
                );

                return (
                  <div
                    key={center.id}
                    onClick={() => setSelectedCenterId(center.id)}
                    className={`cursor-pointer rounded-xl p-4 border transition-all ${
                      isSelected
                        ? 'border-gov-navy bg-blue-50/40 ring-2 ring-gov-navy/20 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                            isSelected
                              ? 'bg-gov-navy text-white shadow-sm'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {center.code}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {center.name}
                            </span>
                            <StatusBadge status={center.status} size="sm" />
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Distance: <span className="font-semibold">{center.distanceKm} km</span> • District: {center.district}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Current Queue</span>
                        <span className="text-base font-black text-slate-900">
                          {center.currentQueue} Farmers
                        </span>
                      </div>
                    </div>

                    {/* Metrics Bar */}
                    <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Daily Capacity:</span>
                        <span className="font-bold text-slate-800">{center.dailyCapacity}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Available Slots:</span>
                        <span className="font-bold text-emerald-700">{center.availableSlots} left</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Expected Wait:</span>
                        <span className="font-bold text-amber-700 flex items-center gap-1">
                          <Timer className="w-3 h-3" />
                          {center.expectedWaitMinutes} mins
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Utilization:</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                utilizationPct > 85
                                  ? 'bg-rose-500'
                                  : utilizationPct > 60
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, utilizationPct)}%` }}
                            ></div>
                          </div>
                          <span className="font-semibold text-[11px] text-slate-700">{utilizationPct}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Date & Time Slot Picker */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-gov-navy text-white text-[11px] flex items-center justify-center font-bold">3</span>
                Select Appointment Date & Time Slot
              </h3>
            </div>

            <div className="space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Procurement Date *
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  min={todayStr}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 bg-white"
                />
              </div>

              {/* Time Slots Grid */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Time Slot *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isSelected = timeSlot === slot;
                    const isUnavailable = isTimeSlotUnavailable(appointmentDate, slot, currentTime);
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isUnavailable}
                        onClick={() => setTimeSlot(slot)}
                        title={isUnavailable ? 'This time slot has already started.' : undefined}
                        className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${
                          isUnavailable
                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-gov-navy text-white border-gov-navy shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {noAvailableTimeSlots && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    No appointment slots remain for today. Please select a future date.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Booking Summary & Confirmation */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5 sticky top-24">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-200">
              Booking Confirmation Summary
            </h3>

            {confirmedAppt && (
              <div className="booking-token-pop rounded-lg border-2 border-emerald-500 bg-emerald-50 p-4 text-center" aria-live="polite">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">Appointment Confirmed</div>
                <div className="mt-1 text-[11px] font-medium text-emerald-700">Your queue token</div>
                <div className="mt-1 font-mono text-4xl font-black text-gov-navy">{confirmedAppt.tokenNumber}</div>
                <div className="mt-2 text-xs text-emerald-800">{confirmedAppt.appointmentDate} | {confirmedAppt.timeSlot}</div>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Farmer:</span>
                <span className="font-bold text-slate-900 text-right">
                  {farmer ? farmer.name : 'Not selected'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Official Farmer ID:</span>
                <span className="font-mono font-bold text-slate-900 text-right">
                  {farmer ? farmer.officialFarmerId : '—'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Selected Commodity:</span>
                <span className="font-semibold text-slate-900 text-right">
                  {farmer && farmer.crops?.[selectedCropIndex]
                    ? `${farmer.crops[selectedCropIndex].cropName} (${farmer.crops[selectedCropIndex].estimatedQuantity} ${farmer.crops[selectedCropIndex].unit})`
                    : 'Rice (500 kg)'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Center:</span>
                <span className="font-semibold text-gov-navy text-right">
                  {selectedCenter ? selectedCenter.name : 'Select Center'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Appointment Date:</span>
                <span className="font-semibold text-slate-900 text-right">{appointmentDate}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Time Slot:</span>
                <span className="font-semibold text-slate-900 text-right">{timeSlot || 'No slot available'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Booking Center (CSC):</span>
                <span className="font-semibold text-slate-700 text-right">
                  {session?.centerId} ({session?.centerName})
                </span>
              </div>
            </div>

            {/* Generated ID Disambiguation Advisory */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-[11px] text-blue-900 space-y-1">
              <div className="font-bold flex items-center gap-1 text-blue-950">
                <ShieldCheck className="w-3.5 h-3.5 text-gov-navy" />
                Permanent Profile Integrity:
              </div>
              <div>Farmer keeps their permanent ID. An individual unique <strong>Appointment ID</strong> &amp; daily <strong>Queue Token</strong> will be generated.</div>
            </div>

            {confirmedAppt ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => onViewTokenReceipt?.(confirmedAppt.id)}
                  className="w-full py-3 px-4 bg-gov-navy hover:bg-gov-navyDark text-white text-sm font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Token Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmedAppt(null)}
                  className="w-full py-2.5 px-4 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-colors"
                >
                  Book Another Appointment
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isBooking || !farmer || !timeSlot || noAvailableTimeSlots}
                onClick={handleConfirmBooking}
                className="w-full py-3.5 px-4 bg-gov-navy hover:bg-gov-navyDark text-white text-sm font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isBooking ? (
                  <span>Confirming Appointment...</span>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span>Confirm &amp; Generate Token</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
