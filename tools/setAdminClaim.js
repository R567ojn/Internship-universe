#!/usr/bin/env node
/* ============================================================
   setAdminClaim · grants the `admin: true` custom claim that the
   Firestore rules trust. Custom claims are a server-side (Admin
   SDK) operation — the browser can never grant them, which is
   exactly why a student cannot reach Admin by typing a URL.
   ------------------------------------------------------------
   CONFIGURATION REQUIRED: you must point this at your own
   Firebase service-account key. Do NOT commit the key.

     1. Firebase console → Project settings → Service accounts
        → "Generate new private key" → download the JSON.
     2. Run (PowerShell):
          $env:GOOGLE_APPLICATION_CREDENTIALS = "C:\path\to\serviceAccount.json"
          node tools/setAdminClaim.js --email you@internhub.cm
        or pass the key path directly:
          node tools/setAdminClaim.js --key ./serviceAccount.json --uid <UID>

   The service-account path is a required input; it is intentionally
   not hardcoded anywhere in this repository.
   ============================================================ */

const admin = require('firebase-admin');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--key') out.key = argv[++i];
    else if (a === '--email') out.email = argv[++i];
    else if (a === '--uid') out.uid = argv[++i];
    else if (a === '--revoke') out.revoke = true;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);

  if (args.key) {
    admin.initializeApp({ credential: admin.credential.cert(require(require('path').resolve(args.key))) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({ credential: admin.credential.applicationDefault() });
  } else {
    console.error('CONFIGURATION_REQUIRED: set GOOGLE_APPLICATION_CREDENTIALS or pass --key <path-to-service-account.json>');
    process.exit(2);
  }

  if (!args.email && !args.uid) {
    console.error('Pass --email <user@example.com> or --uid <UID> of the account to change.');
    process.exit(2);
  }

  const user = args.uid
    ? await admin.auth().getUser(args.uid)
    : await admin.auth().getUserByEmail(args.email);

  const claim = args.revoke ? { admin: null } : { admin: true };
  await admin.auth().setCustomUserClaims(user.uid, claim);

  console.log(`${args.revoke ? 'Revoked' : 'Granted'} admin claim for ${user.email || user.uid} (${user.uid}).`);
  console.log('The user must sign out and back in (or refresh their ID token) for the change to take effect.');
}

main().catch((err) => { console.error('Failed:', err.message); process.exit(1); });
