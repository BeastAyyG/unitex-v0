# UniteX

A minimalist social learning platform built with Swiss design principles.

## Features

- **Progress Feed** - Share what you're learning and building
- **Spaces** - Join communities around topics
- **Roadmaps** - Structured learning paths with progress tracking
- **Events** - Attend and reflect on learning events
- **Vault** - Private space for saved content (dark mode)
- **Gamification** - XP and badges for consistent effort

## Tech Stack

- **Frontend**: React 18 + Vite 5
- **Backend**: Node.js 20 + Express 4
- **Database**: PostgreSQL 15
- **Containerization**: Docker Compose

## Getting Started

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Gmail account with App Password (for OTP)
- 
### Quick Start

```bash
# Start database and API
docker-compose up -d

# Start frontend (in new terminal)
cd client
npm install
npm run dev
```
### Access

-   **Frontend**: http://localhost:3004
-   **API**: http://localhost:5002/api/health

## Environment Variables

Copy `.env.example` to `.env` and configure:
```
DOCKER_USERNAME=your_docker_username
DOCKER_PASSWORD=your_docker_password
VITE_API_URL=http://localhost:5000
DATABASE_URL=postgres://user:password@localhost:5432/unitex
PORT=5000
```

## Design System

- Swiss Minimalism aesthetic
- High-contrast white/black palette with orange accent
- DM Sans typography
- 64px icon-only sidebar
- 3-step interactive onboarding

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Light Gray | `#F4F5F5` | Background |
| Silver | `#EBEDEE` | Surfaces |
| Dark | `#31303A` | Text |
| Orange | `#F4511C` | Accent |
| Coral | `#FF7F50` | Secondary |

## CI/CD

This project uses GitHub Actions to automatically build and push Docker images on every push to `main`. See `.github/workflows/docker-publish.yml`.

> Add `DOCKER_USERNAME` and `DOCKER_PASSWORD` to your GitHub repository Secrets.

## License

MIT
