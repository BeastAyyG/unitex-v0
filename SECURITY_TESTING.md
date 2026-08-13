# UniteX production security and pentest guide

## Goal

Ship only when the automated security gate is green, no High/Critical dependency findings remain, Firebase rules are deployed, and a non-destructive production smoke test confirms the public site, API, and media service send the expected protection headers and reject unauthenticated mutations.

## Required production configuration

Set these values in the matching deployment environment before enabling real users:

- Client Vercel project: the seven `VITE_FIREBASE_*` values and `VITE_API_URL`.
- Server Vercel project: `FIREBASE_SERVICE_ACCOUNT`, `CORS_ALLOWED_ORIGINS`, and `INTERNAL_API_KEY`.
- Media service host: Firebase Admin credentials and the same `CORS_ALLOWED_ORIGINS` value.

Do not put any Firebase Admin credential, internal API key, blockchain private key, or database URL in a `VITE_*` variable.

## Safe assessment process

1. Create a staging deployment that uses a separate Firebase project, database, media bucket/volume, blockchain wallet, and two disposable test accounts. Obtain written authorization and a time window before testing any public endpoint.
2. Run the GitHub **Security Gate** on every pull request. It builds the client, tests unauthenticated API denial, checks rules and headers, blocks High/Critical production dependency findings, scans for secrets, and runs CodeQL.
3. In Firebase emulators or staging, verify that account A cannot read or modify account B's private data, accept/reject B's requests, remove B's connections, award points, impersonate B in posts, upload under B's identity, or write protected feed/trending data.
4. Test upload boundaries only with harmless fixtures: an allowed small image/audio/video; an oversized file; a renamed executable; a valid extension with mismatched MIME; and an unauthenticated request. Expected outcomes are 2xx only for the allowed authenticated file, otherwise 401, 413, or 415.
5. Perform the production smoke test with GET/HEAD requests only: HTTPS redirect, security headers, content-security policy, health endpoint, no credentials in bundles, and 401/403 responses to deliberately unauthenticated mutation attempts. Do not fuzz, stress, or alter production data.

## Exit criteria

- GitHub Security Gate is green.
- Firebase rules are deployed and emulator/staging authorization tests pass.
- All High/Critical findings are fixed and retested; Medium/Low findings have an owner and due date.
- Vercel production has the required environment variables, least-privilege service account, CORS allowlists, and a separate staging configuration.
- The media service is reachable only over HTTPS, requires a Firebase ID token, validates file signatures, and stores data on durable storage rather than Vercel's ephemeral filesystem.
