import React, { useState, useEffect } from 'react';
import { Appointment } from '../../types';
import { store } from '../../firebase/unifiedStore';
import { maskFarmerId, formatDateIndian } from '../../utils/formatters';
import {
  Printer,
  Download,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Phone,
} from 'lucide-react';

interface PrintableTokenViewProps {
  initialAppointmentId?: string;
  onDone?: () => void;
}

export const PrintableTokenView: React.FC<PrintableTokenViewProps> = ({
  initialAppointmentId,
}) => {
  const [appointmentId, setAppointmentId] = useState<string>(
    initialAppointmentId || 'APT-2026-00045'
  );
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>(
    initialAppointmentId || 'APT-2026-00045'
  );

  // SMS Simulation State
  const [showSmsModal, setShowSmsModal] = useState<boolean>(false);
  const [smsSentNotice, setSmsSentNotice] = useState<boolean>(false);

  useEffect(() => {
    if (appointmentId) {
      const unsub = store.subscribeAppointmentById(appointmentId, (appt) => {
        setAppointment(appt);
      });
      return () => unsub();
    }
  }, [appointmentId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setAppointmentId(searchQuery.trim().toUpperCase());
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handleSendSimulatedSms = () => {
    setSmsSentNotice(true);
    setTimeout(() => {
      setShowSmsModal(false);
      setSmsSentNotice(false);
    }, 2800);
  };

  return (
    <div className="space-y-6">
      {/* Search Header for Token Slip */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm no-print flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-50 text-gov-navy border border-blue-200">
              <Printer className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900">
              Official Procurement Token &amp; Receipt Generator
            </h2>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Print thermal slip, generate PDF or dispatch SMS for assisted non-smartphone farmers.
          </p>
        </div>

        {/* Search Appt */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. APT-2026-00045"
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono font-bold w-48"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-gov-navy hover:bg-gov-navyDark text-white text-xs font-bold rounded-lg"
          >
            Load Slip
          </button>
        </form>
      </div>

      {/* Main Print Container */}
      {appointment ? (
        <div className="max-w-xl mx-auto space-y-6">
          {/* Action Toolbar */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-center gap-3 flex-wrap no-print">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-gov-navy hover:bg-gov-navyDark text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              [ Print Appointment ]
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              [ Download / Save PDF ]
            </button>
            <button
              onClick={() => setShowSmsModal(true)}
              className="px-4 py-2.5 bg-gov-green hover:bg-gov-greenDark text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              [ Send SMS (Keypad Phone) ]
            </button>
          </div>

          {/* Printable Thermal Receipt Slip */}
          <div
            id="printable-receipt"
            className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-400 shadow-lg font-mono text-slate-900 text-sm space-y-5"
          >
            {/* Slip Header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-slate-300 space-y-1">
              <div className="flex justify-center mb-1">
                <img src="/emblem.svg" alt="Emblem" className="w-10 h-10 object-contain" />
              </div>
              <p className="text-xs font-bold tracking-widest text-slate-700">
                GOVERNMENT OF INDIA • MINISTRY OF AGRICULTURE
              </p>
              <p className="text-[11px] text-slate-500 font-semibold">
                SMART FARMER PROCUREMENT MANAGEMENT SYSTEM (SIH26032)
              </p>
              <div className="pt-2 text-base font-extrabold tracking-tight text-gov-navy">
                ----------------------------------------<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PROCUREMENT APPOINTMENT<br />
                ----------------------------------------
              </div>
            </div>

            {/* Farmer & Appointment Details */}
            <div className="space-y-2 text-xs leading-relaxed">
              <div className="flex justify-between">
                <span className="text-slate-600">Farmer:</span>
                <span className="font-bold text-slate-900">{appointment.farmerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Farmer ID:</span>
                <span className="font-bold font-mono">{maskFarmerId(appointment.farmerId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Center:</span>
                <span className="font-bold text-slate-900 text-right">{appointment.centerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Date:</span>
                <span className="font-bold text-slate-900">
                  {formatDateIndian(appointment.appointmentDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Time:</span>
                <span className="font-bold text-slate-900">{appointment.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Crop / Qty:</span>
                <span className="font-bold text-slate-900">
                  {appointment.crop} ({appointment.quantity} {appointment.unit})
                </span>
              </div>
            </div>

            {/* Prominent Queue Token Badge */}
            <div className="text-center py-4 bg-slate-50 border-y-2 border-dashed border-slate-300 space-y-1">
              <span className="text-xs tracking-wider uppercase font-bold text-slate-600">
                TOKEN:
              </span>
              <div className="text-4xl font-black text-gov-navy tracking-tight">
                {appointment.tokenNumber}
              </div>
              <div className="text-[11px] text-slate-500 font-sans">
                Keep this token ready at the Mandi Entry Gate
              </div>
            </div>

            {/* Identifiers */}
            <div className="space-y-1 text-xs">
              <div className="text-slate-600">Appointment ID:</div>
              <div className="font-bold text-sm tracking-wide font-mono text-slate-900">
                {appointment.id}
              </div>
              {appointment.procurementId && (
                <div className="text-[11px] text-slate-500 pt-1">
                  Procurement Ref: <span className="font-mono">{appointment.procurementId}</span>
                </div>
              )}
            </div>

            {/* Footer Advisory */}
            <div className="pt-4 border-t-2 border-dashed border-slate-300 text-center space-y-2 text-xs">
              <p className="font-bold text-slate-900">
                Please arrive 15 minutes before your appointment.
              </p>
              <p className="text-[10px] text-slate-500 leading-normal font-sans">
                Carry original farmer ID proof, bank passbook copy, and land records for physical weighment and moisture verification.
              </p>
              <div className="pt-1 text-[9px] text-slate-400 font-mono">
                Booked at: {appointment.bookedByCenterId} • Helpline: 1800-180-1551
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No Appointment Loaded</h3>
          <p className="text-xs text-slate-500">
            Please enter a valid Appointment ID above (e.g. APT-2026-00045) or book an appointment first.
          </p>
        </div>
      )}

      {/* Clearly Marked Demo SMS Simulation Modal */}
      {showSmsModal && appointment && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gov-green" />
                <h3 className="font-bold text-slate-900 text-base">
                  SMS Gateway Simulation (Keypad Phone)
                </h3>
              </div>
              <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-300">
                Demo Simulation
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Dispatches standardized SMS notification in Gujarati/Hindi/English to farmer&apos;s feature phone ({appointment.farmerMobile}):
            </p>

            {/* Simulated SMS Message Screen */}
            <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-2 border border-slate-700 shadow-inner">
              <div className="text-[10px] text-slate-400 border-b border-slate-800 pb-1 flex justify-between">
                <span>From: GOV-MANDI</span>
                <span>SIMULATED</span>
              </div>
              <p className="leading-relaxed">
                Kisan {appointment.farmerName}, tamari {appointment.crop} kharid appointment confirm thai che.<br /><br />
                Token: <span className="text-white font-bold text-sm underline">{appointment.tokenNumber}</span><br />
                Center: {appointment.centerName}<br />
                Date: {appointment.appointmentDate}<br />
                Time: {appointment.timeSlot}<br />
                Apt ID: {appointment.id}<br /><br />
                Krupa kari 15 min pehla pahoncho. - Gov of India
              </p>
            </div>

            {smsSentNotice ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800 font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Simulated SMS dispatched to {appointment.farmerMobile} successfully!</span>
              </div>
            ) : (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSmsModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendSimulatedSms}
                  className="px-4 py-2 bg-gov-green text-white text-xs font-bold rounded-lg hover:bg-gov-greenDark shadow-sm flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Dispatch SMS to Farmer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
