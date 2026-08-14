# UnitX documentation

This page is the starting point for maintaining and deploying UnitX.

| Document | Use it for |
| --- | --- |
| [README.md](README.md) | Project overview, local setup, and live-site link |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Services, data flow, media upload flow, and blockchain integration |
| [WALKTHROUGH.md](WALKTHROUGH.md) | Product walkthrough and feature overview |
| [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) | Deploying the client and server to Vercel |
| [VERCEL_CHECKLIST.md](VERCEL_CHECKLIST.md) | Production release checklist |
| [SECURITY_TESTING.md](SECURITY_TESTING.md) | Safe security testing and production hardening steps |
| [PROJECT_STATUS.md](PROJECT_STATUS.md) | Completed setup work and project history |
| [.env.example](.env.example) | Required configuration names without any secrets |

## Live environment

- Website: [unitx-app.vercel.app](https://unitx-app.vercel.app)
- Frontend deployment folder: `client/`
- API deployment folder: `server/`

## Before making a release

1. Run `npm run lint --prefix client`.
2. Run `npm run build --prefix client`.
3. Review `SECURITY_TESTING.md` and confirm the production environment variables are configured.
4. Deploy the client and verify the live website on both desktop and mobile.

## Secrets policy

Keep all secrets out of GitHub. Use `.env` locally and Vercel environment variables in production. The `.env.example` file documents the variable names only.
