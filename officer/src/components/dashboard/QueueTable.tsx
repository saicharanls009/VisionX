import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal,
  RefreshCw,
  XCircle
} from 'lucide-react';
import type { QueueItem, QueueStatus, CropType, TimeSlot } from '../../types/procurement';

interface QueueTableProps {
  items: QueueItem[];
  onSelectQueueItem: (item: QueueItem) => void;
  onUpdateStatus: (itemId: string, newStatus: QueueStatus) => void;
  activeStatusFilter?: string;
  onClearActiveStatusFilter?: () => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({
  items,
  onSelectQueueItem,
  onUpdateStatus,
  activeStatusFilter,
  onClearActiveStatusFilter,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>(activeStatusFilter || 'All');
  const [selectedSlot, setSelectedSlot] = useState<string>('All Slots');
  
  // Interactive state toggles for testing/demo
  const [isLoading, setIsLoading] = useState(false);
  const [simulateError, setSimulateError] = useState(false);

  // Sync external status filter if updated from metrics cards
  React.useEffect(() => {
    if (activeStatusFilter) {
      setSelectedStatus(activeStatusFilter);
    }
  }, [activeStatusFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCrop('All');
    setSelectedStatus('All');
    setSelectedSlot('All Slots');
    if (onClearActiveStatusFilter) {
      onClearActiveStatusFilter();
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter (Token, Farmer Name, Farmer ID, Vehicle Number, Mobile)
      const matchesSearch =
        item.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.farmer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.farmer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.farmer.mobile.includes(searchQuery);

      // Crop filter
      const matchesCrop = selectedCrop === 'All' || item.crop === selectedCrop;

      // Status filter
      const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

      // Slot filter
      const matchesSlot = selectedSlot === 'All Slots' || item.appointmentSlot === selectedSlot;

      return matchesSearch && matchesCrop && matchesStatus && matchesSlot;
    });
  }, [items, searchQuery, selectedCrop, selectedStatus, selectedSlot]);

  // Status badge styling helper
  const getStatusBadge = (status: QueueStatus) => {
    switch (status) {
      case 'Booked':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Checked In':
        return 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
      case 'Waiting':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'Called':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold';
      case 'Processing':
        return 'bg-purple-50 text-purple-800 border-purple-300 font-semibold animate-pulse';
      case 'Completed':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  // Get primary contextual action for row
  const getActionDetails = (item: QueueItem) => {
    switch (item.status) {
      case 'Booked':
        return {
          label: 'Gate Check-In',
          action: (e: React.MouseEvent) => {
            e.stopPropagation();
            onUpdateStatus(item.id, 'Checked In');
          },
          className: 'bg-blue-800 hover:bg-blue-700 text-white',
        };
      case 'Checked In':
        return {
          label: 'Call to Bay',
          action: (e: React.MouseEvent) => {
            e.stopPropagation();
            onUpdateStatus(item.id, 'Called');
          },
          className: 'bg-amber-700 hover:bg-amber-600 text-white',
        };
      case 'Waiting':
        return {
          label: 'Call to Scale',
          action: (e: React.MouseEvent) => {
            e.stopPropagation();
            onUpdateStatus(item.id, 'Called');
          },
          className: 'bg-indigo-700 hover:bg-indigo-600 text-white',
        };
      case 'Called':
        return {
          label: 'Inspect & Weigh',
          action: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectQueueItem(item);
          },
          className: 'bg-purple-700 hover:bg-purple-600 text-white',
        };
      case 'Processing':
        return {
          label: 'Complete Lot',
          action: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectQueueItem(item);
          },
          className: 'bg-emerald-700 hover:bg-emerald-600 text-white font-bold',
        };
      case 'Completed':
        return {
          label: 'View WSR Slip',
          action: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectQueueItem(item);
          },
          className: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300',
        };
      case 'Cancelled':
        return {
          label: 'View Reason',
          action: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectQueueItem(item);
          },
          className: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
        };
      default:
        return {
          label: 'Details',
          action: (e: React.MouseEvent) => {
            e.stopPropagation();
            onSelectQueueItem(item);
          },
          className: 'bg-slate-800 text-white',
        };
    }
  };

  const cropsList: (CropType | 'All')[] = [
    'All',
    'Paddy',
    'Wheat',
    'Cotton',
    'Groundnut',
    'Mustard',
    'Soybean',
  ];

  const statusesList: (QueueStatus | 'All')[] = [
    'All',
    'Booked',
    'Checked In',
    'Waiting',
    'Called',
    'Processing',
    'Completed',
    'Cancelled',
  ];

  const slotsList: TimeSlot[] = [
    'All Slots',
    'Morning (08:00 - 11:00)',
    'Midday (11:00 - 14:00)',
    'Evening (14:00 - 18:00)',
  ];

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-xs flex flex-col">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                Today's Procurement Queue
              </h2>
              <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300">
                {filteredItems.length} of {items.length} lots
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live token gate entries, weighbridge dispatches, and warehouse receipts.
            </p>
          </div>

          {/* Testing / Simulation State Controls */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 900);
              }}
              disabled={isLoading}
              className="px-2.5 py-1 text-slate-600 hover:text-slate-900 border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1"
              title="Test table loading skeleton"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </button>

            <button
              onClick={() => setSimulateError(!simulateError)}
              className={`px-2 py-1 rounded text-[11px] font-mono border ${
                simulateError
                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
              }`}
              title="Toggle error state for testing"
            >
              {simulateError ? 'Error Active [Turn Off]' : 'Simulate API Error'}
            </button>
          </div>
        </div>

        {/* Filters and Search Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 text-xs">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Token, Farmer, FID, Vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-800 text-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Crop Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-800 bg-white text-xs text-slate-700"
            >
              {cropsList.map((crop) => (
                <option key={crop} value={crop}>
                  {crop === 'All' ? '🌾 All Crops (सभी फसलें)' : `🌾 ${crop}`}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                if (onClearActiveStatusFilter) onClearActiveStatusFilter();
              }}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-800 bg-white text-xs text-slate-700 font-medium"
            >
              {statusesList.map((st) => (
                <option key={st} value={st}>
                  {st === 'All' ? '⚡ All Statuses' : `Status: ${st}`}
                </option>
              ))}
            </select>
          </div>

          {/* Time Slot Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-800 bg-white text-xs text-slate-700"
            >
              {slotsList.map((slot) => (
                <option key={slot} value={slot}>
                  {slot === 'All Slots' ? '🕒 All Slots' : slot.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active filter summary pill if filters are modified */}
        {(selectedCrop !== 'All' || selectedStatus !== 'All' || selectedSlot !== 'All Slots' || searchQuery) && (
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            <span className="flex items-center gap-1.5">
              <SlidersHorizontal className="w-3 h-3 text-slate-500" />
              Active Filters:
              {searchQuery && <span className="font-semibold text-slate-800">"{searchQuery}"</span>}
              {selectedCrop !== 'All' && <span className="font-semibold text-slate-800">• Crop: {selectedCrop}</span>}
              {selectedStatus !== 'All' && <span className="font-semibold text-slate-800">• Status: {selectedStatus}</span>}
              {selectedSlot !== 'All Slots' && <span className="font-semibold text-slate-800">• {selectedSlot}</span>}
            </span>
            <button
              onClick={handleResetFilters}
              className="text-blue-800 hover:text-blue-900 font-semibold underline text-[11px]"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Simulated Error State */}
      {simulateError && (
        <div className="p-6 m-4 bg-rose-50 border border-rose-200 rounded-md text-center text-xs space-y-2">
          <div className="font-bold text-rose-900 text-sm">
            Gateway Communication Timeout (AgriStack Mandi Service Error 504)
          </div>
          <p className="text-rose-700 max-w-md mx-auto">
            Unable to sync live weighbridge queue from Haryana Mandi Board Central Server.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setSimulateError(false)}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded font-medium shadow-xs"
            >
              Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Loading Skeleton State */}
      {!simulateError && isLoading && (
        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 border border-slate-100 rounded-md">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-6 bg-slate-200 rounded"></div>
                <div className="space-y-1.5">
                  <div className="w-32 h-3.5 bg-slate-200 rounded"></div>
                  <div className="w-24 h-2.5 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="w-24 h-4 bg-slate-100 rounded"></div>
              <div className="w-16 h-4 bg-slate-100 rounded"></div>
              <div className="w-20 h-6 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!simulateError && !isLoading && filteredItems.length === 0 && (
        <div className="p-10 text-center space-y-2 text-xs">
          <div className="flex justify-center">
            <XCircle className="w-8 h-8 text-slate-300" />
          </div>
          <div className="font-bold text-slate-700 text-sm">
            No procurement lots found
          </div>
          <p className="text-slate-500 max-w-sm mx-auto">
            No arrivals match the selected filter criteria. Try resetting filters or searching with a different token number.
          </p>
          <div className="pt-2">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Data Table */}
      {!simulateError && !isLoading && filteredItems.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-2.5 px-3">Token #</th>
                <th className="py-2.5 px-3">Farmer & ID</th>
                <th className="py-2.5 px-3">Crop / Variety</th>
                <th className="py-2.5 px-3">Appt. Time</th>
                <th className="py-2.5 px-3 text-right">Quantity (Qtl)</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Location / Bay</th>
                <th className="py-2.5 px-3 text-right">Operational Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => {
                const action = getActionDetails(item);
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectQueueItem(item)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                  >
                    {/* Token Number */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900 group-hover:text-blue-900 text-sm">
                        {item.tokenNumber}
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono">
                        {item.appointmentSlot.split(' ')[0]}
                      </div>
                    </td>

                    {/* Farmer Details */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-900 leading-tight">
                        {item.farmer.name}
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono">
                        {item.farmer.id} • {item.farmer.village}
                      </div>
                    </td>

                    {/* Crop */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        {item.crop}
                      </div>
                      <div className="text-[10px] text-slate-600 truncate max-w-[140px]" title={item.variety}>
                        {item.variety}
                      </div>
                    </td>

                    {/* Appointment / Arrival Time */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">
                        {item.appointmentTime}
                      </div>
                      {item.arrivalTime ? (
                        <div className="text-[10px] text-emerald-800 font-mono">
                          Arr: {item.arrivalTime}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-600">
                          Pending Gate Entry
                        </div>
                      )}
                    </td>

                    {/* Quantity (Booked vs Actual) */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-mono">
                      {item.actualQuantityQuintals ? (
                        <div>
                          <span className="font-bold text-slate-900 text-sm">
                            {item.actualQuantityQuintals.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-slate-600 block">
                            Booked: {item.estimatedQuantityQuintals}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-700">
                          {item.estimatedQuantityQuintals.toFixed(1)} Est.
                        </span>
                      )}
                    </td>

                    {/* Current Status Badge */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] border ${getStatusBadge(
                          item.status
                        )}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    {/* Bay / Location */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap text-[11px] text-slate-600 font-mono">
                      {item.bay}
                    </td>

                    {/* Action Button */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={action.action}
                        className={`px-3 py-1 rounded text-xs transition shadow-xs ${action.className}`}
                      >
                        {action.label}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer with Summary */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-2">
        <div>
          Showing <span className="font-bold text-slate-700">{filteredItems.length}</span> records • Click any row for 5-stage procurement workflow inspection.
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-600" /> Booked / Gate Pass
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Inspection & Scales
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> Dispatched / DBT
          </span>
        </div>
      </div>
    </div>
  );
};
