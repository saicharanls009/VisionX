import React, { useEffect, useState } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import type { ViewType } from './components/layout/Sidebar';
import { SummaryMetrics } from './components/dashboard/SummaryMetrics';
import { NextFarmerCard } from './components/dashboard/NextFarmerCard';
import { CenterCapacityCard } from './components/dashboard/CenterCapacityCard';
import { QueueTable } from './components/dashboard/QueueTable';
import { ActivityTimeline } from './components/dashboard/ActivityTimeline';
import { AlertsSection } from './components/dashboard/AlertsSection';
import { WorkflowModal } from './components/modals/WorkflowModal';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';

// Separate views
import { QueueView } from './components/views/QueueView';
import { WeighmentQualityView } from './components/views/WeighmentQualityView';
import { RecordsView } from './components/views/RecordsView';
import { MoneySettlementsView } from './components/views/MoneySettlementsView';
import { ReportsView } from './components/views/ReportsView';
import { SettingsView } from './components/views/SettingsView';

// Mock Data
import { 
  CURRENT_OFFICER, 
  INITIAL_METRICS, 
  INITIAL_CAPACITY, 
  INITIAL_ALERTS, 
  INITIAL_TIMELINE, 
  INITIAL_QUEUE_DATA 
} from './data/mockProcurementData';

import type { QueueItem, QueueStatus, AlertItem, TimelineItem } from './types/procurement';
import { Menu, Columns, LayoutGrid } from 'lucide-react';
import { OfficerAccessGate } from './firebase/OfficerAccessGate';
import { isFirebaseConfigured } from './firebase/config';
import { saveOfficerWorkflow, settleOfficerPayment, subscribeToOfficerCenterCapacity, subscribeToOfficerQueue, subscribeToOfficerSettlements } from './firebase/officerStore';
import type { SettlementRecord } from './firebase/officerStore';

