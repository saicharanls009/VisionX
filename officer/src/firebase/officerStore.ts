import { collection, doc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import type { CenterCapacity, QueueItem, QueueStatus } from '../types/procurement';
import { db } from './config';

type SharedAppointment = Record<string, unknown>;
type SharedFarmer = Record<string, unknown>;
type SharedProcurement = Record<string, unknown>;
type SharedProcurementCenter = Record<string, unknown>;

export interface SettlementRecord {
  id: string;
  procurementId: string;
  farmerId: string;
  farmerName: string;
  appointmentId: string;
  crop: string;
  expectedQuantity: number;
  actualQuantity: number;
  procurementStatus: string;
  paymentStatus: string;
  paymentAmount?: number;
  completionDate?: unknown;
  settlementDate?: unknown;
  paymentReference?: string;
}

const subscriptions = new Map<string, SharedAppointment>();

function asText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' ? value : fallback;
}

function mapStatus(status: string): QueueStatus {
  return status === 'Pending' ? 'Booked' : (status as QueueStatus);
}

function appointmentCenterId(appointment: SharedAppointment): string {
  return asText(appointment.centerId, asText(appointment.procurementCenterId));
}

function slotStartMinutes(slot: unknown): number {
  const match = asText(slot).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)\b/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === 'PM') hour += 12;
  return hour * 60 + Number(match[2]);
}

function timestampMillis(value: unknown): number {
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
  }
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return Number.MAX_SAFE_INTEGER;
}

function isActiveQueueStatus(status: string): boolean {
  return !['Completed', 'Cancelled'].includes(mapStatus(status));
}

/**
 * Officer-only queue order: appointment date, slot start, creation time, then ID.
 * Positions are written only to the corresponding existing appointment documents.
 */
async function updateCenterQueuePositions(centerId: string): Promise<void> {
  if (!db || !centerId) return;
  const snapshot = await getDocs(collection(db, 'appointments'));
  const queued = snapshot.docs
    .filter(item => {
      const appointment = item.data() as SharedAppointment;
      return appointmentCenterId(appointment) === centerId && isActiveQueueStatus(asText(appointment.status, 'Pending'));
    })
    .sort((left, right) => {
      const a = left.data() as SharedAppointment;
      const b = right.data() as SharedAppointment;
      const byDate = asText(a.appointmentDate).localeCompare(asText(b.appointmentDate));
      if (byDate) return byDate;
      const bySlot = slotStartMinutes(a.timeSlot) - slotStartMinutes(b.timeSlot);
      if (bySlot) return bySlot;
      const byCreated = timestampMillis(a.createdAt) - timestampMillis(b.createdAt);
      return byCreated || left.id.localeCompare(right.id);
    });

  const batch = writeBatch(db);
  queued.forEach((appointment, index) => {
    batch.set(appointment.ref, { queuePosition: index + 1 }, { merge: true });
  });
  await batch.commit();
}

function toQueueItem(
  appointment: SharedAppointment,
  farmer: SharedFarmer,
  procurement: SharedProcurement | undefined,
  appointmentId: string
): QueueItem {
  const quantity = asNumber(appointment.quantity);
  const unit = asText(appointment.unit, 'kg');
  const estimatedQuantityQuintals = unit === 'kg' ? quantity / 100 : unit === 'ton' ? quantity * 10 : quantity;
  const netWeightKg = asNumber(procurement?.netWeightKg);

  return {
    id: appointmentId,
    tokenNumber: asText(appointment.tokenNumber, appointmentId),
    centerId: asText(appointment.centerId, asText(appointment.procurementCenterId)),
    farmer: {
      id: asText(farmer.farmerId, asText(farmer.officialFarmerId, asText(appointment.farmerId))),
      authUid: asText(appointment.farmerId),
      name: asText(farmer.name, asText(appointment.farmerName, 'Farmer')),
      fatherName: '',
      mobile: asText(farmer.mobileNumber, asText(farmer.phone, asText(appointment.farmerMobile))),
      village: asText(farmer.village, asText(appointment.farmerVillage)),
      panchayat: '',
      district: asText(farmer.district),
      state: asText(farmer.state),
      aadhaarMasked: '',
      kisanCreditCard: '',
      bankName: '',
      bankAccountMasked: '',
      ifsc: '',
      landHoldingAcres: 0,
      khasraNumber: '',
      agriStackVerified: false,
    },
    crop: asText(appointment.crop, 'Paddy') as QueueItem['crop'],
    variety: '',
    appointmentTime: asText(appointment.appointmentDate),
    appointmentSlot: 'Morning (08:00 - 11:00)',
    estimatedQuantityQuintals,
    actualQuantityQuintals: asNumber(procurement?.actualQuantity, netWeightKg ? netWeightKg / 100 : undefined),
    vehicleNumber: '',
    vehicleType: '',
    status: mapStatus(asText(appointment.status, 'Pending')),
    bay: asText(appointment.centerName, asText(appointment.procurementCenterId)),
    counterNumber: asText(appointment.counterNumber) || undefined,
    calledAt: appointment.calledAt,
    queuePosition: typeof appointment.queuePosition === 'number' ? appointment.queuePosition : undefined,
    qualityCheck: procurement?.moisturePercentage ? {
      moisturePct: asNumber(procurement.moisturePercentage),
      standardMoisturePct: 14,
      foreignMatterPct: 0,
      damagedGrainsPct: 0,
      immatureGrainsPct: 0,
      grade: asText(procurement.qualityGrade, 'FAQ') as QueueItem['qualityCheck'] extends infer T ? T extends { grade: infer G } ? G : never : never,
      moistureCutDeductionPct: 0,
      labTechnician: '',
      testedAt: asText(procurement.updatedAt),
    } : undefined,
    paymentDbt: procurement ? {
      mspRatePerQuintal: 0,
      grossPayable: asNumber(procurement.totalAmount),
      gunnyAllowance: 0,
      qualityDeduction: 0,
      netPayable: asNumber(procurement.totalAmount),
      dbtStatus: asText(procurement.paymentStatus).toLowerCase() === 'settled' ? 'Credited' : 'Pending',
      pfmsReferenceNumber: asText(procurement.paymentReference),
      accountValidated: false,
    } : undefined,
  };
}

