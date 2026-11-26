export type QueueStatus = 
  | 'Booked' 
  | 'Checked In' 
  | 'Waiting' 
  | 'Called' 
  | 'Processing' 
  | 'Completed' 
  | 'Cancelled';

export type CropType = 
  | 'Paddy' 
  | 'Wheat' 
  | 'Cotton' 
  | 'Groundnut' 
  | 'Mustard' 
  | 'Soybean';

export type TimeSlot = 
  | 'All Slots'
  | 'Morning (08:00 - 11:00)' 
  | 'Midday (11:00 - 14:00)' 
  | 'Evening (14:00 - 18:00)';

export interface Farmer {
  id: string;
  authUid?: string;
  name: string;
  fatherName: string;
  mobile: string;
  village: string;
  panchayat: string;
  district: string;
  state: string;
  aadhaarMasked: string;
  kisanCreditCard: string;
  bankName: string;
  bankAccountMasked: string;
  ifsc: string;
  landHoldingAcres: number;
  khasraNumber: string;
  agriStackVerified: boolean;
}

export interface QualityCheck {
  moisturePct: number;
  standardMoisturePct: number;
  foreignMatterPct: number;
  damagedGrainsPct: number;
  immatureGrainsPct: number;
  grade: 'FAQ' | 'Grade A' | 'Grade B' | 'Sub-Standard' | 'Rejected';
  moistureCutDeductionPct: number;
  labTechnician: string;
  testedAt: string;
  qcCertificateNo?: string;
  remarks?: string;
}

export interface Weighment {
  weighbridgeId: string;
  grossWeightKg: number;
  tareWeightKg: number;
  netWeightKg: number;
  netWeightQuintals: number;
  bagCount: number;
  bagType: string;
  weighedAt: string;
  scaleSlipNumber: string;
  operatorName: string;
}

export interface PaymentDbt {
  mspRatePerQuintal: number;
  grossPayable: number;
  gunnyAllowance: number;
  qualityDeduction: number;
  netPayable: number;
  dbtStatus: 'Pending' | 'Initiated' | 'PFMS Cleared' | 'Failed' | 'Credited';
  pfmsReferenceNumber?: string;
  utrNumber?: string;
  initiatedAt?: string;
  accountValidated: boolean;
}

export interface QueueItem {
  id: string;
  tokenNumber: string;
  centerId?: string;
  farmer: Farmer;
  crop: CropType;
  variety: string;
  appointmentTime: string;
  appointmentSlot: 'Morning (08:00 - 11:00)' | 'Midday (11:00 - 14:00)' | 'Evening (14:00 - 18:00)';
  arrivalTime?: string;
  estimatedQuantityQuintals: number;
  actualQuantityQuintals?: number;
  vehicleNumber: string;
  vehicleType: string;
  status: QueueStatus;
  bay: string;
  /** Officer-owned metadata stored on the shared appointment document. */
  counterNumber?: string;
  calledAt?: unknown;
  queuePosition?: number;
  waitTimeMinutes?: number;
  qualityCheck?: QualityCheck;
  weighment?: Weighment;
  paymentDbt?: PaymentDbt;
  receiptNumber?: string;
  notes?: string;
}

export interface CenterCapacity {
  dailyTargetQuintals: number;
  completedQuintals: number;
  queueCount: number;
  availableSlots: number;
  totalAppointmentsToday: number;
  storageCapacityMT: number;
  currentStorageMT: number;
  weighbridge1Status: 'Online' | 'Calibrating' | 'Offline';
  weighbridge2Status: 'Online' | 'Calibrating' | 'Offline';
}

export interface CenterMetrics {
  todayAppointments: number;
  checkedIn: number;
  pendingWeighments: number;
  completedProcurements: number;
  pendingDbt: number;
  totalDisbursedAmountLakhs: number;
  pendingDisbursementLakhs: number;
}

export interface AlertItem {
  id: string;
  type: 'moisture' | 'document' | 'duplicate' | 'payment';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  tokenNumber?: string;
  farmerName?: string;
  time: string;
  actionLabel: string;
  resolved: boolean;
}

export interface TimelineItem {
  id: string;
  type: 'checkin' | 'quality' | 'weighment' | 'procurement' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  tokenNumber: string;
  badge?: string;
}

export interface ProcurementOfficer {
  id: string;
  name: string;
  designation: string;
  mandiName: string;
  mandiCode: string;
  yardNumber: string;
  district: string;
  state: string;
  shift: string;
  avatarUrl?: string;
}

export interface MspSpec {
  msp: number;
  unit: string;
  maxMoisture: number;
}

export const MSP_RATES: Record<string, MspSpec> = {
  'Paddy': { msp: 2300, unit: '₹/Quintal (Grade A)', maxMoisture: 17.0 },
  'Wheat': { msp: 2275, unit: '₹/Quintal', maxMoisture: 12.0 },
  'Cotton': { msp: 7121, unit: '₹/Quintal (Medium)', maxMoisture: 12.0 },
  'Groundnut': { msp: 6783, unit: '₹/Quintal', maxMoisture: 8.0 },
  'Mustard': { msp: 5650, unit: '₹/Quintal', maxMoisture: 8.0 },
  'Soybean': { msp: 4892, unit: '₹/Quintal', maxMoisture: 12.0 },
};
