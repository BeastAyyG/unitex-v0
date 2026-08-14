# UnitX

UnitX is a community platform for learning, building, sharing progress, and connecting with other people.

**Live site:** [unitx-app.vercel.app](https://unitx-app.vercel.app)

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

1. Install Node.js 20 or newer and copy `.env.example` to `.env`.
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

The web application is deployed from the `client/` folder to Vercel. The current public link is [unitx-app.vercel.app](https://unitx-app.vercel.app).

For deployment instructions, required environment variables, and production checks, see [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) and [VERCEL_CHECKLIST.md](VERCEL_CHECKLIST.md).

## Documentation

Start with [DOCUMENTATION.md](DOCUMENTATION.md) for a guide to every project document.

## Security

Never commit `.env`, Firebase service-account files, API keys, database URLs, or blockchain private keys. Follow [SECURITY_TESTING.md](SECURITY_TESTING.md) before releasing changes to production.

## License

MIT