export function subscribeToOfficerQueue(
  callback: (items: QueueItem[]) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) return () => undefined;

  const farmers = new Map<string, SharedFarmer>();
  const procurements = new Map<string, SharedProcurement>();

  const emit = () => callback(
    [...subscriptions.entries()].map(([id, appointment]) =>
      toQueueItem(appointment, farmers.get(asText(appointment.farmerId)) || {}, procurements.get(id), id)
    )
  );

  const stopAppointments = onSnapshot(collection(db, 'appointments'), (snapshot) => {
    subscriptions.clear();
    snapshot.docs.forEach((item) => subscriptions.set(item.id, item.data()));
    emit();
  }, onError);
  const stopFarmers = onSnapshot(collection(db, 'farmers'), (snapshot) => {
    farmers.clear();
    snapshot.docs.forEach((item) => farmers.set(item.id, item.data()));
    emit();
  }, onError);
  const stopProcurements = onSnapshot(collection(db, 'procurements'), (snapshot) => {
    procurements.clear();
    snapshot.docs.forEach((item) => procurements.set(asText(item.data().appointmentId), item.data()));
    emit();
  }, onError);

  return () => {
    stopAppointments();
    stopFarmers();
    stopProcurements();
  };
}

export function subscribeToOfficerCenterCapacity(
  callback: (capacity: Partial<CenterCapacity>) => void,
  onError: (error: Error) => void
): Unsubscribe {
  if (!db) return () => undefined;

  return onSnapshot(collection(db, 'procurement_centers'), (snapshot) => {
    if (snapshot.empty) return;

    const centers = snapshot.docs.map((item) => item.data() as SharedProcurementCenter);
    const total = (field: string) => centers.reduce((sum, center) => sum + asNumber(center[field]), 0);
    const first = centers[0];
    const weighbridgeStatus = (field: string): CenterCapacity['weighbridge1Status'] => {
      const value = asText(first[field], 'Online');
      return value === 'Calibrating' || value === 'Offline' ? value : 'Online';
    };

    const capacity: Partial<CenterCapacity> = {
      dailyTargetQuintals: total('dailyCapacity'),
      completedQuintals: total('completedQuintals'),
      queueCount: total('currentQueue'),
      availableSlots: total('availableSlots'),
      totalAppointmentsToday: total('totalAppointmentsToday'),
    };
    const storageCapacityMT = total('storageCapacityMT');
    if (storageCapacityMT > 0) {
      capacity.storageCapacityMT = storageCapacityMT;
      capacity.currentStorageMT = total('currentStorageMT');
    }
    if (asText(first.weighbridge1Status)) capacity.weighbridge1Status = weighbridgeStatus('weighbridge1Status');
    if (asText(first.weighbridge2Status)) capacity.weighbridge2Status = weighbridgeStatus('weighbridge2Status');

    callback(capacity);
  }, onError);
}

