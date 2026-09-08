// Two responsibilities live in this one function, kept together because
// the Appwrite plan on this project caps functions at 2 (this one +
// claim-provider-profile) — there's no budget for a third. Appwrite lets a
// single function be both event-triggered and directly executed, and the
// two invocation kinds are trivially distinguishable (see dispatch below),
// so there's no real downside to merging them beyond this file being
// longer than either half alone.
//
// 1. NOTIFICATIONS (event-triggered) — fires on Appwrite database events
//    (create/update/delete) on the `appointments` collection. This is
//    Phase 2 of the notification-reliability fix: previously
//    createNotification() only ran if the booking/cancelling user's own
//    browser JS executed successfully, so any direct write to
//    `appointments` (API, script, dropped connection mid-flow) silently
//    created zero notifications. An event-triggered function fires on the
//    write itself, regardless of what client (or lack of client) made it.
//
// 2. APPOINTMENT ACTIONS (manually executed) — Phase 3. The only path that
//    may change appointments.status. The `appointments` collection grants
//    no update() permission to anyone (see bookSlot() in
//    src/lib/providers.ts, which grants the patient only read+delete on
//    their own document) — status transitions need server-side
//    authorization the client SDK can't enforce ("only the provider this
//    appointment belongs to can confirm/reject it"). So confirm / reject /
//    reschedule / cancel all go through this function via
//    functions.createExecution(), identified by
//    req.headers['x-appwrite-user-id'] (set by Appwrite from the caller's
//    session — the client cannot forge this), the same pattern as
//    functions/claim-provider-profile.
//
//    Writing a status update from an action is itself a database write, so
//    it lands back here a second time — as a separate, event-triggered
//    invocation — and the notification half handles it same as any other
//    update. Action requests don't create notifications directly.
//
// Both halves run with the dynamic API key Appwrite injects automatically
// (req.headers['x-appwrite-key']), scoped to whatever this function is
// granted in Appwrite Console > Functions > Settings > Scopes. Needs at
// least: databases.read, databases.write. Execute permission needs
// "users" (not just admin/event-only) so action requests can reach it.
//
// Idempotency (notifications): every notification this function creates
// carries a `dedupeKey` (see scripts/apply-notification-dedupe-schema.sh
// for the unique index backing it). A retried event, an Appwrite delivery
// retry, or a race between two triggers for the same status transition all
// collide on the same key — the second create() gets rejected with 409 and
// is logged + swallowed rather than producing a duplicate notification.
//
// Status semantics: appointments.cancelledBy (added in Phase 1) is used
// generically as "userId of whoever last changed status," not just for
// cancellations — it's how the notification half tells a provider-
// initiated change from a patient-initiated one, and it's exactly what the
// action half writes on every transition.

import { Client, Databases, ID } from 'node-appwrite';

const DATABASE_ID = 'thanzi_guide';
const PROVIDERS_COLLECTION_ID = 'providers';
const SLOTS_COLLECTION_ID = 'appointment_slots';
const NOTIFICATIONS_COLLECTION_ID = 'notifications';
const APPOINTMENTS_COLLECTION_ID = 'appointments';

function formatSlotLabel(startTime) {
  if (!startTime) return 'their appointment';
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(startTime));
}

function parseEventAction(eventHeader) {
  if (!eventHeader) return null;
  if (eventHeader.endsWith('.create')) return 'create';
  if (eventHeader.endsWith('.update')) return 'update';
  if (eventHeader.endsWith('.delete')) return 'delete';
  return null;
}

function parsePayload(req) {
  if (req.bodyJson) return req.bodyJson;
  const raw = req.bodyText ?? req.body ?? '{}';
  if (!raw) return {};
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

// Creates a notification only if one with this dedupeKey doesn't already
// exist. Best-effort per notification: a failure to notify one side never
// blocks notifying the other, and never throws back to the caller (an
// Appwrite Function failing loudly on a notification hiccup would be worse
// than a missed notification that's at least logged).
async function notifyOnce(databases, { userId, title, body, link, dedupeKey }, log, error) {
  if (!userId) {
    log(`Skipping notification "${dedupeKey}" — no userId to notify.`);
    return;
  }
  try {
    await databases.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      { userId, title, body, link, read: false, dedupeKey },
      [`read("user:${userId}")`, `update("user:${userId}")`, `delete("user:${userId}")`]
    );
    log(`Notified ${userId}: "${title}" [${dedupeKey}]`);
  } catch (err) {
    const isDuplicate = err.code === 409 || /already exists/i.test(err.message ?? '');
    if (isDuplicate) {
      log(`Duplicate suppressed [${dedupeKey}] — already notified for this event.`);
      return;
    }
    error(`Failed to notify ${userId} [${dedupeKey}]: ${err.message}`);
  }
}

