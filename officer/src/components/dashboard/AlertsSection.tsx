import React from 'react';
import { 
  AlertTriangle, 
  Droplet, 
  Copy, 
  FileQuestion, 
  CreditCard, 
  CheckCircle,
  ShieldAlert
} from 'lucide-react';
import type { AlertItem } from '../../types/procurement';

interface AlertsSectionProps {
  alerts: AlertItem[];
  onResolveAlert: (alertId: string) => void;
  onOpenAlertDetails?: (alert: AlertItem) => void;
}

export const AlertsSection: React.FC<AlertsSectionProps> = ({
  alerts,
  onResolveAlert,
  onOpenAlertDetails,
}) => {
  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'moisture':
        return <Droplet className="w-4 h-4 text-amber-800" />;
      case 'duplicate':
        return <Copy className="w-4 h-4 text-orange-800" />;
      case 'document':
        return <FileQuestion className="w-4 h-4 text-blue-800" />;
      case 'payment':
        return <CreditCard className="w-4 h-4 text-rose-800" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-amber-800" />;
    }
  };

  const activeAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs flex flex-col h-[390px] justify-between">
      {/* Fixed Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 shrink-0">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-rose-800" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
            Operational Exceptions & Alerts
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono font-bold bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
            {activeAlerts.length} Action Items
          </span>
        </div>
      </div>

      {/* Independent Scrollable Alerts list */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 mt-3 space-y-2.5">
        {activeAlerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <CheckCircle className="w-7 h-7 text-emerald-700 mx-auto mb-1.5" />
            No active alerts or quality discrepancies flagged.
          </div>
        ) : (
          activeAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-md border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alert.severity === 'critical'
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <div className="p-1 rounded bg-white border border-slate-200 shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 leading-tight">
                      {alert.title}
                    </span>
                    {alert.tokenNumber && (
                      <span className="font-mono text-[10px] bg-slate-900 text-white font-bold px-1.5 py-0.2 rounded">
                        {alert.tokenNumber}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500 font-mono">
                      {alert.time}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px] mt-1 leading-snug">
                    {alert.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => onOpenAlertDetails && onOpenAlertDetails(alert)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-xs font-semibold shadow-xs"
                >
                  {alert.actionLabel}
                </button>
                <button
                  onClick={() => onResolveAlert(alert.id)}
                  className="px-2 py-1 text-emerald-800 hover:text-emerald-950 font-semibold hover:bg-emerald-100 rounded text-xs"
                  title="Mark as resolved / Override recorded"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fixed Card Footer */}
      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
        <span className="italic text-[10px]">Scrolls independently</span>
        <span className="text-[10px] font-mono">
          Priority Alerts Channel Active
        </span>
      </div>
    </div>
  );
};
