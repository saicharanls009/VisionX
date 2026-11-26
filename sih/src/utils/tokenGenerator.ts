/**
 * Disambiguated Identifier Generators
 *
 * Distinct ID Types:
 * 1. Farmer ID: Permanent lifetime identity (e.g. FID-BHARAT-3210 or DEMO-FARMER-001)
 * 2. Appointment ID: Unique per booking (e.g. APT-2026-00045)
 * 3. Procurement ID: Unique per weighing & inspection intake (e.g. PROC-2026-00045)
 * 4. Queue Token: Daily center-specific queue number (e.g. B-024)
 */

export function generateFarmerId(name: string, mobileNumber: string): string | null {
  const firstName = name.trim().split(/\s+/)[0].replace(/[^a-z0-9]/gi, '').slice(0, 10).toUpperCase();
  const mobileDigits = mobileNumber.replace(/\D/g, '');

  if (!firstName || mobileDigits.length !== 10) return null;

  return `FID-${firstName}-${mobileDigits.slice(-4)}`;
}

export function generateAppointmentId(): string {
  const year = new Date().getFullYear();
  // 5 digit sequence
  const randomSeq = Math.floor(10000 + Math.random() * 90000);
  return `APT-${year}-${randomSeq}`;
}

export function generateProcurementId(appointmentId?: string): string {
  if (appointmentId && appointmentId.startsWith('APT-')) {
    return appointmentId.replace('APT-', 'PROC-');
  }
  const year = new Date().getFullYear();
  const randomSeq = Math.floor(10000 + Math.random() * 90000);
  return `PROC-${year}-${randomSeq}`;
}

export function generateQueueToken(centerCode: string, dailyCount: number): string {
  const code = (centerCode || 'C').toUpperCase();
  const nextSeq = String(dailyCount + 1).padStart(3, '0');
  return `${code}-${nextSeq}`;
}
