// Lets a signed-in user "claim" their provider profile: matches their
// account email against a provider document's claimEmail field, and if
// exactly one unclaimed match is found, links that provider to their
// account and grants them permission to edit their own profile going
// forward.
//
// Runs with a dynamic API key Appwrite injects automatically (via
// req.headers['x-appwrite-key']) — scoped to whatever permissions this
// function is granted in its settings, no static key stored anywhere.
//
// Triggered by the client via functions.createExecution(), which
// automatically passes the caller's identity — see req.headers
// ['x-appwrite-user-id'].

import { Client, Databases, Users, Query } from 'node-appwrite';

const DATABASE_ID = 'thanzi_guide';
const COLLECTION_ID = 'providers';

export default async ({ req, res, log, error }) => {
  const userId = req.headers['x-appwrite-user-id'];
  if (!userId) {
    return res.json({ success: false, message: 'You need to be signed in to claim a provider profile.' }, 401);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const databases = new Databases(client);
  const users = new Users(client);

  let account;
  try {
    account = await users.get(userId);
  } catch (err) {
    error(`Failed to look up calling user: ${err.message}`);
    return res.json({ success: false, message: 'Could not verify your account.' }, 500);
  }

  const email = account.email;
  if (!email) {
    return res.json({ success: false, message: 'Your account has no email on file to match against.' });
  }

  let matches;
  try {
    matches = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
      Query.equal('claimEmail', email),
      Query.limit(10)
    ]);
  } catch (err) {
    error(`Failed to query providers: ${err.message}`);
    return res.json({ success: false, message: 'Something went wrong looking up provider profiles.' }, 500);
  }

  const unclaimed = matches.documents.filter((doc) => !doc.userId);

  if (unclaimed.length === 0) {
    return res.json({
      success: false,
      message: 'No unclaimed provider profile matches your account email. Ask an admin to set one up for you.'
    });
  }

  if (unclaimed.length > 1) {
    return res.json({
      success: false,
      message: 'More than one provider profile matches your email. Ask an admin to resolve this.'
    });
  }

  const provider = unclaimed[0];

  try {
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_ID,
      provider.$id,
      { userId },
      [`read("user:${userId}")`, `update("user:${userId}")`]
    );
  } catch (err) {
    error(`Failed to link provider ${provider.$id}: ${err.message}`);
    return res.json({ success: false, message: 'Found a match but failed to link it. Try again.' }, 500);
  }

  log(`Linked provider ${provider.$id} (${provider.name}) to user ${userId}.`);

  return res.json({
    success: true,
    providerId: provider.$id,
    providerName: provider.name,
    message: `Linked to ${provider.name}. You can now manage your profile and inbox.`
  });
};
