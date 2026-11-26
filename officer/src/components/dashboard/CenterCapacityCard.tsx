import React from 'react';
import { 
  Warehouse, 
  Scale, 
  Truck, 
  CalendarClock
} from 'lucide-react';
import type { CenterCapacity } from '../../types/procurement';

interface CenterCapacityCardProps {
  capacity: CenterCapacity;
}

export const CenterCapacityCard: React.FC<CenterCapacityCardProps> = ({ capacity }) => {
  const percentage = Math.min(
    100,
    Math.round((capacity.completedQuintals / capacity.dailyTargetQuintals) * 100)
  );

  const storagePercentage = Math.min(
    100,
    Math.round((capacity.currentStorageMT / capacity.storageCapacityMT) * 100)
  );

  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs">
      {/* Title & Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center space-x-2">
          <Warehouse className="w-4 h-4 text-emerald-800" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
            Center Capacity & Yard Load
          </span>
        </div>
        <span className="text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
          Target: {capacity.dailyTargetQuintals.toLocaleString()} Qtl
        </span>
      </div>

      {/* Daily Progress Gauge */}
      <div className="mt-3">
        <div className="flex justify-between items-baseline text-xs mb-1">
          <span className="text-slate-600 font-medium">Daily Quota Fulfilled:</span>
          <span className="font-mono font-bold text-slate-900">
            {capacity.completedQuintals.toLocaleString()} / {capacity.dailyTargetQuintals.toLocaleString()} Qtl ({percentage}%)
          </span>
        </div>
        
        {/* Progress Bar with 8px radius or restrained rounding */}
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              percentage >= 90 
                ? 'bg-amber-600' 
                : percentage >= 70 
                ? 'bg-emerald-600' 
                : 'bg-blue-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Grid of Key Operational Capacity Stats */}
      <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
        {/* Yard Queue Count */}
        <div className="bg-slate-50 border border-slate-200/80 rounded p-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] uppercase font-semibold">
            <Truck className="w-3 h-3 text-slate-600" />
            <span>Vehicles in Yard</span>
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-0.5">
            {capacity.queueCount}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Holding Bays A & B</div>
        </div>

        {/* Available Booking Slots */}
        <div className="bg-slate-50 border border-slate-200/80 rounded p-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] uppercase font-semibold">
            <CalendarClock className="w-3 h-3 text-blue-600" />
            <span>Open Slots Today</span>
          </div>
          <div className="text-lg font-bold font-mono text-blue-700 mt-0.5">
            {capacity.availableSlots}
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Evening Yard 4</div>
        </div>

        {/* Weighbridge 1 Status */}
        <div className="bg-slate-50 border border-slate-200/80 rounded p-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] uppercase font-semibold">
            <Scale className="w-3 h-3 text-emerald-600" />
            <span>Weighbridge #1</span>
          </div>
          <div className="text-xs font-bold font-mono text-emerald-700 mt-1 flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            60MT ONLINE
          </div>
          <div className="text-[10px] text-slate-500 font-mono">Heavy Vehicles</div>
        </div>

        {/* Silo Storage Capacity */}
        <div className="bg-slate-50 border border-slate-200/80 rounded p-2 text-center">
          <div className="flex items-center justify-center space-x-1 text-slate-500 text-[10px] uppercase font-semibold">
            <Warehouse className="w-3 h-3 text-amber-600" />
            <span>Godown Sheds</span>
          </div>
          <div className="text-xs font-bold font-mono text-slate-800 mt-1">
            {capacity.currentStorageMT} / {capacity.storageCapacityMT} MT
          </div>
          <div className="text-[10px] text-amber-700 font-semibold font-mono">{storagePercentage}% utilized</div>
        </div>
      </div>
    </div>
  );
};
