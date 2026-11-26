import {
  Appointment,
  Farmer,
  ProcurementCenter,
  ProcurementTransaction,
  ServiceCenter,
} from '../types';

// The portal starts with an empty dataset. Add real records through the
// assistance workflow or connect Firebase to use a shared central database.
export const INITIAL_SERVICE_CENTERS: ServiceCenter[] = [
  {
    id: 'OC-001',
    name: 'Village Service Center - Rajkot',
    operatorUsername: 'rajkot_operator_1',
    operatorEmail: 'rajkot.operator@example.com',
    operatorName: 'Rajkot Center Operator',
    village: 'Gondal Road Village',
    district: 'Rajkot',
    state: 'Gujarat',
    contactNumber: '0281-245899',
    isActive: true,
  },
  {
    id: 'OC-002',
    name: 'CSC Center - Jasdan Taluka',
    operatorUsername: 'jasdan_operator_1',
    operatorEmail: 'jasdan.operator@example.com',
    operatorName: 'Rameshbhai Dave',
    village: 'Jasdan Town',
    district: 'Rajkot',
    state: 'Gujarat',
    contactNumber: '0282-522104',
    isActive: true,
  },
];

export const INITIAL_PROCUREMENT_CENTERS: ProcurementCenter[] = [
  {
    id: 'PC-CENTER-A',
    code: 'A',
    name: 'Procurement Center A - Rajkot APMC Yard',
    district: 'Rajkot',
    distanceKm: 6.4,
    dailyCapacity: 120,
    currentQueue: 0,
    availableSlots: 120,
    expectedWaitMinutes: 0,
    status: 'Available',
    operatingHours: { open: '08:00 AM', close: '05:00 PM' },
    slotDurationMinutes: 30,
  },
  {
    id: 'PC-CENTER-B',
    code: 'B',
    name: 'Procurement Center B - Gondal Mandi',
    district: 'Rajkot',
    distanceKm: 14.2,
    dailyCapacity: 100,
    currentQueue: 0,
    availableSlots: 100,
    expectedWaitMinutes: 0,
    status: 'Available',
    operatingHours: { open: '08:30 AM', close: '05:30 PM' },
    slotDurationMinutes: 30,
  },
  {
    id: 'PC-CENTER-C',
    code: 'C',
    name: 'Procurement Center C - Morbi Agro Yard',
    district: 'Morbi',
    distanceKm: 34,
    dailyCapacity: 80,
    currentQueue: 0,
    availableSlots: 80,
    expectedWaitMinutes: 0,
    status: 'Available',
    operatingHours: { open: '09:00 AM', close: '06:00 PM' },
    slotDurationMinutes: 30,
  },
];
export const INITIAL_FARMERS: Farmer[] = [];
export const INITIAL_APPOINTMENTS: Appointment[] = [];
export const INITIAL_PROCUREMENTS: ProcurementTransaction[] = [];
