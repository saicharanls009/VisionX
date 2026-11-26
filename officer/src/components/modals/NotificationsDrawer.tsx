import React from 'react';
import { 
  X, 
  Bell, 
  AlertTriangle, 
  Droplet, 
  Copy, 
  FileQuestion, 
  CreditCard, 
  CheckCircle, 
  Radio
} from 'lucide-react';
import type { AlertItem } from '../../types/procurement';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertItem[];
  onResolveAlert: (alertId: string) => void;
  onSelectToken?: (tokenNumber: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onResolveAlert,
  onSelectToken,
}) => {
  if (!isOpen) return null;

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

  const unreadAlerts = alerts.filter(a => !a.resolved);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-300"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-sm">Center Alerts & System Advisories</span>
            <span className="bg-amber-600 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded">
              {unreadAlerts.length} Active
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* System Broadcast Strip */}
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-xs text-blue-900 flex items-center space-x-2">
          <Radio className="w-3.5 h-3.5 text-blue-700 animate-pulse shrink-0" />
          <span>
            <strong>Mandi Director Advisory:</strong> Rain forecast for evening. Expedite covered shed movement for open trolley lots.
          </span>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Pending Quality & Operational Flags
          </div>

          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-md border text-xs transition ${
                alert.resolved
                  ? 'bg-slate-50 border-slate-200 opacity-60'
                  : alert.severity === 'critical'
                  ? 'bg-rose-50/70 border-rose-200'
                  : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-start space-x-2.5">
                <div className="p-1 rounded bg-white border border-slate-200 shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      {alert.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {alert.time}
                    </span>
                  </div>

                  <p className="text-slate-700 text-[11px] mt-1 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between pt-1 border-t border-slate-200/60">
                    {alert.tokenNumber ? (
                      <button
                        onClick={() => {
                          if (onSelectToken) onSelectToken(alert.tokenNumber!);
                          onClose();
                        }}
                        className="font-mono text-[10px] text-blue-800 hover:underline font-bold"
                      >
                        Inspect Token {alert.tokenNumber} &rarr;
                      </button>
                    ) : (
                      <span />
                    )}

                    {!alert.resolved ? (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
