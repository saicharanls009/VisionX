import React, { useState } from 'react';
import { 
  Megaphone, 
  ArrowRight, 
  Clock, 
  Truck, 
  Phone, 
  MapPin, 
  Wheat,
  Scale
} from 'lucide-react';
import type { QueueItem } from '../../types/procurement';

interface NextFarmerCardProps {
  farmerItem: QueueItem | null;
  onStartProcurement: (item: QueueItem) => void;
  onCallFarmer: (item: QueueItem) => void;
}

export const NextFarmerCard: React.FC<NextFarmerCardProps> = ({
  farmerItem,
  onStartProcurement,
  onCallFarmer,
}) => {
  const [calledRecently, setCalledRecently] = useState(false);

  const handleCall = () => {
    if (!farmerItem) return;
    
    // Play realistic Mandi PA Chime via Web Audio API
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const osc1 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.type = 'sine';

      // Chime note 1: C5 (523.25 Hz)
      osc1.frequency.setValueAtTime(523.25, now);
      // Chime note 2: G5 (783.99 Hz) after 0.25s
      osc1.frequency.setValueAtTime(783.99, now + 0.25);

      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc1.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.start(now);
      osc1.stop(now + 0.8);
    } catch {
      // Audio not supported or autoplay blocked
    }

    setCalledRecently(true);
    onCallFarmer(farmerItem);
    setTimeout(() => setCalledRecently(false), 4000);
  };

  if (!farmerItem) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-md p-4 text-center">
        <p className="text-xs text-slate-500">No priority farmer in waiting bay.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-md border border-slate-800 p-4 shadow-md flex flex-col justify-between">
      <div>
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              PRIORITY CALL • NEXT IN LINE
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs font-mono bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700/60 text-blue-200" title="Estimated waiting time only — not a guaranteed service time">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Est. Wait: ~{farmerItem.waitTimeMinutes || 12} mins (Estimate)</span>
          </div>
        </div>

        {/* Main Details Grid */}
        <div className="mt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Token & Bay */}
          <div className="md:col-span-3 flex md:flex-col items-center md:items-start justify-between border-b md:border-b-0 md:border-r border-slate-800 pb-2 md:pb-0 md:pr-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                QUEUE TOKEN
              </div>
              <div className="text-2xl font-black font-mono text-amber-400">
                {farmerItem.tokenNumber}
              </div>
            </div>
            <div className="mt-1 md:mt-2">
              <span className="text-[10px] font-semibold bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700">
                {farmerItem.bay}
              </span>
            </div>
          </div>

          {/* Farmer & Crop Details */}
          <div className="md:col-span-6 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-slate-100">
                {farmerItem.farmer.name}
              </span>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                {farmerItem.farmer.id}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3 h-3 text-slate-400" />
                {farmerItem.farmer.village}, {farmerItem.farmer.district}
              </span>
              <span className="flex items-center gap-1 font-mono text-slate-400">
                <Phone className="w-3 h-3 text-slate-400" />
                {farmerItem.farmer.mobile}
              </span>
            </div>

            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                <Wheat className="w-3 h-3" />
                {farmerItem.crop} ({farmerItem.variety})
              </span>
              <span className="text-slate-200 font-mono flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                <Scale className="w-3 h-3 text-amber-400" />
                Est: {farmerItem.estimatedQuantityQuintals} Qtl
              </span>
              <span className="text-slate-400 font-mono text-[11px] flex items-center gap-1">
                <Truck className="w-3 h-3" />
                {farmerItem.vehicleNumber} ({farmerItem.vehicleType})
              </span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="md:col-span-3 flex md:flex-col gap-2 justify-end">
            <button
              onClick={handleCall}
              className={`flex items-center justify-center space-x-1.5 px-3 py-2 rounded-md text-xs font-semibold transition border ${
                calledRecently
                  ? 'bg-amber-600 text-white border-amber-500 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-600/50 hover:border-amber-500'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>{calledRecently ? 'PA Audio Broadcasted!' : 'Call to Bay (PA)'}</span>
            </button>

            <button
              onClick={() => onStartProcurement(farmerItem)}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-md text-xs font-bold transition shadow-xs border border-emerald-500"
            >
              <span>Start Procurement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