async function handleNotificationEvent({ req, res, log, error }, databases, eventAction) {
  let appointment;
  try {
    appointment = parsePayload(req);
  } catch (err) {
    error(`Failed to parse event payload: ${err.message}`);
    return res.json({ success: false, message: 'Bad event payload' }, 400);
  }

  const appointmentId = appointment.$id;
  if (!appointmentId || !appointment.providerId || !appointment.userId) {
    log('Event payload missing $id/providerId/userId — ignoring.');
    return res.json({ success: true, skipped: true });
  }

  let provider = null;
  try {
    provider = await databases.getDocument(DATABASE_ID, PROVIDERS_COLLECTION_ID, appointment.providerId);
  } catch (err) {
    log(`Could not load provider ${appointment.providerId}: ${err.message}`);
  }

  let slotLabel = 'their appointment';
  if (appointment.slotId) {
    try {
      const slot = await databases.getDocument(DATABASE_ID, SLOTS_COLLECTION_ID, appointment.slotId);
      slotLabel = formatSlotLabel(slot.startTime);
    } catch (err) {
      log(`Could not load slot ${appointment.slotId}: ${err.message}`);
    }
  }

  const patientUserId = appointment.userId;
  const providerUserId = provider?.userId ?? null;
  const providerName = provider?.name ?? 'your provider';
  const patientName = appointment.patientName ?? 'A patient';
  const status = appointment.status ?? 'booked';

  if (!providerUserId) {
    log(`Provider ${appointment.providerId} has no linked userId (profile not claimed) — provider-side notifications will be skipped.`);
  }

  if (eventAction === 'create') {
    await notifyOnce(
      databases,
      {
        userId: patientUserId,
        title: 'Appointment booked',
        body: `${slotLabel} with ${providerName}`,
        link: '/dashboard',
        dedupeKey: `${appointmentId}:created:patient`
      },
      log,
      error
    );
    await notifyOnce(
      databases,
      {
        userId: providerUserId,
        title: 'New appointment booked',
        body: `${patientName} booked ${slotLabel}`,
        link: '/provider',
        dedupeKey: `${appointmentId}:created:provider`
      },
      log,
      error
    );
    return res.json({ success: true });
  }

  if (eventAction === 'update') {
    const actor = appointment.cancelledBy;

    if (status === 'confirmed') {
      await notifyOnce(
        databases,
        {
          userId: patientUserId,
          title: 'Appointment confirmed',
          body: `${providerName} confirmed ${slotLabel}`,
          link: '/dashboard',
          dedupeKey: `${appointmentId}:confirmed:patient`
        },
        log,
        error
      );
    } else if (status === 'rejected') {
      await notifyOnce(
        databases,
        {
          userId: patientUserId,
          title: 'Appointment declined',
          body: `${providerName} couldn't confirm ${slotLabel}. Please book another slot.`,
          link: '/dashboard',
          dedupeKey: `${appointmentId}:rejected:patient`
        },
        log,
        error
      );
    } else if (status === 'rescheduled') {
      await notifyOnce(
        databases,
        {
          userId: patientUserId,
          title: 'Appointment needs rescheduling',
          body: `${providerName} requested a new time for ${slotLabel}. Check the app for details.`,
          link: '/dashboard',
          dedupeKey: `${appointmentId}:rescheduled:patient`
        },
        log,
        error
      );
    } else if (status === 'cancelled') {
      if (actor && providerUserId && actor === providerUserId) {
        await notifyOnce(
          databases,
          {
            userId: patientUserId,
            title: 'Appointment cancelled',
            body: `${providerName} cancelled ${slotLabel}.`,
            link: '/dashboard',
            dedupeKey: `${appointmentId}:cancelled:patient`
          },
          log,
          error
        );
      } else if (actor && actor === patientUserId) {
        await notifyOnce(
          databases,
          {
            userId: providerUserId,
            title: 'Appointment cancelled',
            body: `${patientName} cancelled ${slotLabel}.`,
            link: '/provider',
            dedupeKey: `${appointmentId}:cancelled:provider`
          },
          log,
          error
        );
      } else {
        // cancelledBy wasn't set (or doesn't match either side) — can't
        // attribute the change, so notify both rather than notifying no one.
        log(`cancelled status with unrecognized cancelledBy ("${actor}") — notifying both sides.`);
        await notifyOnce(
          databases,
          {
            userId: patientUserId,
            title: 'Appointment cancelled',
            body: `${slotLabel} with ${providerName} was cancelled.`,
            link: '/dashboard',
            dedupeKey: `${appointmentId}:cancelled:patient`
          },
          log,
          error
        );
        await notifyOnce(
          databases,
          {
            userId: providerUserId,
            title: 'Appointment cancelled',
            body: `${patientName}'s ${slotLabel} was cancelled.`,
            link: '/provider',
            dedupeKey: `${appointmentId}:cancelled:provider`
          },
          log,
          error
        );
      }
    } else {
      log(`Update event with no notification-worthy status ("${status}") — ignoring.`);
    }
    return res.json({ success: true });
  }

  if (eventAction === 'delete') {
    // Defensive fallback only — nothing in the app issues a hard delete
    // anymore (Phase 3 switched cancellation to a soft update), so this
    // shouldn't fire in normal use. Since we don't know who deleted it,
    // attribute the same way the 'update' branch's unrecognized-actor
    // case does: use cancelledBy if the deleted document happened to have
    // one set, otherwise notify both sides rather than guessing.
    const actor = appointment.cancelledBy;
    if (actor && providerUserId && actor === providerUserId) {
      await notifyOnce(
        databases,
        {
          userId: patientUserId,
          title: 'Appointment cancelled',
          body: `${providerName} cancelled ${slotLabel}.`,
          link: '/dashboard',
          dedupeKey: `${appointmentId}:cancelled:patient`
        },
        log,
        error
      );
    } else if (actor && actor === patientUserId) {
      await notifyOnce(
        databases,
        {
          userId: providerUserId,
          title: 'Appointment cancelled',
          body: `${patientName} cancelled ${slotLabel}.`,
          link: '/provider',
          dedupeKey: `${appointmentId}:cancelled:provider`
        },
        log,
        error
      );
    } else {
      log(`Deleted appointment with unrecognized cancelledBy ("${actor}") — notifying both sides.`);
      await notifyOnce(
        databases,
        {
          userId: patientUserId,
          title: 'Appointment cancelled',
          body: `${slotLabel} with ${providerName} was cancelled.`,
          link: '/dashboard',
          dedupeKey: `${appointmentId}:cancelled:patient`
        },
        log,
        error
      );
      await notifyOnce(
        databases,
        {
          userId: providerUserId,
          title: 'Appointment cancelled',
          body: `${patientName}'s ${slotLabel} was cancelled.`,
          link: '/provider',
          dedupeKey: `${appointmentId}:cancelled:provider`
        },
        log,
        error
      );
    }
    return res.json({ success: true });
  }

  return res.json({ success: true, skipped: true });
}

// action -> resulting status. 'cancel' is available to either side; the
// other three are provider-only.
const ACTION_STATUS = {
  confirm: 'confirmed',
  reject: 'rejected',
  reschedule: 'rescheduled',
  cancel: 'cancelled'
};

const PROVIDER_ONLY_ACTIONS = new Set(['confirm', 'reject', 'reschedule']);

async function handleAppointmentAction({ req, res, log, error }, databases) {
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
}

export default async (context) => {
  const { req, log } = context;
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const databases = new Databases(client);

  // Dispatch: Appwrite always sets x-appwrite-event on an event-triggered
  // invocation and never on a manual functions.createExecution() call, so
  // this header is a reliable way to tell the two invocation kinds apart.
  const eventAction = parseEventAction(req.headers['x-appwrite-event']);
  if (eventAction) {
    return handleNotificationEvent(context, databases, eventAction);
  }
  if (req.headers['x-appwrite-event']) {
    log(`Ignoring non create/update/delete event: ${req.headers['x-appwrite-event']}`);
    return context.res.json({ success: true, skipped: true });
  }

  return handleAppointmentAction(context, databases);
};
