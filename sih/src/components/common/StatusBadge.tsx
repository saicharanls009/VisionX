import React from 'react';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  PhoneCall,
  Scale,
  CreditCard,
  Ban,
} from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  switch (status) {
    // Appointment Statuses
    case 'Booked':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          {status}
        </span>
      );
    case 'Checked In':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 ${sizeClasses[size]}`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
          Checked In
        </span>
      );
    case 'Waiting':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
          Waiting in Queue
        </span>
      );
    case 'Called':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-800 border border-purple-300 font-bold ${sizeClasses[size]}`}
        >
          <PhoneCall className="w-3.5 h-3.5 text-purple-600 animate-bounce" />
          Token Called!
        </span>
      );
    case 'Processing':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 ${sizeClasses[size]}`}
        >
          <Loader2 className="w-3.5 h-3.5 text-cyan-600 animate-spin" />
          Processing
        </span>
      );
    case 'Completed':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses[size]}`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Completed
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 ${sizeClasses[size]}`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Procurement Completed
        </span>
      );
    case 'Cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 ${sizeClasses[size]}`}
        >
          <Ban className="w-3.5 h-3.5 text-rose-600" />
          Cancelled
        </span>
      );

    // Procurement Statuses
    case 'Pending':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          Pending
        </span>
      );
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ${sizeClasses[size]}`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Money Pending
        </span>
      );
    case 'Verification':
    case 'Crop Verified':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 ${sizeClasses[size]}`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-sky-600" />
          Crop Verified
        </span>
      );
    case 'Weighing':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 ${sizeClasses[size]}`}
        >
          <Scale className="w-3.5 h-3.5 text-amber-600" />
          Weighing & Moisture Check
        </span>
      );
    case 'Quality Check':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 ${sizeClasses[size]}`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-indigo-600" />
          Quality Check Passed
        </span>
      );
    case 'Approved':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold ${sizeClasses[size]}`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Approved for Purchase
        </span>
      );

    // Payment Statuses
    case 'Paid':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-green-50 text-green-800 border border-green-300 font-bold ${sizeClasses[size]}`}
        >
          <CreditCard className="w-3.5 h-3.5 text-green-600" />
          Paid via DBT
        </span>
      );
    case 'settled':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-green-50 text-green-800 border border-green-300 font-bold ${sizeClasses[size]}`}
        >
          <CreditCard className="w-3.5 h-3.5 text-green-600" />
          Payment Settled
        </span>
      );

    // Center Availability
    case 'Available':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses[size]}`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Available
        </span>
      );
    case 'Busy':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300 ${sizeClasses[size]}`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Busy (High Wait)
        </span>
      );
    case 'Full':
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 ${sizeClasses[size]}`}
        >
          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
          Slots Full Today
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 ${sizeClasses[size]}`}
        >
          {status}
        </span>
      );
  }
};
