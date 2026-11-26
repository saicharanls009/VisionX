import { auth, isFirebaseConfigured } from '../firebase/config';

export interface AnalyticsSummary {
  total_registered_farmers: number;
  total_appointments: number;
  completed_procurements: number;
  pending_procurements: number;
  definition?: string;
}

export interface CropStatistic {
  crop: string;
  quantity_quintals: number;
  completed_procurements: number;
}

export interface DailyStatistic {
  date: string;
  completed_procurements: number;
  quantity_quintals: number;
}

export interface WaitTimeEstimate {
  appointment_id: string;
  center_id?: string;
  queue_position?: number;
  farmers_ahead?: number;
  currently_processing_ahead?: number;
  estimated_wait_minutes: number;
  average_processing_minutes?: number;
  historical_sample_count?: number;
  source?: string;
  data_notice?: string;
  estimate_label: string;
}

export interface SchemaValidationReport {
  safe_to_analyse: boolean;
  collection_counts?: {
    appointments: number;
    farmers: number;
    procurements: number;
  };
  notice?: string;
}

const API_BASE_URL = (import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * Retrieves the active Officer's Firebase ID token or falls back to test environment token.
 */
export async function getOfficerAuthToken(): Promise<string> {
  try {
    if (isFirebaseConfigured && auth?.currentUser) {
      const token = await auth.currentUser.getIdToken();
      if (token) return token;
    }
  } catch (error) {
    console.warn('[Analytics API] Could not retrieve Firebase ID token, using fallback:', error);
  }
  return import.meta.env.VITE_OFFICER_API_TOKEN || '';
}

/**
 * Creates authenticated request headers with Bearer token.
 */
async function getAuthHeaders(extraHeaders?: HeadersInit): Promise<Headers> {
  const token = await getOfficerAuthToken();
  const headers = new Headers(extraHeaders);
  headers.set('Authorization', `Bearer ${token}`);
  return headers;
}

/**
 * Check backend health status
 */
export async function checkBackendHealth(): Promise<{ status: string; service: string }> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/api/health`, { headers });
  if (!response.ok) {
    throw new Error(`Health check failed with status HTTP ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch high-level analytics summary totals
 */
export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const headers = await getAuthHeaders({ Accept: 'application/json' });
  const response = await fetch(`${API_BASE_URL}/api/analytics/summary`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to load analytics summary (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch commodity-wise crop arrivals & procurement breakdown
 */
export async function fetchAnalyticsCrops(): Promise<CropStatistic[]> {
  const headers = await getAuthHeaders({ Accept: 'application/json' });
  const response = await fetch(`${API_BASE_URL}/api/analytics/crops`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to load crop breakdown (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch daily procurement progress history
 */
export async function fetchAnalyticsDaily(): Promise<DailyStatistic[]> {
  const headers = await getAuthHeaders({ Accept: 'application/json' });
  const response = await fetch(`${API_BASE_URL}/api/analytics/daily`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to load daily statistics (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Fetch crop chart PNG image with authorization and return an Object URL
 */
export async function fetchCropChartBlobUrl(): Promise<string> {
  const headers = await getAuthHeaders({ Accept: 'image/png' });
  const response = await fetch(`${API_BASE_URL}/api/analytics/crop-chart.png`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to load crop chart image (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

/**
 * Fetch wait-time estimate for a specific appointment
 */
export async function fetchWaitTimeEstimate(appointmentId: string): Promise<WaitTimeEstimate> {
  const headers = await getAuthHeaders({ Accept: 'application/json' });
  const response = await fetch(`${API_BASE_URL}/api/wait-time/${encodeURIComponent(appointmentId)}`, { headers });
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Appointment ID '${appointmentId}' was not found in queue.`);
    }
    throw new Error(`Failed to calculate wait time (HTTP ${response.status})`);
  }
  return response.json();
}

/**
 * Download the procurements CSV export
 */
export async function downloadProcurementsCsv(): Promise<void> {
  const headers = await getAuthHeaders({ Accept: 'text/csv' });
  const response = await fetch(`${API_BASE_URL}/api/reports/procurements.csv`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to export CSV report (HTTP ${response.status})`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'smartprocure-procurements.csv';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Fetch schema validation audit report
 */
export async function fetchSchemaValidation(): Promise<SchemaValidationReport> {
  const headers = await getAuthHeaders({ Accept: 'application/json' });
  const response = await fetch(`${API_BASE_URL}/api/analytics/schema-validation`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to load schema validation report (HTTP ${response.status})`);
  }
  return response.json();
}
