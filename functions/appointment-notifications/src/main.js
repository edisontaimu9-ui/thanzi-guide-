// Single source of truth for appointment notifications. Triggered directly
// by Appwrite database events on the `appointments` collection (create /
// update / delete) — NOT called by the client. This is Phase 2 of the
// notification-reliability fix: previously createNotification() only ran
// if the booking/cancelling user's own browser JS executed successfully,
// so any direct write to `appointments` (API, script, dropped connection
// mid-flow) silently created zero notifications. An event-triggered
// function fires on the write itself, regardless of what client (or lack
// of client) made it.
//
// Runs with a dynamic API key Appwrite injects automatically (via
// req.headers['x-appwrite-key']), scoped to whatever this function is
// granted in Appwrite Console > Functions > appointment-notifications >
// Settings > Scopes. Needs at least: databases.read, databases.write.
//
// Idempotency: every notification this function creates carries a
// `dedupeKey` (see scripts/apply-notification-dedupe-schema.sh for the
// unique index backing it). A retried event, an Appwrite delivery retry,
// or a race between two triggers for the same status transition all
// collide on the same key — the second create() gets rejected with 409 and
// is logged + swallowed rather than producing a duplicate notification.
//
// Status semantics: appointments.cancelledBy (added in Phase 1) is used
// generically here as "userId of whoever last changed status," not just
// for cancellations — it's how this function tells a provider-initiated
// change from a patient-initiated one.
//
// Known gap (tracked for Phase 3): cancelAppointment() in
// src/lib/providers.ts still hard-deletes the appointment document without
// ever setting cancelledBy first, and there is still no provider-side
// cancel path. That means every 'delete' event today can only be
// interpreted as "the patient cancelled" (see the delete branch below).
// Once Phase 3 adds provider-side cancel, appointment cancellation should
// switch to a soft-cancel (update status='cancelled' + cancelledBy) instead
// of a hard delete, so the 'update' branch — which already knows how to
// attribute a cancellation to either side — handles it instead of the
// delete fallback losing that information.

import { Client, Databases, ID } from 'node-appwrite';

const DATABASE_ID = 'thanzi_guide';
const PROVIDERS_COLLECTION_ID = 'providers';
const SLOTS_COLLECTION_ID = 'appointment_slots';
const NOTIFICATIONS_COLLECTION_ID = 'notifications';

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

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  const databases = new Databases(client);

  const action = parseEventAction(req.headers['x-appwrite-event']);
  if (!action) {
    log(`Ignoring non create/update/delete event: ${req.headers['x-appwrite-event']}`);
    return res.json({ success: true, skipped: true });
  }

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

  if (action === 'create') {
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

  if (action === 'update') {
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

  if (action === 'delete') {
    // See the "Known gap" note at the top of this file: today only patients
    // can cancel, and they do it via a hard delete that never sets
    // cancelledBy — so a delete event can only mean "patient cancelled."
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
    return res.json({ success: true });
  }

  return res.json({ success: true, skipped: true });
};
