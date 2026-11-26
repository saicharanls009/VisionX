import React, { useState } from 'react';
import { 
  Users, 
  PlusCircle
} from 'lucide-react';
import type { QueueItem, QueueStatus } from '../../types/procurement';
import { QueueTable } from '../dashboard/QueueTable';

interface QueueViewProps {
  items: QueueItem[];
  onSelectQueueItem: (item: QueueItem) => void;
  onUpdateStatus: (itemId: string, newStatus: QueueStatus) => void;
  onAddNewSpotFarmer?: () => void;
}

export const QueueView: React.FC<QueueViewProps> = ({
  items,
  onSelectQueueItem,
  onUpdateStatus,
}) => {
  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('All');

  const statusCounts = {
    All: items.length,
    'Booked': items.filter((i) => i.status === 'Booked').length,
    'Checked In': items.filter((i) => i.status === 'Checked In').length,
    'Waiting': items.filter((i) => i.status === 'Waiting').length,
    'Called': items.filter((i) => i.status === 'Called').length,
    'Processing': items.filter((i) => i.status === 'Processing').length,
    'Completed': items.filter((i) => i.status === 'Completed').length,
    'Cancelled': items.filter((i) => i.status === 'Cancelled').length,
  };

  return (
    <div className="space-y-4">
      {/* Title & Quick Actions */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-900" />
            <h2 className="text-base font-bold text-slate-900">
              Live Mandi Queue & Gate Arrival Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor gate barcode arrivals, yard staging, lab calling, and weighbridge allocation.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button 
            onClick={() => alert('Spot token generation modal: Farmer biometric & land verification required.')}
            className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded font-medium flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Generate Spot Token</span>
          </button>
        </div>
      </div>

      {/* Status Badges Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
        {(Object.keys(statusCounts) as (keyof typeof statusCounts)[]).map((tab) => {
          const isActive = selectedStatusTab === tab;
          const count = statusCounts[tab];
          return (
            <button
              key={tab}
              onClick={() => setSelectedStatusTab(tab)}
              className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-blue-900 text-white font-bold border-blue-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{tab}</span>
              <span 
                className={`font-mono text-[10px] px-1.5 py-0.2 rounded font-bold ${
                  isActive ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Queue Table */}
      <QueueTable
        items={items}
        onSelectQueueItem={onSelectQueueItem}
        onUpdateStatus={onUpdateStatus}
        activeStatusFilter={selectedStatusTab === 'All' ? undefined : selectedStatusTab}
        onClearActiveStatusFilter={() => setSelectedStatusTab('All')}
      />
    </div>
  );
};