export const OfficerDashboard: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [dashboardLayout, setDashboardLayout] = useState<'stacked' | 'split'>('stacked');

  // Operational Data State
  const [officer] = useState(CURRENT_OFFICER);
  const [metrics, setMetrics] = useState(INITIAL_METRICS);
  const [capacity, setCapacity] = useState(INITIAL_CAPACITY);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [timeline, setTimeline] = useState<TimelineItem[]>(INITIAL_TIMELINE);
  const [queueItems, setQueueItems] = useState<QueueItem[]>(INITIAL_QUEUE_DATA);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);

  // Modal & Drawer State
  const [selectedItemForWorkflow, setSelectedItemForWorkflow] = useState<QueueItem | null>(null);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);

  // Filter state passed from metrics
  const [statusFilterFromMetrics, setStatusFilterFromMetrics] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToOfficerQueue(setQueueItems, (error) => console.error('Officer queue sync failed:', error));
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToOfficerSettlements(setSettlements, (error) => console.error('Officer settlement sync failed:', error));
  }, []);

  const handleSettlePayment = (record: SettlementRecord) => {
    if (!window.confirm(`Confirm actual payment has been made to ${record.farmerName}?`)) return;
    void settleOfficerPayment(record.id, officer.id).catch((error) => {
      console.error('Unable to settle payment:', error);
      window.alert('The payment settlement could not be saved. Please try again.');
    });
  };

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeToOfficerCenterCapacity(
      (nextCapacity) => setCapacity((previous) => ({ ...previous, ...nextCapacity })),
      (error) => console.error('Center capacity sync failed:', error)
    );
  }, []);

  // Priority "Next Farmer" is the first non-completed, non-cancelled item in 'Called' or 'Waiting'
  const nextFarmer = queueItems.find(
    (item) => item.status === 'Called' || item.status === 'Waiting' || item.status === 'Checked In'
  ) || null;

  // Handle row click & workflow modal
  const handleOpenWorkflow = (item: QueueItem) => {
    setSelectedItemForWorkflow(item);
  };

  const handleCloseWorkflow = () => {
    setSelectedItemForWorkflow(null);
  };

  // Handle advancing status from table or modal
  const handleUpdateItem = (updatedItem: QueueItem) => {
    const previousItem = queueItems.find((item) => item.id === updatedItem.id);
    let itemToSave = updatedItem;
    // Keep the existing workflow intact while allowing an officer to attach an
    // optional counter when the appointment first becomes Called.
    if (updatedItem.status === 'Called' && previousItem?.status !== 'Called' && !updatedItem.counterNumber) {
      const counterNumber = window.prompt('Counter number (optional):')?.trim();
      if (counterNumber) itemToSave = { ...updatedItem, counterNumber };
    }
    if (isFirebaseConfigured) {
      void saveOfficerWorkflow(itemToSave, officer.id).catch((error) => {
        console.error('Unable to save officer workflow:', error);
        window.alert('The officer update could not be saved. Please try again.');
      });
    }
    setQueueItems((prev) =>
      prev.map((item) => (item.id === itemToSave.id ? itemToSave : item))
    );

    // Update metrics dynamically
    if (updatedItem.status === 'Completed') {
      setMetrics((prev) => ({
        ...prev,
        completedProcurements: prev.completedProcurements + 1,
        pendingWeighments: Math.max(0, prev.pendingWeighments - 1),
        pendingDbt: prev.pendingDbt + 1,
        totalDisbursedAmountLakhs: Number((prev.totalDisbursedAmountLakhs + 0.84).toFixed(2)),
      }));

      setCapacity((prev) => ({
        ...prev,
        completedQuintals: prev.completedQuintals + (updatedItem.actualQuantityQuintals || 36),
        queueCount: Math.max(0, prev.queueCount - 1),
      }));

      // Add to live timeline
      const newTimelineItem: TimelineItem = {
        id: `TL-${Date.now()}`,
        type: 'procurement',
        title: 'Procurement Cleared & WSR Issued',
        description: `WSR issued for ${updatedItem.farmer.name} (${updatedItem.actualQuantityQuintals || 36} Qtl ${updatedItem.crop}). Dispatched to Godown.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        tokenNumber: updatedItem.tokenNumber,
        badge: 'WSR GENERATED',
      };
      setTimeline((prev) => [newTimelineItem, ...prev]);
    } else if (updatedItem.status === 'Checked In') {
      setMetrics((prev) => ({
        ...prev,
        checkedIn: prev.checkedIn + 1,
      }));

      const newTimelineItem: TimelineItem = {
        id: `TL-${Date.now()}`,
        type: 'checkin',
        title: 'Gate Pass Verified & Check-In',
        description: `${updatedItem.farmer.name} checked in at Gate with ${updatedItem.vehicleType} (${updatedItem.vehicleNumber}).`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        tokenNumber: updatedItem.tokenNumber,
        badge: 'GATE-01',
      };
      setTimeline((prev) => [newTimelineItem, ...prev]);
    }

    setSelectedItemForWorkflow(null);
  };

  const handleUpdateStatus = (itemId: string, newStatus: QueueStatus) => {
    const item = queueItems.find((i) => i.id === itemId);
    if (!item) return;
    const updated = { ...item, status: newStatus };
    handleUpdateItem(updated);
  };

  // Calling farmer PA
  const handleCallFarmer = (item: QueueItem) => {
    handleUpdateStatus(item.id, 'Called');
    // Add timeline announcement
    const announcementItem: TimelineItem = {
      id: `TL-${Date.now()}`,
      type: 'quality',
      title: 'Public Address Call Dispatched',
      description: `Token ${item.tokenNumber} (${item.farmer.name}) summoned to ${item.bay}.`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      tokenNumber: item.tokenNumber,
      badge: 'PA BROADCAST',
    };
    setTimeline((prev) => [announcementItem, ...prev]);
  };

  // Resolving alerts
  const handleResolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  };

  const handleOpenAlertDetails = (alertObj: AlertItem) => {
    if (alertObj.tokenNumber) {
      const match = queueItems.find((i) => i.tokenNumber === alertObj.tokenNumber);
      if (match) {
        setSelectedItemForWorkflow(match);
      } else {
        window.alert(`Details for Alert: ${alertObj.title}\n${alertObj.description}`);
      }
    } else {
      window.alert(`Details for Alert: ${alertObj.title}\n${alertObj.description}`);
    }
  };

  const handleSelectToken = (tokenNumber: string) => {
    const match = queueItems.find((i) => i.tokenNumber === tokenNumber);
    if (match) {
      setSelectedItemForWorkflow(match);
    }
  };

  // Filter queue from summary metrics click
  const handleFilterByStatus = (status: string) => {
    setCurrentView('queue');
    setStatusFilterFromMetrics(status);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 antialiased text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900 overflow-hidden">
      {/* Top Header - Fixed at Top */}
      <div className="shrink-0 z-30">
        <Header
          officer={officer}
          alerts={alerts}
          onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
        />
      </div>

      {/* Mobile Top Navigation Sub-bar */}
      <div className="lg:hidden shrink-0 bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-white">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex items-center space-x-2 bg-slate-800 px-2.5 py-1 rounded border border-slate-700"
        >
          <Menu className="w-4 h-4 text-amber-400" />
          <span>Menu ({currentView})</span>
        </button>
        <span className="font-mono text-slate-300 text-[11px]">
          Yard 4 • Live
        </span>
      </div>

      {/* Main Layout Body - Full Viewport with Separated Scrolling */}
      <div className="flex-1 flex max-w-full overflow-hidden min-h-0">
        {/* Left Navigation Sidebar - Independent Scroll Container */}
        <Sidebar
          currentView={currentView}
          onSelectView={(view) => {
            setCurrentView(view);
            setStatusFilterFromMetrics(undefined);
          }}
          queueCount={queueItems.filter((i) => i.status !== 'Completed' && i.status !== 'Cancelled').length}
          weighmentCount={queueItems.filter((i) => i.status === 'Processing' || i.status === 'Called').length}
          pendingDbtCount={metrics.pendingDbt}
          officer={officer}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Primary Operational Workspace - Independent Scroll Container */}
        <main className="flex-1 h-full overflow-y-auto min-h-0 p-3 sm:p-5 lg:p-6 space-y-4 max-w-[1650px] w-full mx-auto">
          {/* VIEW: DASHBOARD (Default Overview) */}
          {currentView === 'dashboard' && (
            <div className="space-y-4">
              {/* Dashboard Layout Controller */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                    Mandi Procurement Operations Dashboard
                  </h1>
                  <p className="text-xs text-slate-500">
                    Karnal Central APMC Mandi • Yard 4 (Grain & Oilseeds)
                  </p>
                </div>

                {/* Layout Toggle: Stacked vs Split Console */}
                <div className="hidden md:flex items-center space-x-1 bg-white border border-slate-300 rounded p-0.5 text-xs shadow-xs">
                  <button
                    onClick={() => setDashboardLayout('stacked')}
                    className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition ${
                      dashboardLayout === 'stacked'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Standard Stacked Layout"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Stacked View</span>
                  </button>
                  <button
                    onClick={() => setDashboardLayout('split')}
                    className={`px-2.5 py-1 rounded flex items-center space-x-1.5 transition ${
                      dashboardLayout === 'split'
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Dual Side Independent Scrolling View"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Split Console (Side-by-Side)</span>
                  </button>
                </div>
              </div>

              {/* 1. Summary Metrics Strip */}
              <SummaryMetrics
                metrics={metrics}
                onFilterByStatus={handleFilterByStatus}
              />

              {/* LAYOUT OPTION A: STACKED OPERATIONS */}
              {dashboardLayout === 'stacked' && (
                <>
                  {/* Priority "Next Farmer" Panel + Center Capacity Panel */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-7">
                      <NextFarmerCard
                        farmerItem={nextFarmer}
                        onStartProcurement={handleOpenWorkflow}
                        onCallFarmer={handleCallFarmer}
                      />
                    </div>
                    <div className="lg:col-span-5">
                      <CenterCapacityCard capacity={capacity} />
                    </div>
                  </div>

                  {/* Today's Procurement Queue Table */}
                  <QueueTable
                    items={queueItems}
                    onSelectQueueItem={handleOpenWorkflow}
                    onUpdateStatus={handleUpdateStatus}
                    activeStatusFilter={statusFilterFromMetrics}
                    onClearActiveStatusFilter={() => setStatusFilterFromMetrics(undefined)}
                  />

                  {/* Bottom Split: Both Side Options with Independent Scrolling */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Side Option: Recent Activity Timeline */}
                    <div className="lg:col-span-7">
                      <ActivityTimeline
                        items={timeline}
                        onSelectToken={handleSelectToken}
                      />
                    </div>
                    {/* Right Side Option: Operational Exceptions & Alerts */}
                    <div className="lg:col-span-5">
                      <AlertsSection
                        alerts={alerts}
                        onResolveAlert={handleResolveAlert}
                        onOpenAlertDetails={handleOpenAlertDetails}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* LAYOUT OPTION B: SPLIT CONSOLE (Dual Independent Side Columns) */}
              {dashboardLayout === 'split' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Left Side Column: Queue Management & Priority Farmer */}
                  <div className="lg:col-span-8 space-y-4">
                    <NextFarmerCard
                      farmerItem={nextFarmer}
                      onStartProcurement={handleOpenWorkflow}
                      onCallFarmer={handleCallFarmer}
                    />

                    <QueueTable
                      items={queueItems}
                      onSelectQueueItem={handleOpenWorkflow}
                      onUpdateStatus={handleUpdateStatus}
                      activeStatusFilter={statusFilterFromMetrics}
                      onClearActiveStatusFilter={() => setStatusFilterFromMetrics(undefined)}
                    />
                  </div>

                  {/* Right Side Column: Capacity, Alerts & Timeline (Separate Scrolling Panels) */}
                  <div className="lg:col-span-4 space-y-4">
                    <CenterCapacityCard capacity={capacity} />

                    <AlertsSection
                      alerts={alerts}
                      onResolveAlert={handleResolveAlert}
                      onOpenAlertDetails={handleOpenAlertDetails}
                    />

                    <ActivityTimeline
                      items={timeline}
                      onSelectToken={handleSelectToken}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW: TODAY'S QUEUE */}
          {currentView === 'queue' && (
            <QueueView
              items={queueItems}
              onSelectQueueItem={handleOpenWorkflow}
              onUpdateStatus={handleUpdateStatus}
            />
          )}

          {/* VIEW: WEIGHMENT & QUALITY */}
          {currentView === 'weighment' && (
            <WeighmentQualityView
              items={queueItems}
              onOpenWorkflow={handleOpenWorkflow}
            />
          )}

          {/* VIEW: PROCUREMENT RECORDS */}
          {currentView === 'records' && (
            <RecordsView
              items={queueItems}
              onSelectRecord={handleOpenWorkflow}
            />
          )}

          {/* VIEW: MONEY SETTLEMENTS */}
          {currentView === 'payments' && (
            <MoneySettlementsView records={settlements} onSettle={handleSettlePayment} />
          )}

          {/* VIEW: REPORTS & MIS */}
          {currentView === 'reports' && (
            <ReportsView
              metrics={metrics}
              capacity={capacity}
              items={queueItems}
            />
          )}

          {/* VIEW: SETTINGS */}
          {currentView === 'settings' && (
            <SettingsView officer={officer} />
          )}
        </main>
      </div>

      {/* 5-Step Detailed Procurement Workflow Modal */}
      {selectedItemForWorkflow && (
        <WorkflowModal
          item={selectedItemForWorkflow}
          onClose={handleCloseWorkflow}
          onUpdateItem={handleUpdateItem}
        />
      )}

      {/* Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        alerts={alerts}
        onResolveAlert={handleResolveAlert}
        onSelectToken={handleSelectToken}
      />
    </div>
  );
};

export const App: React.FC = () => (
  <OfficerAccessGate>
    <OfficerDashboard />
  </OfficerAccessGate>
);

export default App;
