import React from 'react';
import { 
  History, 
  CheckCircle2, 
  Scale, 
  FlaskConical, 
  IndianRupee, 
  UserCheck, 
  Clock 
} from 'lucide-react';
import type { TimelineItem } from '../../types/procurement';

interface ActivityTimelineProps {
  items: TimelineItem[];
  onSelectToken?: (tokenNumber: string) => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ 
  items,
  onSelectToken 
}) => {
  const getIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'payment':
        return <IndianRupee className="w-3.5 h-3.5 text-emerald-800" />;
      case 'procurement':
        return <CheckCircle2 className="w-3.5 h-3.5 text-blue-800" />;
      case 'weighment':
        return <Scale className="w-3.5 h-3.5 text-amber-800" />;
      case 'quality':
        return <FlaskConical className="w-3.5 h-3.5 text-purple-800" />;
      case 'checkin':
        return <UserCheck className="w-3.5 h-3.5 text-teal-800" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  const getBorderColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'payment':
        return 'border-emerald-600 bg-emerald-50';
      case 'procurement':
        return 'border-blue-600 bg-blue-50';
      case 'weighment':
        return 'border-amber-600 bg-amber-50';
      case 'quality':
        return 'border-purple-600 bg-purple-50';
      case 'checkin':
        return 'border-teal-600 bg-teal-50';
      default:
        return 'border-slate-400 bg-slate-50';
    }
  };

  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs flex flex-col h-[390px] justify-between">
      {/* Fixed Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
        <div className="flex items-center space-x-2">
          <History className="w-4 h-4 text-slate-800" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
            Recent Mandi Operations Activity
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-mono text-slate-400">
            {items.length} Events
          </span>
          <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
            LIVE AUDIT TRAIL
          </span>
        </div>
      </div>

      {/* Independent Scrollable Timeline list */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2 mt-3 space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {items.map((item) => (
          <div key={item.id} className="relative pl-7 group">
            {/* Dot icon */}
            <div 
              className={`absolute left-1 top-0.5 w-4 h-4 rounded-full border flex items-center justify-center -translate-x-1/2 ${getBorderColor(
                item.type
              )}`}
            >
              {getIcon(item.type)}
            </div>

            {/* Event Content */}
            <div className="text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 leading-tight">
                  {item.title}
                </span>
                <span className="text-[10px] font-mono text-slate-600 whitespace-nowrap ml-2">
                  {item.timestamp}
                </span>
              </div>

              <p className="text-slate-700 text-[11px] mt-0.5 leading-relaxed">
                {item.description}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <button
                  onClick={() => onSelectToken && onSelectToken(item.tokenNumber)}
                  className="font-mono text-[10px] text-blue-900 hover:text-blue-950 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200"
                >
                  {item.tokenNumber}
                </button>
                {item.badge && (
                  <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Card Footer */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <span className="italic text-[10px]">Scrolls independently</span>
        <span className="font-medium text-[10px]">
          Synchronized with State e-Uparjan Portal
        </span>
      </div>
    </div>
  );
};