export async function saveOfficerWorkflow(item: QueueItem, officerId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  const now = new Date().toISOString();
  const procurementId = `PROC-${item.id.replace(/^APT-/, '')}`;
  const netWeightKg = item.weighment?.netWeightKg ?? (item.actualQuantityQuintals || 0) * 100;
  // Payment settlement is deliberately separate from physical procurement.
  // Completing a lot always creates a pending payment; it is never auto-settled.
  const procurementCompleted = item.status === 'Completed';

  const appointmentUpdate: Record<string, unknown> = {
    status: item.status,
    updatedAt: now,
  };
  if (item.counterNumber) appointmentUpdate.counterNumber = item.counterNumber;
  if (item.status === 'Called' && !item.calledAt) appointmentUpdate.calledAt = serverTimestamp();
  await setDoc(doc(db, 'appointments', item.id), appointmentUpdate, { merge: true });

  await updateCenterQueuePositions(item.centerId || '');

  await setDoc(doc(db, 'procurements', procurementId), {
    procurementId,
    appointmentId: item.id,
    // The visible farmer ID is a registry number; Firestore relationships use the Auth UID.
    farmerId: item.farmer.authUid || item.farmer.id,
    tokenNumber: item.tokenNumber,
    centerId: item.centerId || '',
    crop: item.crop,
    expectedQuantity: item.estimatedQuantityQuintals,
    actualQuantity: item.actualQuantityQuintals || 0,
    grossWeightKg: item.weighment?.grossWeightKg || 0,
    tareWeightKg: item.weighment?.tareWeightKg || 0,
    netWeightKg,
    moisturePercentage: item.qualityCheck?.moisturePct || 0,
    qualityGrade: item.qualityCheck?.grade || 'FAQ',
    totalAmount: item.paymentDbt?.netPayable || 0,
    paymentReference: item.paymentDbt?.pfmsReferenceNumber || '',
    procurementStatus: procurementCompleted ? 'completed' : item.status === 'Processing' ? 'weighing' : 'verification',
    ...(procurementCompleted ? {
      paymentStatus: 'pending',
      procurementCompletionDate: serverTimestamp(),
    } : {}),
    updatedAt: now,
    createdAt: now,
    updatedBy: officerId,
  }, { merge: true });
}

function toSettlementRecord(id: string, procurement: SharedProcurement, farmer: SharedFarmer): SettlementRecord {
  const paymentStatus = asText(procurement.paymentStatus).toLowerCase();
  return {
    id,
    procurementId: asText(procurement.procurementId, id),
    farmerId: asText(procurement.farmerId),
    farmerName: asText(farmer.name, asText(procurement.farmerName, 'Farmer')),
    appointmentId: asText(procurement.appointmentId),
    crop: asText(procurement.crop),
    expectedQuantity: asNumber(procurement.expectedQuantity),
    actualQuantity: asNumber(procurement.actualQuantity),
    procurementStatus: asText(procurement.procurementStatus),
    // Legacy completed records without paymentStatus are safely presented as pending.
    paymentStatus: paymentStatus || 'pending',
    paymentAmount: typeof procurement.paymentAmount === 'number' ? procurement.paymentAmount : asNumber(procurement.totalAmount, undefined),
    completionDate: procurement.procurementCompletionDate ?? procurement.completedAt ?? procurement.updatedAt,
    settlementDate: procurement.settlementDate,
    paymentReference: asText(procurement.paymentReference),
  };
}

export function subscribeToOfficerSettlements(
  callback: (records: SettlementRecord[]) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  if (!db) return () => undefined;

  const farmers = new Map<string, SharedFarmer>();
  const procurements = new Map<string, SharedProcurement>();
  const emit = () => callback([...procurements.entries()]
    .map(([id, procurement]) => toSettlementRecord(id, procurement, farmers.get(asText(procurement.farmerId)) || {}))
    .filter((record) => record.procurementStatus.toLowerCase() === 'completed')
    .sort((a, b) => String(b.completionDate ?? '').localeCompare(String(a.completionDate ?? ''))));

  const stopProcurements = onSnapshot(collection(db, 'procurements'), (snapshot) => {
    procurements.clear();
    snapshot.docs.forEach((item) => procurements.set(item.id, item.data()));
    emit();
  }, onError);
  const stopFarmers = onSnapshot(collection(db, 'farmers'), (snapshot) => {
    farmers.clear();
    snapshot.docs.forEach((item) => farmers.set(item.id, item.data()));
    emit();
  }, onError);

  return () => { stopProcurements(); stopFarmers(); };
}

export async function settleOfficerPayment(procurementDocumentId: string, officerId: string): Promise<void> {
  if (!db) throw new Error('Firebase is not configured.');
  await updateDoc(doc(db, 'procurements', procurementDocumentId), {
    paymentStatus: 'settled',
    settlementDate: serverTimestamp(),
    updatedAt: serverTimestamp(),
    updatedBy: officerId,
  });
}
