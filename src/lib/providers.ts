import { databases, DB, ID, Query, Permission, Role } from '@/lib/appwrite';
import { createNotification } from '@/lib/notifications';
import type { Models } from 'appwrite';

export interface ProviderDoc extends Models.Document {
  name: string;
  title: string;
  specialty?: string;
  bio?: string;
  photoUrl?: string;
  location?: string;
  phone?: string;
  whatsapp?: string;
  status: string;
  userId?: string;
}

export interface SlotDoc extends Models.Document {
  providerId: string;
  startTime: string;
  durationMinutes?: number;
  notes?: string;
}

export interface AppointmentDoc extends Models.Document {
  userId: string;
  providerId: string;
  slotId: string;
  patientName: string;
  reason?: string;
}

export async function listProviders(): Promise<ProviderDoc[]> {
  const res = await databases.listDocuments<ProviderDoc>(DB.databaseId, DB.collections.providers, [
    Query.equal('status', 'active'),
    Query.limit(50)
  ]);
  return res.documents;
}

export async function getProvider(id: string): Promise<ProviderDoc | null> {
  try {
    return await databases.getDocument<ProviderDoc>(DB.databaseId, DB.collections.providers, id);
  } catch {
    return null;
  }
}

// Finds the provider record linked to a logged-in account, so a provider's
// own inbox knows which appointments belong to them. Returns null if this
// account isn't linked to a provider (an admin sets providers.userId to
// link one up).
export async function getProviderByUserId(userId: string): Promise<ProviderDoc | null> {
  const res = await databases.listDocuments<ProviderDoc>(DB.databaseId, DB.collections.providers, [
    Query.equal('userId', userId),
    Query.limit(1)
  ]);
  return res.documents[0] ?? null;
}

// All future slots for a provider, booked or not — callers filter out
// booked ones using listBookedSlotIds() so we only need two requests
// instead of one per slot.
export async function listUpcomingSlots(providerId: string): Promise<SlotDoc[]> {
  const res = await databases.listDocuments<SlotDoc>(DB.databaseId, DB.collections.appointmentSlots, [
    Query.equal('providerId', providerId),
    Query.greaterThan('startTime', new Date().toISOString()),
    Query.orderAsc('startTime'),
    Query.limit(100)
  ]);
  return res.documents;
}

// A slot counts as booked purely by an appointments document existing for
// it (see the unique index on slotId) — cancelling deletes that document,
// which frees the slot again. No separate "isBooked" flag to keep in sync.
export async function listBookedSlotIds(providerId: string): Promise<Set<string>> {
  const res = await databases.listDocuments<AppointmentDoc>(DB.databaseId, DB.collections.appointments, [
    Query.equal('providerId', providerId),
    Query.limit(500)
  ]);
  return new Set(res.documents.map((a) => a.slotId));
}

export async function bookSlot(
  userId: string,
  providerId: string,
  slotId: string,
  patientName: string,
  reason: string,
  providerName: string,
  slotTimeLabel: string
): Promise<AppointmentDoc> {
  const appointment = await databases.createDocument<AppointmentDoc>(
    DB.databaseId,
    DB.collections.appointments,
    ID.unique(),
    { userId, providerId, slotId, patientName, reason },
    // Admin read access is granted at the collection level in Appwrite
    // Console (Settings > Permissions > Label: admin > Read), not here —
    // a regular user session isn't allowed to grant a label-based
    // permission on a document it creates.
    [Permission.read(Role.user(userId)), Permission.delete(Role.user(userId))]
  );
  // Best-effort — a failed notification shouldn't undo a successful booking.
  try {
    await createNotification(
      userId,
      'Appointment booked',
      `${slotTimeLabel} with ${providerName}`,
      '/dashboard'
    );
  } catch {
    // ignore
  }
  return appointment;
}

export async function getSlot(id: string): Promise<SlotDoc | null> {
  try {
    return await databases.getDocument<SlotDoc>(DB.databaseId, DB.collections.appointmentSlots, id);
  } catch {
    return null;
  }
}

// Providers add their own slots. Grants themselves update/delete on it —
// safe to self-grant since it's their own identity, no admin step needed.
export async function createSlot(params: {
  providerId: string;
  createdByUserId: string;
  startTime: string;
  durationMinutes: number;
  notes?: string;
}): Promise<SlotDoc> {
  const { providerId, createdByUserId, startTime, durationMinutes, notes } = params;
  return databases.createDocument<SlotDoc>(
    DB.databaseId,
    DB.collections.appointmentSlots,
    ID.unique(),
    { providerId, startTime, durationMinutes, notes: notes ?? '' },
    [Permission.update(Role.user(createdByUserId)), Permission.delete(Role.user(createdByUserId))]
  );
}

export async function deleteSlot(id: string): Promise<void> {
  await databases.deleteDocument(DB.databaseId, DB.collections.appointmentSlots, id);
}

// Checks whether a slot has an appointment booked against it, so the
// provider UI can warn before deleting (or block it) rather than silently
// orphaning a patient's booking.
export async function isSlotBooked(slotId: string): Promise<boolean> {
  const res = await databases.listDocuments<AppointmentDoc>(DB.databaseId, DB.collections.appointments, [
    Query.equal('slotId', slotId),
    Query.limit(1)
  ]);
  return res.documents.length > 0;
}

export async function listMyAppointments(userId: string): Promise<AppointmentDoc[]> {
  const res = await databases.listDocuments<AppointmentDoc>(DB.databaseId, DB.collections.appointments, [
    Query.equal('userId', userId),
    Query.limit(50)
  ]);
  return res.documents;
}

// For a provider's own inbox — appointments booked with them, across all
// patients. Relies on the appointments collection's current read("users")
// permission (any signed-in user can list appointments); this isn't
// document-scoped to the provider specifically, worth tightening later.
export async function listAppointmentsForProvider(providerId: string): Promise<AppointmentDoc[]> {
  const res = await databases.listDocuments<AppointmentDoc>(DB.databaseId, DB.collections.appointments, [
    Query.equal('providerId', providerId),
    Query.limit(100)
  ]);
  return res.documents;
}

export async function getAppointment(id: string): Promise<AppointmentDoc | null> {
  try {
    return await databases.getDocument<AppointmentDoc>(DB.databaseId, DB.collections.appointments, id);
  } catch {
    return null;
  }
}

export async function cancelAppointment(appointmentId: string): Promise<void> {
  await databases.deleteDocument(DB.databaseId, DB.collections.appointments, appointmentId);
}
