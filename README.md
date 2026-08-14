# UnitX

UnitX is a community platform for learning, building, sharing progress, and connecting with other people.

**Live site:** [client-opal-five-77.vercel.app](https://client-opal-five-77.vercel.app)

## What it includes

- Activity feed, profiles, communities, events, messages, and notifications
- Firebase-backed authentication and real-time data
- Media upload service with image, audio, and video support
- Optional blockchain-based media proof records
- Responsive React interface for desktop and mobile

## Project structure

| Folder | Purpose |
| --- | --- |
| `client/` | React and Vite web application |
| `server/` | Express API and background jobs |
| `media-service/` | Docker-based media upload and processing service |
| `blockchain/` | Hardhat project and media-record contract |
| `data/` | Local data and supporting assets |

## Run locally

1. Install Node.js 22 or newer and copy `.env.example` to `.env`.
2. Install dependencies:

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

3. Start the web app:

   ```bash
   npm run dev --prefix client
   ```

4. Optionally start the API in another terminal:

   ```bash
   npm run dev --prefix server
   ```

The client runs at `http://localhost:3004` by default.

## Deployment

The web application is deployed from the `client/` folder to Vercel. The current public link is [client-opal-five-77.vercel.app](https://client-opal-five-77.vercel.app). The API is deployed from `server/` at [unitex-server.vercel.app](https://unitex-server.vercel.app); its public health check is [unitex-server.vercel.app/api/health](https://unitex-server.vercel.app/api/health).

For deployment instructions, required environment variables, and production checks, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) and [VERCEL_CHECKLIST.md](VERCEL_CHECKLIST.md).

### Supabase media storage

UnitX uses the free Supabase project `UnitX Storage` with a private `media` bucket. Firebase authenticates the user, the UnitX API creates a short-lived upload URL, and the browser uploads the file directly to Supabase. Keep `SUPABASE_SECRET_KEY` server-only; only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` belong in the client deployment. The supported media limit is 50 MB per file.

### Production requirements and known limits

- Google/email/phone login and authenticated media uploads remain in demo mode until the seven `VITE_FIREBASE_*` client variables and the server-only `FIREBASE_SERVICE_ACCOUNT` are configured in Vercel. Never commit the service account JSON.
- Set `CORS_ALLOWED_ORIGINS` to the exact public client origin (`https://client-opal-five-77.vercel.app`) and add any future custom domain explicitly.
- Connection and points persistence requires `DATABASE_URL`; without it, local/serverless fallback behavior is limited and should not be treated as production storage.
- The production branch is `agent/optimize-mobile-media`; pushes to it deploy the current public client and API projects.

## Documentation

Start with [DOCUMENTATION.md](DOCUMENTATION.md) for a guide to every project document.

## Security

Never commit `.env`, Firebase service-account files, API keys, database URLs, or blockchain private keys. Follow [SECURITY_TESTING.md](SECURITY_TESTING.md) before releasing changes to production.

## License

MIT
