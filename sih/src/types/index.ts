export type PreferredLanguage = 'en' | 'hi' | 'gu';

export type AppointmentStatus =
  | 'Pending'
  | 'Booked'
  | 'Checked In'
  | 'Waiting'
  | 'Called'
  | 'Processing'
  | 'Completed'
  | 'Cancelled';

export type ProcurementStatus =
  | 'Pending'
  | 'Verification'
  | 'Crop Verified'
  | 'Weighing'
  | 'Quality Check'
  | 'Approved'
  | 'Completed'
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'rejected';

export type PaymentStatus = 'Pending' | 'Processing' | 'Paid' | 'pending' | 'settled';

export type CenterAvailabilityStatus = 'Available' | 'Busy' | 'Full';

export interface CropInfo {
  id: string;
  cropName: string;
  variety?: string;
  estimatedQuantity: number;
  unit: 'kg' | 'quintal' | 'ton';
  harvestPeriod: string;
  preferredDate?: string;
  registeredAt: string;
}

export interface Farmer {
  id: string; // Firebase Authentication UID in Firebase mode
  farmerUid?: string; // Mirrors the document ID for rule validation and future Farmer Portal queries
  farmerId?: string; // Public permanent farmer registry identifier
  officialFarmerId: string; // System-generated permanent farmer identity
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  mobileNumber: string;
  village: string;
  district: string;
  state: string;
  preferredLanguage: PreferredLanguage;
  registeredByCenterId?: string; // "OC-001"
  crops: CropInfo[];
  activeAppointmentId?: string | null;
  activeProcurementId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementCenter {
  id: string; // "PC-CENTER-A", "PC-CENTER-B", "PC-CENTER-C"
  code: string; // "A", "B", "C"
  name: string; // "Procurement Center B - Gondal Mandi"
  district: string;
  distanceKm: number;
  dailyCapacity: number;
  currentQueue: number;
  availableSlots: number;
  expectedWaitMinutes: number;
  status: CenterAvailabilityStatus;
  operatingHours: { open: string; close: string };
  slotDurationMinutes: number;
}

export interface StatusHistoryEntry {
  status: string;
  updatedAt: string;
  updatedBy: string;
  notes?: string;
}

export interface Appointment {
  id: string; // "APT-2026-00045" (unique for appointment)
  appointmentId?: string;
  tokenNumber: string; // "B-024" (center daily queue token)
  farmerId: string; // "DEMO-FARMER-001" (permanent identity)
  farmerName: string;
  farmerMobile: string;
  farmerVillage: string;
  centerId: string;
  procurementCenterId?: string;
  centerName: string;
  crop: string;
  quantity: number;
  unit: string;
  appointmentDate: string; // "2026-09-22"
  timeSlot: string; // "10:30 AM - 11:00 AM"
  bookedByCenterId: string; // "OC-001"
  status: AppointmentStatus;
  statusHistory: StatusHistoryEntry[];
  procurementId?: string; // "PROC-2026-00045"
  createdAt: string;
  updatedAt: string;
}

export interface ProcurementTransaction {
  id: string; // "PROC-2026-00045"
  procurementId?: string;
  appointmentId: string; // "APT-2026-00045"
  farmerId: string; // "DEMO-FARMER-001"
  tokenNumber: string; // "B-024"
  centerId: string;
  crop: string;
  expectedQuantity?: number;
  actualQuantity?: number;
  variety?: string;
  grossWeightKg?: number;
  tareWeightKg?: number;
  netWeightKg?: number;
  moisturePercentage?: number;
  qualityGrade?: 'FAQ' | 'Grade A' | 'Grade B' | 'Rejected';
  mspPerKg?: number;
  totalAmount?: number;
  procurementStatus: ProcurementStatus;
  paymentStatus: PaymentStatus;
  paymentAmount?: number;
  settlementDate?: string;
  paymentReference?: string;
  notes?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface ServiceCenter {
  id: string; // "OC-001"
  name: string; // "Village Service Center - Rajkot"
  operatorUsername: string;
  operatorEmail?: string;
  operatorName: string;
  village: string;
  district: string;
  state: string;
  contactNumber: string;
  isActive: boolean;
}

export interface OperatorSession {
  isAuthenticated: boolean;
  centerId: string;
  centerName: string;
  operatorUsername: string;
  operatorName: string;
}

export interface DailyStatistics {
  farmersAssisted: number;
  newRegistrations: number;
  appointmentsBooked: number;
  pendingRequests: number;
  completedRequests: number;
}
