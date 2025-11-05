# Yotube-clone-backendJSProject

This repository contains the backend for a YouTube-like project built with Node.js, Express and MongoDB. It provides APIs for user auth, video management, comments (with nested replies), subscriptions, likes, playlists and basic dashboard endpoints.
## Table of contents
- Project overview
- Features
- Prerequisites
- Quick start (Windows PowerShell)
- Environment variables
- Available scripts
- API overview (route prefixes)
- Folder structure
- Security & accidental secrets
- Contributing
- License

## Project overview

This project implements a RESTful backend for a video-sharing application. It uses:
- Node.js + Express (ES Modules)
- MongoDB + Mongoose
- Cloudinary for media storage
- JWT-based authentication

The codebase is intentionally small and focused on core backend functionality so it is easy to extend for production features.

## Features

- User registration and authentication
- Video upload (via Cloudinary)
- Comments with nested replies and pagination
- Like/unlike videos
- Subscribe/unsubscribe to channels
- Playlists
- Dashboard endpoints for channel statistics and channel videos
- Health-check endpoint

## Prerequisites

- Node.js (recommended >= 18)
- npm (comes with Node.js)
- MongoDB (Atlas or local)
- Java (only if you use BFG for history purge; otherwise not required)

## Quick start (PowerShell)

Open PowerShell in the repo root and run:

```powershell
# install deps
npm install

# create a `.env` file at project root with required variables (see below)

# run in development (nodemon watches src/index.js)
npm run dev
```

The dev script runs `nodemon --experimental-json-modules src/index.js` (see `package.json`).

## Environment variables

Create a `.env` file in the project root with the following keys (example names used by the code):

- MONGODB_URI - MongoDB connection string (without database name), e.g. `mongodb://127.0.0.1:27017`
- DB_NAME - optional, default is `videotube` (see `src/constants.js`)
- ACCESS_TOKEN_SECRET - secret for signing JWT access tokens
- CLOUDINARY_CLOUD_NAME - Cloudinary cloud name
- CLOUDINARY_API_KEY - Cloudinary API key
- CLOUDINARY_API_SECRET - Cloudinary API secret
- CORS_ORIGIN - allowed origin for CORS

Example `.env` (DO NOT commit this file):

```
MONGODB_URI=mongodb://127.0.0.1:27017
ACCESS_TOKEN_SECRET=replace_with_secure_secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CORS_ORIGIN=http://localhost:3000
```

## Available scripts

- `npm run dev` - start app with nodemon (development)

## API overview (main route prefixes)

The app mounts route modules under `/api/v1/`.

- `/api/v1/users` - user auth, profile
- `/api/v1/videos` - video CRUD and streaming-related endpoints
- `/api/v1/tweet` - tweet-like feature (project-specific)
- `/api/v1/subscription` - subscribe/unsubscribe
- `/api/v1/healthChecker` - health-check endpoint
- `/api/v1/playlist` - playlist management
- `/api/v1/comment` - comments and replies (nested)
- `/api/v1/like` - likes for videos
- `/api/v1/dashboard` - channel stats and channel videos (requires `:channelId`)

Notes:
- Dashboard endpoints require a channelId in the path. Example:
	- `GET /api/v1/dashboard/stats/<channelId>`
	- `GET /api/v1/dashboard/<channelId>`

## Folder structure (important files)

Top-level in `src/`:

- `app.js` - Express app and route registration
- `index.js` - server bootstrap and DB connect
- `controllers/` - request handlers
- `routes/` - express routers
- `models/` - Mongoose models
- `utils/` - helpers (apiResponse, cloudinary, error wrappers)
- `middelewares/` - auth and multer middleware





## Testing and linting

There are no automated tests included in the repo at the moment. Consider adding a small test suite (Jest / Supertest) for critical endpoints (auth, comment pagination, subscription toggle).

## Contributing

If you plan to extend this project:

- Keep secrets out of the repo; use `.env` for environment-specific values.
- Add unit/integration tests for features you change.
- Run Prettier to keep code formatting consistent.

## Contact / Notes

If you want me to:

- Add a more detailed API reference (endpoint-by-endpoint examples)
- Add sample Postman collection or curl examples

Tell me which of the above you'd like next and I will prepare it.

---

_Generated README — feel free to ask for edits or additional sections (e.g., database migration, CI/CD, deployment, or Postman collection)._ 

