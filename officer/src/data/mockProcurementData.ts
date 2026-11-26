import type {
  AlertItem,
  CenterCapacity,
  CenterMetrics,
  ProcurementOfficer,
  QueueItem,
  TimelineItem,
} from '../types/procurement';

export const CURRENT_OFFICER: ProcurementOfficer = {
  id: 'OFF-HR-7821',
  name: 'Sh. Rajesh Kumar Sharma',
  designation: 'Senior Procurement Inspector (Class II)',
  mandiName: 'Karnal Central APMC Mandi',
  mandiCode: 'PPC-HR-KNL-042',
  yardNumber: 'Yard No. 4 (Grain & Oilseeds)',
  district: 'Karnal',
  state: 'Haryana',
  shift: 'Morning Shift (08:00 - 16:00)',
};

export const INITIAL_METRICS: CenterMetrics = {
  todayAppointments: 0,
  checkedIn: 0,
  pendingWeighments: 0,
  completedProcurements: 0,
  pendingDbt: 0,
  totalDisbursedAmountLakhs: 0,
  pendingDisbursementLakhs: 0,
};

export const INITIAL_CAPACITY: CenterCapacity = {
  dailyTargetQuintals: 2500,
  completedQuintals: 0,
  queueCount: 0,
  availableSlots: 0,
  totalAppointmentsToday: 0,
  storageCapacityMT: 5000,
  currentStorageMT: 0,
  weighbridge1Status: 'Online',
  weighbridge2Status: 'Online',
};

export const INITIAL_ALERTS: AlertItem[] = [];

export const INITIAL_TIMELINE: TimelineItem[] = [];

export const INITIAL_QUEUE_DATA: QueueItem[] = [];
