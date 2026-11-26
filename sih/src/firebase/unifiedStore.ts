import {
  collection,
  doc,
  updateDoc,
  writeBatch,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './config';
import {
  Farmer,
  ProcurementCenter,
  Appointment,
  ProcurementTransaction,
  ServiceCenter,
  AppointmentStatus,
  ProcurementStatus,
  PaymentStatus,
} from '../types';
import {
  INITIAL_FARMERS,
  INITIAL_PROCUREMENT_CENTERS,
  INITIAL_APPOINTMENTS,
  INITIAL_PROCUREMENTS,
  INITIAL_SERVICE_CENTERS,
} from '../services/mockDataSeed';

// ----------------------------------------------------------------------
// Local Reactive Storage Engine (Emulates Firestore Pub/Sub real-time sync)
// ----------------------------------------------------------------------

const STORAGE_KEYS = {
  FARMERS: 'sih_farmers_db',
  CENTERS: 'sih_centers_db',
  APPOINTMENTS: 'sih_appointments_db',
  PROCUREMENTS: 'sih_procurements_db',
  SERVICES: 'sih_service_centers_db',
};

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('LocalStorage save error:', err);
  }
}

// In-memory active stores
let localFarmers: Record<string, Farmer> = {};
let localCenters: Record<string, ProcurementCenter> = {};
let localAppointments: Record<string, Appointment> = {};
let localProcurements: Record<string, ProcurementTransaction> = {};
let localServiceCenters: Record<string, ServiceCenter> = {};

// Listeners map for pub/sub reactivity
type ListenerCallback<T> = (data: T) => void;
const listeners = {
  appointments: new Set<ListenerCallback<Appointment[]>>(),
  centers: new Set<ListenerCallback<ProcurementCenter[]>>(),
  farmers: new Set<ListenerCallback<Farmer[]>>(),
  procurements: new Set<ListenerCallback<ProcurementTransaction[]>>(),
  farmerDoc: new Map<string, Set<ListenerCallback<Farmer | null>>>(),
  appointmentDoc: new Map<string, Set<ListenerCallback<Appointment | null>>>(),
  procurementDoc: new Map<string, Set<ListenerCallback<ProcurementTransaction | null>>>(),
};

export function initLocalStore(forceReset = false): void {
  if (forceReset) {
    localStorage.removeItem(STORAGE_KEYS.FARMERS);
    localStorage.removeItem(STORAGE_KEYS.CENTERS);
    localStorage.removeItem(STORAGE_KEYS.APPOINTMENTS);
    localStorage.removeItem(STORAGE_KEYS.PROCUREMENTS);
    localStorage.removeItem(STORAGE_KEYS.SERVICES);
  }

  const farmersArray = loadStorage<Farmer[]>(STORAGE_KEYS.FARMERS, INITIAL_FARMERS);
  const centersArray = loadStorage<ProcurementCenter[]>(STORAGE_KEYS.CENTERS, INITIAL_PROCUREMENT_CENTERS);
  const apptsArray = loadStorage<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  const procArray = loadStorage<ProcurementTransaction[]>(STORAGE_KEYS.PROCUREMENTS, INITIAL_PROCUREMENTS);
  const svcArray = loadStorage<ServiceCenter[]>(STORAGE_KEYS.SERVICES, INITIAL_SERVICE_CENTERS);

  localFarmers = Object.fromEntries(farmersArray.map((f) => [f.id, f]));
  localCenters = Object.fromEntries(centersArray.map((c) => [c.id, c]));
  localAppointments = Object.fromEntries(apptsArray.map((a) => [a.id, a]));
  localProcurements = Object.fromEntries(procArray.map((p) => [p.id, p]));
  localServiceCenters = Object.fromEntries(svcArray.map((s) => [s.id, s]));

  notifyAll();
}

function notifyAll(): void {
  const appts = Object.values(localAppointments);
  listeners.appointments.forEach((cb) => cb([...appts]));

  const centers = Object.values(localCenters);
  listeners.centers.forEach((cb) => cb([...centers]));

  const farmers = Object.values(localFarmers);
  listeners.farmers.forEach((cb) => cb([...farmers]));

  const procs = Object.values(localProcurements);
  listeners.procurements.forEach((cb) => cb([...procs]));

  listeners.farmerDoc.forEach((subscribers, id) => {
    const f = localFarmers[id] || null;
    subscribers.forEach((cb) => cb(f ? { ...f } : null));
  });

  listeners.appointmentDoc.forEach((subscribers, id) => {
    const a = localAppointments[id] || null;
    subscribers.forEach((cb) => cb(a ? { ...a } : null));
  });

  listeners.procurementDoc.forEach((subscribers, id) => {
    const p = localProcurements[id] || null;
    subscribers.forEach((cb) => cb(p ? { ...p } : null));
  });
}

