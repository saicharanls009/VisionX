import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Wheat, 
  RefreshCw, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  Users, 
  Scale, 
  FileText, 
  Activity, 
  Info,
  Layers
} from 'lucide-react';
import type { CenterCapacity, CenterMetrics, QueueItem } from '../../types/procurement';
import { 
  fetchAnalyticsSummary, 
  fetchAnalyticsCrops, 
  fetchAnalyticsDaily, 
  fetchCropChartBlobUrl, 
  fetchWaitTimeEstimate, 
  downloadProcurementsCsv 
} from '../../services/analyticsApi';
import type { 
  AnalyticsSummary, 
  CropStatistic, 
  DailyStatistic, 
  WaitTimeEstimate 
} from '../../services/analyticsApi';

interface ReportsViewProps {
  metrics: CenterMetrics;
  capacity: CenterCapacity;
  items: QueueItem[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ metrics, capacity, items }) => {
  // Remote API state
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [crops, setCrops] = useState<CropStatistic[]>([]);
  const [daily, setDaily] = useState<DailyStatistic[]>([]);
  const [chartUrl, setChartUrl] = useState<string | null>(null);

  // Loading & error state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>('');

  // Wait time estimator state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>(items[0]?.id || 'apt-target');
  const [waitTime, setWaitTime] = useState<WaitTimeEstimate | null>(null);
  const [loadingWaitTime, setLoadingWaitTime] = useState(false);
  const [waitTimeError, setWaitTimeError] = useState<string | null>(null);

  // Load all analytics data from FastAPI
  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setApiError(null);

    try {
      const [sumRes, cropRes, dailyRes, chartBlobUrl] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchAnalyticsCrops(),
        fetchAnalyticsDaily(),
        fetchCropChartBlobUrl().catch((err) => {
          console.warn('[Analytics API] Chart image failed to load:', err);
          return null;
        }),
      ]);

      setSummary(sumRes);
      setCrops(cropRes);
      setDaily(dailyRes);
      if (chartBlobUrl) {
        setChartUrl(chartBlobUrl);
      }
      setLastRefreshedAt(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('[Analytics API] Error fetching analytics data:', err);
      setApiError(err instanceof Error ? err.message : 'Failed to connect to Analytics API backend.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Query wait-time estimate when appointment changes
  const queryWaitTime = useCallback(async (appointmentId: string) => {
    if (!appointmentId) return;
    setLoadingWaitTime(true);
    setWaitTimeError(null);
    try {
      const estimate = await fetchWaitTimeEstimate(appointmentId);
      setWaitTime(estimate);
    } catch (err) {
      setWaitTime(null);
      setWaitTimeError(err instanceof Error ? err.message : 'Could not calculate queue estimate.');
    } finally {
      setLoadingWaitTime(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAppointmentId) {
      queryWaitTime(selectedAppointmentId);
    }
  }, [selectedAppointmentId, queryWaitTime]);

  // Handle CSV Download
  const handleCsvDownload = async () => {
    setDownloadingCsv(true);
    try {
      await downloadProcurementsCsv();
    } catch (err) {
      alert(`CSV Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setDownloadingCsv(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Actions Header */}
      <div className="bg-white p-4 rounded-md border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-900" />
            <h2 className="text-base font-bold text-slate-900">
              Procurement MIS Reports & Crop Analytics Engine
            </h2>
            {apiError ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-600" /> API Offline
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live FastAPI Engine
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
            <span>Official government MSP operations telemetry & automated Firestore analytics.</span>
            {lastRefreshedAt && <span className="font-mono text-[10px] text-slate-400">Refreshed: {lastRefreshedAt} IST</span>}
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => loadAnalytics(true)}
            disabled={refreshing || loading}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded font-medium flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50"
            title="Refresh analytics from Python FastAPI backend"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin text-blue-700' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          <button
            onClick={handleCsvDownload}
            disabled={downloadingCsv}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded font-medium flex items-center gap-1.5 transition disabled:opacity-50"
            title="Export sanitized procurement records as CSV"
          >
            <Download className={`w-3.5 h-3.5 ${downloadingCsv ? 'animate-bounce text-blue-700' : ''}`} />
            <span>{downloadingCsv ? 'Downloading...' : 'Export CSV'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Backend Offline Alert Notification */}
      {apiError && (
        <div className="bg-amber-50 border border-amber-300 rounded-md p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">FastAPI Analytics Server Connection Failed</div>
            <div className="text-amber-800 mt-0.5">
              {apiError}. Make sure the backend server is running on <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">http://localhost:8000</code>.
            </div>
            <button
              onClick={() => loadAnalytics(false)}
              className="mt-2 px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-semibold text-[11px] inline-flex items-center gap-1 shadow-2xs"
            >
              <RefreshCw className="w-3 h-3" /> Retry Connection
            </button>
          </div>
        </div>
      )}

      {/* Top MIS Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Total Registered Farmers */}
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] uppercase font-semibold">
            <span>Total Registered Farmers</span>
            <Users className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {loading ? <span className="text-slate-400 animate-pulse">--</span> : (summary?.total_registered_farmers ?? metrics.todayAppointments)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            Verified in Center Master Registry
          </div>
        </div>

        {/* Total Appointments */}
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] uppercase font-semibold">
            <span>Total Appointments</span>
            <Calendar className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">
            {loading ? <span className="text-slate-400 animate-pulse">--</span> : (summary?.total_appointments ?? metrics.todayAppointments)}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
            Today &amp; Historical Procurement Slots
          </div>
        </div>

        {/* Completed Procurements */}
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] uppercase font-semibold">
            <span>Completed Procurements</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
            {loading ? <span className="text-slate-400 animate-pulse">--</span> : (summary?.completed_procurements ?? metrics.completedProcurements)}
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
            WSR &amp; Weight Slips Generated
          </div>
        </div>

        {/* Pending Procurements */}
        <div className="bg-white border border-slate-200 rounded p-3 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-[11px] uppercase font-semibold">
            <span>Pending Procurements</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-800 mt-1">
            {loading ? <span className="text-slate-400 animate-pulse">--</span> : (summary?.pending_procurements ?? (metrics.todayAppointments - metrics.completedProcurements))}
          </div>
          <div className="text-[10px] text-slate-500 font-normal mt-0.5" title={summary?.definition}>
            Active slots awaiting procurement completion
          </div>
        </div>
      </div>

      {/* Main Analytics Content: 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Visual Crop Chart & Commodity Arrivals (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Real Backend Crop-Wise Matplotlib Chart */}
          <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-blue-900" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                  Completed Procurement by Commodity (Backend Chart Engine)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded">
                Matplotlib 150 DPI
              </span>
            </div>

            {loading ? (
              <div className="h-64 flex flex-col items-center justify-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-900 mb-2" />
                <span className="text-xs">Generating crop visualization from Python backend...</span>
              </div>
            ) : chartUrl ? (
              <div className="space-y-1">
                <img 
                  src={chartUrl} 
                  alt="Procurement By Crop Chart" 
                  className="w-full h-auto rounded border border-slate-200 bg-white" 
                />
                <p className="text-[10px] text-slate-400 text-right">
                  Generated via FastAPI <code className="bg-slate-100 px-1 py-0.5 rounded">/api/analytics/crop-chart.png</code>
                </p>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center bg-slate-50 rounded border border-dashed border-slate-200 text-slate-400">
                <Wheat className="w-8 h-8 text-slate-300 mb-1.5" />
                <span className="text-xs">No chart generated or backend offline.</span>
              </div>
            )}
          </div>

          {/* Commodity Arrivals Table */}
          <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Wheat className="w-3.5 h-3.5 text-amber-700" />
                Commodity-wise Verified Mandi Arrivals
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {crops.length} commodities tracked
              </span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading commodities...</div>
            ) : crops.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No completed procurement records found in the database.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                      <th className="py-2 px-3">Commodity Crop</th>
                      <th className="py-2 px-3 text-right">Total Verified (Quintals)</th>
                      <th className="py-2 px-3 text-right">Completed Lots</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {crops.map((row) => (
                      <tr key={row.crop} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <Wheat className="w-3.5 h-3.5 text-amber-700" />
                          {row.crop}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                          {row.quantity_quintals.toFixed(2)} Qtl
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-800">
                          <span className="bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                            {row.completed_procurements} lots
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Daily Statistics & Interactive Wait Time Estimator (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Daily Procurement Statistics Table */}
          <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-900" />
                Daily Procurement Timeline (FastAPI)
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {daily.length} session dates
              </span>
            </div>

            {loading ? (
              <div className="py-6 text-center text-xs text-slate-400">Loading daily aggregates...</div>
            ) : daily.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No daily historical data available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5 text-center">Lots</th>
                      <th className="py-2 px-2.5 text-right">Quantity (Qtl)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daily.map((row) => (
                      <tr key={row.date} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-2.5 font-mono text-slate-700">
                          {row.date}
                        </td>
                        <td className="py-2 px-2.5 text-center font-mono font-medium text-blue-900">
                          {row.completed_procurements}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                          {row.quantity_quintals.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dedicated Wait-Time Estimator Card (Strictly Labeled as Estimate) */}
          <div className="bg-white rounded-md border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight">
                  Queue Wait-Time Estimator
                </h3>
              </div>
              <span className="text-[10px] uppercase font-semibold bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                Analytical Model
              </span>
            </div>

            {/* Prominent Required Legal/Operational Estimate Disclaimer */}
            <div className="text-[11px] text-amber-900 bg-amber-50/90 border border-amber-200 rounded p-2.5 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Important Notice:</span> All waiting times shown below are mathematical estimations based on historical mandi service speeds. They are <strong>estimated waiting times only — not guaranteed service times</strong>.
              </div>
            </div>

            {/* Appointment Selector */}
            <div>
              <label htmlFor="appointment-select" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Select Queue Token / Appointment to Estimate:
              </label>
              <select
                id="appointment-select"
                value={selectedAppointmentId}
                onChange={(e) => setSelectedAppointmentId(e.target.value)}
                className="w-full text-xs font-mono border border-slate-300 rounded px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.tokenNumber} — {item.farmer.name} ({item.crop}, {item.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Wait-Time Estimation Result */}
            {loadingWaitTime ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded border border-dashed border-slate-200">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-600 mx-auto mb-1" />
                <span>Computing wait-time estimation model...</span>
              </div>
            ) : waitTimeError ? (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600">
                <div className="font-semibold text-slate-800">Estimation Notice</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{waitTimeError}</div>
              </div>
            ) : waitTime ? (
              <div className="bg-slate-900 text-white rounded-md p-3.5 space-y-3 shadow-inner border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Estimated Queue Wait</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    ESTIMATE ONLY
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black font-mono text-amber-400">
                    ~{waitTime.estimated_wait_minutes}
                  </span>
                  <span className="text-sm font-bold text-slate-300">Minutes</span>
                  <span className="text-xs text-slate-400 ml-auto font-mono">
                    Position #{waitTime.queue_position}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-800 pt-2.5 text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[10px]">FARMERS AHEAD</span>
                    <span className="font-mono font-bold text-white text-xs">{waitTime.farmers_ahead ?? 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">AVG SERVICE TIME</span>
                    <span className="font-mono font-bold text-white text-xs">{waitTime.average_processing_minutes ?? 15} min/lot</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                  <span>Source: <span className="font-mono text-slate-300">{waitTime.source || 'Historical Average'}</span></span>
                  <span>{waitTime.historical_sample_count ?? 5} samples</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
