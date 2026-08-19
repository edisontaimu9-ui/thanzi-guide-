import { databases, DB, ID, Query, Permission, Role, functions, FUNCTIONS } from '@/lib/appwrite';
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
  claimEmail?: string;
}

export interface SlotDoc extends Models.Document {
  providerId: string;
  startTime: string;
  durationMinutes?: number;
  notes?: string;
}

// 'booked' is the default for both new documents (via the attribute's
// Appwrite-side default) and pre-migration documents (backfilled by
// scripts/migrate-backfill-appointment-status.mjs). Older documents fetched
// before that migration runs may still come back with status undefined —
// callers should treat a missing status the same as 'booked', not as an
// error state.
export type AppointmentStatus = 'booked' | 'confirmed' | 'rejected' | 'rescheduled' | 'cancelled';

// Mirrors ACTION_STATUS in functions/appointment-notifications/src/main.js (the appointment-action half — see its header comment) — keep
// these in sync. 'confirm'/'reject'/'reschedule' are provider-only there;
// 'cancel' is allowed for either the patient or the provider on the
// appointment. The function is the actual authority on who's allowed to do
// what — this type just keeps the client from calling it with junk.
export type AppointmentAction = 'confirm' | 'reject' | 'reschedule' | 'cancel';

export interface AppointmentDoc extends Models.Document {
  userId: string;
  providerId: string;
  slotId: string;
  patientName: string;
  reason?: string;
  status?: AppointmentStatus;
  statusUpdatedAt?: string;
  // userId of whoever last changed status — compare against this
  // appointment's userId or the provider's userId to determine whether the
  // patient or the provider made the change, rather than trusting a
  // caller-supplied role label.
  cancelledBy?: string;
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
  // providerName and slotTimeLabel are no longer used here — kept as
  // params so call sites (e.g. ProviderDetail.tsx) don't need to change —
  // notification copy is now built server-side in
  // functions/appointment-notifications from the provider/slot documents
  // themselves, not from whatever the booking browser happened to pass in.
  void providerName;
  void slotTimeLabel;
  // Notifications for this create are handled entirely by
  // functions/appointment-notifications, triggered by the Appwrite database
  // event on this write — not by client code. See that function's header
  // comment for why (client-only notification calls silently no-op on any
  // non-browser write, and can't be relied on for debugging).
  return databases.createDocument<AppointmentDoc>(
    DB.databaseId,
    DB.collections.appointments,
    ID.unique(),
    { userId, providerId, slotId, patientName, reason },
    // Admin read access is granted at the collection level in Appwrite
    // Console (Settings > Permissions > Label: admin > Read), not here —
    // a regular user session isn't allowed to grant a label-based
    // permission on a document it creates.
    //
    // Deliberately no update() permission for the patient: status
    // transitions (including the patient's own cancel) go through
    // functions/appointment-notifications instead of a direct client write — see
    // updateAppointmentStatus() below.
    [Permission.read(Role.user(userId)), Permission.delete(Role.user(userId))]
  );
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

// The only way appointments.status ever changes — patient cancel, and every
// provider action (confirm/reject/reschedule/cancel), all go through
// functions/appointment-notifications. That function is the actual authority on
// who's allowed to make a given transition (see its ACTION_STATUS /
// PROVIDER_ONLY_ACTIONS); the message thrown here is just whatever it
// reported back.
//
// Writing the status update itself is what makes the notification fire —
// it's a normal document update, so it lands as an update event that
// functions/appointment-notifications (Phase 2) picks up on its own.
export async function updateAppointmentStatus(
  appointmentId: string,
  action: AppointmentAction
): Promise<AppointmentStatus> {
  const execution = await functions.createExecution(
    FUNCTIONS.appointmentAction,
    JSON.stringify({ appointmentId, action }),
    false
  );
  const result = JSON.parse(execution.responseBody);
  if (!result.success) {
    throw new Error(result.message ?? 'Something went wrong updating the appointment.');
  }
  return result.status as AppointmentStatus;
}

// Soft-cancel (Phase 3) — previously a hard delete. Available to whichever
// side (patient or provider) calls it; functions/appointment-notifications decides
// which, and functions/appointment-notifications tells the *other* side
// apart using the cancelledBy it writes. Kept as a thin wrapper (rather
// than having every call site say updateAppointmentStatus(id, 'cancel'))
// since "cancel" is the one action both Dashboard and ProviderInbox need.
export async function cancelAppointment(appointmentId: string): Promise<void> {
  await updateAppointmentStatus(appointmentId, 'cancel');
}