// The browser-only store is exclusively for the unconfigured demo mode.
if (!isFirebaseConfigured) {
  initLocalStore(false);
}

// Firestore provides cross-tab synchronization in configured mode.
if (!isFirebaseConfigured && typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (Object.values(STORAGE_KEYS).includes(event.key || '')) {
      initLocalStore(false);
    }
  });
}

// ----------------------------------------------------------------------
// Unified Public Store API (Automatically routes to Firestore or Local Store)
// ----------------------------------------------------------------------

export const store = {
  // Reset demo data
  resetDemoData: async (): Promise<void> => {
    if (!isFirebaseConfigured) initLocalStore(true);
  },

  // 1. Service Centers / Operator Authentication
  getServiceCenter: async (centerId: string): Promise<ServiceCenter | null> => {
    if (isFirebaseConfigured && db) {
      const snap = await getDoc(doc(db, 'service_centers', centerId));
      if (snap.exists()) return snap.data() as ServiceCenter;
    }
    return localServiceCenters[centerId] || null;
  },

  getServiceCenterByOperatorEmail: async (email: string): Promise<ServiceCenter | null> => {
    const normalizedEmail = email.trim().toLowerCase();
    if (isFirebaseConfigured && db) {
      const emailQuery = query(collection(db, 'service_centers'), where('operatorEmail', '==', normalizedEmail));
      const result = await getDocs(emailQuery);
      if (!result.empty) return result.docs[0].data() as ServiceCenter;
    }

    return Object.values(localServiceCenters).find(
      (center) => center.operatorEmail?.toLowerCase() === normalizedEmail
    ) || null;
  },

  // 2. Real-time Procurement Centers Listener
  subscribeProcurementCenters: (callback: (centers: ProcurementCenter[]) => void): Unsubscribe => {
    if (isFirebaseConfigured && db) {
      const q = query(collection(db, 'procurement_centers'));
      return onSnapshot(q, (snapshot) => {
        // The document ID is the canonical procurement-center ID used by appointments.
        const data = snapshot.docs.map((d) => ({
          ...(d.data() as Omit<ProcurementCenter, 'id'>),
          id: d.id,
        }));
        callback(data);
      });
    }

    listeners.centers.add(callback);
    callback(Object.values(localCenters));
    return () => listeners.centers.delete(callback);
  },

  // 3. Real-time Appointments Listener
  subscribeAppointments: (
    callback: (appointments: Appointment[]) => void,
    dateFilter?: string
  ): Unsubscribe => {
    if (isFirebaseConfigured && db) {
      let q = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
      if (dateFilter) {
        q = query(collection(db, 'appointments'), where('appointmentDate', '==', dateFilter));
      }
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((d) => d.data() as Appointment);
        callback(data);
      });
    }

    const filteredCallback = (appts: Appointment[]) => {
      let result = appts;
      if (dateFilter) {
        result = result.filter((a) => a.appointmentDate === dateFilter);
      }
      callback([...result].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)));
    };

    listeners.appointments.add(filteredCallback);
    filteredCallback(Object.values(localAppointments));
    return () => listeners.appointments.delete(filteredCallback);
  },

  // 4. Real-time Individual Appointment Listener
  subscribeAppointmentById: (
    appointmentId: string,
    callback: (appt: Appointment | null) => void
  ): Unsubscribe => {
    if (!appointmentId) {
      callback(null);
      return () => {};
    }

    if (isFirebaseConfigured && db) {
      return onSnapshot(doc(db, 'appointments', appointmentId), (snap) => {
        callback(snap.exists() ? (snap.data() as Appointment) : null);
      });
    }

    if (!listeners.appointmentDoc.has(appointmentId)) {
      listeners.appointmentDoc.set(appointmentId, new Set());
    }
    const set = listeners.appointmentDoc.get(appointmentId)!;
    set.add(callback);
    callback(localAppointments[appointmentId] ? { ...localAppointments[appointmentId] } : null);

    return () => {
      set.delete(callback);
      if (set.size === 0) listeners.appointmentDoc.delete(appointmentId);
    };
  },

  // 5. Real-time Procurement Transaction Listener
  subscribeProcurementById: (
    procurementId: string,
    callback: (proc: ProcurementTransaction | null) => void
  ): Unsubscribe => {
    if (!procurementId) {
      callback(null);
      return () => {};
    }

    if (isFirebaseConfigured && db) {
      return onSnapshot(doc(db, 'procurements', procurementId), (snap) => {
        callback(snap.exists() ? (snap.data() as ProcurementTransaction) : null);
      });
    }

    if (!listeners.procurementDoc.has(procurementId)) {
      listeners.procurementDoc.set(procurementId, new Set());
    }
    const set = listeners.procurementDoc.get(procurementId)!;
    set.add(callback);
    callback(localProcurements[procurementId] ? { ...localProcurements[procurementId] } : null);

    return () => {
      set.delete(callback);
      if (set.size === 0) listeners.procurementDoc.delete(procurementId);
    };
  },

  // 6. Farmer Search & Retrieval
  findFarmer: async (queryStr: string): Promise<Farmer | null> => {
    const rawQuery = queryStr.trim();
    const clean = queryStr.trim().toUpperCase();
    const cleanDigits = queryStr.replace(/\D/g, '');
    const normalizedName = rawQuery.replace(/\s+/g, ' ').toLocaleLowerCase();

    if (isFirebaseConfigured && db) {
      // Auth UID lookup is useful for the farmer-facing portal.
      const direct = await getDoc(doc(db, 'farmers', rawQuery));
      if (direct.exists()) return direct.data() as Farmer;

      const publicIdQuery = query(collection(db, 'farmers'), where('officialFarmerId', '==', clean));
      const publicIdResult = await getDocs(publicIdQuery);
      if (!publicIdResult.empty) return publicIdResult.docs[0].data() as Farmer;

      // Assisted-portal lookup by registered mobile number.
      if (cleanDigits.length >= 10) {
        const q = query(collection(db, 'farmers'), where('mobileNumber', '==', cleanDigits));
        const res = await getDocs(q);
        if (!res.empty) return res.docs[0].data() as Farmer;
      }

      // Names are matched locally after retrieval so existing records work without a data migration.
      const farmersSnapshot = await getDocs(collection(db, 'farmers'));
      const nameMatch = farmersSnapshot.docs.find((farmerDoc) => {
        const name = (farmerDoc.data() as Farmer).name;
        return typeof name === 'string' && name.trim().replace(/\s+/g, ' ').toLocaleLowerCase() === normalizedName;
      });
      if (nameMatch) return nameMatch.data() as Farmer;
    }

    // Local lookup
    const all = Object.values(localFarmers);
    const found = all.find(
      (f) =>
        f.id.toUpperCase() === clean ||
        f.officialFarmerId.toUpperCase() === clean ||
        (cleanDigits.length >= 10 && f.mobileNumber === cleanDigits) ||
        f.name.trim().replace(/\s+/g, ' ').toLocaleLowerCase() === normalizedName
    );
    return found ? { ...found } : null;
  },

  // 7. Check Duplicate Farmer
  checkDuplicateFarmer: async (
    officialFarmerId: string,
    mobileNumber: string
  ): Promise<{ exists: boolean; reason?: string }> => {
    const cleanId = officialFarmerId.trim().toUpperCase();
    const cleanMobile = mobileNumber.replace(/\D/g, '');

    if (isFirebaseConfigured && db) {
      const farmerIdQuery = query(collection(db, 'farmers'), where('officialFarmerId', '==', cleanId));
      const farmerIdResult = await getDocs(farmerIdQuery);
      if (!farmerIdResult.empty) {
        return { exists: true, reason: `Farmer with ID ${cleanId} already registered in the central system.` };
      }
      const qMobile = query(collection(db, 'farmers'), where('mobileNumber', '==', cleanMobile));
      const mobileSnap = await getDocs(qMobile);
      if (!mobileSnap.empty) {
        return { exists: true, reason: `Mobile number ${cleanMobile} is already associated with farmer: ${mobileSnap.docs[0].data().name}` };
      }
    }

    const all = Object.values(localFarmers);
    const duplicateId = all.find((f) => f.officialFarmerId.toUpperCase() === cleanId);
    if (duplicateId) {
      return { exists: true, reason: `Farmer with ID ${cleanId} already registered in system (${duplicateId.name}).` };
    }

    const duplicateMobile = all.find((f) => f.mobileNumber === cleanMobile);
    if (duplicateMobile) {
      return { exists: true, reason: `Mobile number ${cleanMobile} is already linked with farmer: ${duplicateMobile.name}.` };
    }

    return { exists: false };
  },

  // 8. Register New Farmer (Permanent Identity)
  createFarmer: async (farmer: Farmer, authEmail?: string): Promise<void> => {
    if (isFirebaseConfigured && db) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', farmer.id), {
        role: 'farmer',
        createdAt: farmer.createdAt,
        createdBy: auth?.currentUser?.uid || null,
      });
      batch.set(doc(db, 'farmers', farmer.id), {
        ...farmer,
        farmerUid: farmer.id,
        farmerId: farmer.farmerId || farmer.officialFarmerId,
        phone: farmer.phone || farmer.mobileNumber,
        address: farmer.address || `${farmer.village}, ${farmer.district}, ${farmer.state}`,
      });
      if (authEmail) {
        const farmerKey = `farmer_id_${farmer.officialFarmerId.toLowerCase()}`;
        const mobileKey = `mobile_${farmer.mobileNumber.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')}`;
        const loginRecord = { uid: farmer.id, authEmail, createdAt: farmer.createdAt };
        batch.set(doc(db, 'farmer_login_identifiers', farmerKey), loginRecord);
        batch.set(doc(db, 'farmer_login_identifiers', mobileKey), loginRecord);
      }
      await batch.commit();
      return;
    }

    localFarmers[farmer.id] = { ...farmer };
    saveStorage(STORAGE_KEYS.FARMERS, Object.values(localFarmers));
    notifyAll();
  },

  // 9. Update Farmer Profile
  updateFarmer: async (farmerId: string, partial: Partial<Farmer>): Promise<void> => {
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'farmers', farmerId), partial);
      return;
    }

    if (localFarmers[farmerId]) {
      localFarmers[farmerId] = { ...localFarmers[farmerId], ...partial, updatedAt: new Date().toISOString() };
      saveStorage(STORAGE_KEYS.FARMERS, Object.values(localFarmers));
      notifyAll();
    }
  },

  // 10. Book Appointment & Create Procurement Record
  createAppointment: async (appointment: Appointment): Promise<void> => {
    if (!appointment.centerId?.trim()) {
      throw new Error('Cannot create appointment: selected procurement center ID is missing.');
    }

    const requiredAppointmentFields: Array<keyof Appointment> = [
      'id',
      'tokenNumber',
      'farmerId',
      'farmerName',
      'farmerMobile',
      'farmerVillage',
      'centerName',
      'crop',
      'quantity',
      'unit',
      'appointmentDate',
      'timeSlot',
      'bookedByCenterId',
      'status',
      'statusHistory',
      'createdAt',
      'updatedAt',
    ];
    const missingFields = requiredAppointmentFields.filter((field) => {
      const value = appointment[field];
      return value === undefined || value === null || (typeof value === 'string' && !value.trim());
    });
    if (missingFields.length > 0) {
      throw new Error(`Cannot create appointment: required fields missing: ${missingFields.join(', ')}.`);
    }

    // Procurement records are created and controlled by officers after intake.
    const procurementId = appointment.procurementId || `PROC-${appointment.id.replace('APT-', '')}`;
    const initialProcurement: ProcurementTransaction = {
      id: procurementId,
      appointmentId: appointment.id,
      farmerId: appointment.farmerId,
      tokenNumber: appointment.tokenNumber,
      centerId: appointment.centerId,
      crop: appointment.crop,
      procurementStatus: 'pending',
      paymentStatus: 'pending',
      notes: `Appointment confirmed for ${appointment.appointmentDate} (${appointment.timeSlot}).`,
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'appointments', appointment.id), {
        ...appointment,
        appointmentId: appointment.id,
        procurementCenterId: appointment.centerId,
        bookedByAssistantUid: auth?.currentUser?.uid || null,
        status: 'Pending',
        updatedAt: new Date().toISOString(),
      });
      batch.update(doc(db, 'farmers', appointment.farmerId), {
        activeAppointmentId: appointment.id,
        activeProcurementId: procurementId,
        updatedAt: new Date().toISOString(),
      });
      await batch.commit();
      return;
    }

    localAppointments[appointment.id] = { ...appointment };
    localProcurements[procurementId] = { ...initialProcurement };

    // Update farmer
    if (localFarmers[appointment.farmerId]) {
      localFarmers[appointment.farmerId].activeAppointmentId = appointment.id;
      localFarmers[appointment.farmerId].activeProcurementId = procurementId;
      saveStorage(STORAGE_KEYS.FARMERS, Object.values(localFarmers));
    }

    // Update center capacity
    if (localCenters[appointment.centerId]) {
      const c = localCenters[appointment.centerId];
      c.currentQueue = (c.currentQueue || 0) + 1;
      c.availableSlots = Math.max(0, c.availableSlots - 1);
      c.status = c.availableSlots <= 2 ? 'Busy' : 'Available';
      saveStorage(STORAGE_KEYS.CENTERS, Object.values(localCenters));
    }

    saveStorage(STORAGE_KEYS.APPOINTMENTS, Object.values(localAppointments));
    saveStorage(STORAGE_KEYS.PROCUREMENTS, Object.values(localProcurements));
    notifyAll();
  },

  // 11. Real-time Status Update (Simulating Officer / Mandi Intake)
  updateAppointmentStatus: async (
    appointmentId: string,
    status: AppointmentStatus,
    updatedBy: string,
    notes?: string
  ): Promise<void> => {
    const now = new Date().toISOString();
    const historyEntry = { status, updatedAt: now, updatedBy, notes };

    if (isFirebaseConfigured && db) {
      const aSnap = await getDoc(doc(db, 'appointments', appointmentId));
      if (aSnap.exists()) {
        const curr = aSnap.data() as Appointment;
        await updateDoc(doc(db, 'appointments', appointmentId), {
          status,
          statusHistory: [...(curr.statusHistory || []), historyEntry],
          updatedAt: now,
        });
      }
    }

    if (localAppointments[appointmentId]) {
      const curr = localAppointments[appointmentId];
      curr.status = status;
      curr.statusHistory = [...(curr.statusHistory || []), historyEntry];
      curr.updatedAt = now;

      // When completed, decrement queue
      if (status === 'Completed' || status === 'Cancelled') {
        const c = localCenters[curr.centerId];
        if (c && c.currentQueue > 0) {
          c.currentQueue -= 1;
          saveStorage(STORAGE_KEYS.CENTERS, Object.values(localCenters));
        }
      }

      saveStorage(STORAGE_KEYS.APPOINTMENTS, Object.values(localAppointments));
      notifyAll();
    }
  },

  // 12. Officer Procurement Progression. Payment settlement is a separate action.
  updateProcurementStatus: async (
    procurementId: string,
    procurementStatus: ProcurementStatus,
    paymentStatus?: PaymentStatus,
    extra?: Partial<ProcurementTransaction>
  ): Promise<void> => {
    const now = new Date().toISOString();
    const updatePayload: Partial<ProcurementTransaction> = {
      procurementStatus,
      ...(procurementStatus === 'completed' && !paymentStatus ? { paymentStatus: 'pending' } : {}),
      ...(paymentStatus ? { paymentStatus } : {}),
      ...(extra || {}),
      updatedAt: now,
    };

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'procurements', procurementId), updatePayload);
    }

    if (localProcurements[procurementId]) {
      localProcurements[procurementId] = {
        ...localProcurements[procurementId],
        ...updatePayload,
      };
      saveStorage(STORAGE_KEYS.PROCUREMENTS, Object.values(localProcurements));
      notifyAll();
    }
  },

  // Count helper for dashboard stats
  getDailyStatistics: (dateStr: string) => {
    const appts = Object.values(localAppointments);
    const dayAppts = appts.filter((a) => a.appointmentDate === dateStr);
    const farmers = Object.values(localFarmers);

    return {
      farmersAssisted: farmers.length,
      newRegistrations: farmers.filter((f) => f.createdAt.startsWith(dateStr)).length,
      appointmentsBooked: dayAppts.length,
      pendingRequests: dayAppts.filter(
        (a) => a.status === 'Booked' || a.status === 'Checked In' || a.status === 'Waiting'
      ).length,
      completedRequests: dayAppts.filter((a) => a.status === 'Completed').length,
    };
  },
};
