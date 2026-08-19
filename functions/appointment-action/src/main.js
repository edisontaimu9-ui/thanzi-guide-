// Phase 3: the only path that may change appointments.status.
//
// The `appointments` collection has no update() permission at all — not at
// the collection level, not per-document (see bookSlot() in
// src/lib/providers.ts, which grants the patient only read+delete on their
// own document). That's deliberate: status transitions are exactly the kind
// of write that needs server-side authorization instead of trusting whoever
// holds a session, and the client SDK has no way to enforce "only the
// provider this appointment belongs to can confirm/reject it."
//
// So both provider actions (confirm/reject/reschedule/cancel) and the
// patient's own cancel go through this function instead of a direct
// databases.updateDocument() call from the browser. Same pattern as
// functions/claim-provider-profile: runs with the dynamic API key Appwrite
// injects (req.headers['x-appwrite-key']), and identifies the caller via
// req.headers['x-appwrite-user-id'], which Appwrite sets from the session
// that called functions.createExecution() — the client cannot forge this.
//
// This function only ever writes `status`, `statusUpdatedAt`, and
// `cancelledBy` (cancelledBy is used generically here as "userId of whoever
// last changed status," matching the convention set in Phase 1/2 — see
// providers.ts and functions/appointment-notifications). Writing that
// update is enough to trigger functions/appointment-notifications' update
// handler, so this function does not create notifications itself — that
// stays the single responsibility of Phase 2's event-triggered function.
//
// Needs at least: databases.read, databases.write (same scopes as
// appointment-notifications).

import { Client, Databases } from 'node-appwrite';

const DATABASE_ID = 'thanzi_guide';
const APPOINTMENTS_COLLECTION_ID = 'appointments';
const PROVIDERS_COLLECTION_ID = 'providers';

// action -> resulting status. 'cancel' is available to either side; the
// other three are provider-only (see the authorization check below).
const ACTION_STATUS = {
  confirm: 'confirmed',
  reject: 'rejected',
  reschedule: 'rescheduled',
  cancel: 'cancelled'
};

const PROVIDER_ONLY_ACTIONS = new Set(['confirm', 'reject', 'reschedule']);

function parsePayload(req) {
  if (req.bodyJson) return req.bodyJson;
  const raw = req.bodyText ?? req.body ?? '{}';
  if (!raw) return {};
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export default async ({ req, res, log, error }) => {
  const callerUserId = req.headers['x-appwrite-user-id'];
  if (!callerUserId) {
    return res.json({ success: false, message: 'You need to be signed in to do that.' }, 401);
  }

  let body;
  try {
    body = parsePayload(req);
  } catch (err) {
    error(`Failed to parse request body: ${err.message}`);
    return res.json({ success: false, message: 'Bad request.' }, 400);
  }

  const { appointmentId, action } = body;
  const nextStatus = ACTION_STATUS[action];
  if (!appointmentId || !nextStatus) {
    return res.json(
      { success: false, message: `Unknown action "${action}". Expected one of: ${Object.keys(ACTION_STATUS).join(', ')}.` },
      400
    );
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const databases = new Databases(client);

  let appointment;
  try {
    appointment = await databases.getDocument(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, appointmentId);
  } catch (err) {
    log(`Appointment ${appointmentId} not found: ${err.message}`);
    return res.json({ success: false, message: 'Appointment not found.' }, 404);
  }

  const isPatient = callerUserId === appointment.userId;

  let isProvider = false;
  if (!isPatient || PROVIDER_ONLY_ACTIONS.has(action)) {
    try {
      const provider = await databases.getDocument(DATABASE_ID, PROVIDERS_COLLECTION_ID, appointment.providerId);
      isProvider = Boolean(provider.userId) && provider.userId === callerUserId;
    } catch (err) {
      log(`Could not load provider ${appointment.providerId}: ${err.message}`);
    }
  }

  if (PROVIDER_ONLY_ACTIONS.has(action) && !isProvider) {
    return res.json({ success: false, message: 'Only the provider for this appointment can do that.' }, 403);
  }
  if (action === 'cancel' && !isPatient && !isProvider) {
    return res.json({ success: false, message: 'You are not part of this appointment.' }, 403);
  }

  // Terminal states — nothing left to transition from.
  if (appointment.status === 'cancelled' || appointment.status === 'rejected') {
    return res.json({ success: false, message: `This appointment is already ${appointment.status}.` }, 409);
  }

  try {
    const updated = await databases.updateDocument(DATABASE_ID, APPOINTMENTS_COLLECTION_ID, appointmentId, {
      status: nextStatus,
      statusUpdatedAt: new Date().toISOString(),
      cancelledBy: callerUserId
    });
    log(`${callerUserId} set appointment ${appointmentId} to "${nextStatus}" (action: ${action}).`);
    return res.json({ success: true, status: updated.status });
  } catch (err) {
    error(`Failed to update appointment ${appointmentId}: ${err.message}`);
    return res.json({ success: false, message: 'Something went wrong updating the appointment.' }, 500);
  }
};
