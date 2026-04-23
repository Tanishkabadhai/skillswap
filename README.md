# SkillSwap

SkillSwap is a full-stack skill exchange platform built with HTML, CSS, JavaScript, Node.js, Express.js, and MySQL. Users can register, manage profiles, publish skills, send exchange requests, chat with other users, complete exchanges, rate each other, and report issues. Admins can review platform data, manage users, and process reports.

## Tech Stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js, Express.js
- Database: MySQL
- Authentication: JWT
- Architecture: REST API

## Folder Structure

```text
skillswap/
├── database/
│   └── schema.sql
├── public/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── src/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── authRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── messageRoutes.js
│   │   ├── profileRoutes.js
│   │   ├── ratingRoutes.js
│   │   ├── reportRoutes.js
│   │   ├── requestRoutes.js
│   │   └── skillRoutes.js
│   └── utils/
│       └── helpers.js
├── .env.example
├── package.json
└── server.js
```

## Setup

1. Create a MySQL database and execute [database/schema.sql](/C:/Users/ADMIN/Documents/Codex/2026-04-23-create-a-fully-functional-full-stack/database/schema.sql).
2. Copy `.env.example` to `.env` and update the database credentials and JWT secret.
3. Install dependencies:

```bash
npm install
```

4. Start the app:

```bash
npm start
```

5. Open [http://localhost:5000](http://localhost:5000).

## REST API Routes

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Profile

- `GET /api/profile/me`
- `PUT /api/profile/me`

### Categories

- `GET /api/categories`
- `POST /api/categories` (admin)

### Skills

- `GET /api/skills`
- `GET /api/skills/mine`
- `POST /api/skills`
- `PUT /api/skills/:id`
- `DELETE /api/skills/:id`

### Exchange Requests

- `POST /api/requests`
- `GET /api/requests/dashboard`
- `PATCH /api/requests/:id/respond`
- `PATCH /api/requests/:id/complete`

### Messaging

- `GET /api/messages/:requestId`
- `POST /api/messages/:requestId`

### Ratings

- `POST /api/ratings`

### Reports

- `POST /api/reports`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/reports`
- `PATCH /api/admin/reports/:id`

## Core Features

- User registration and login
- JWT authentication and protected routes
- Student profile management
- Skill CRUD operations
- Search by category or keyword
- Exchange request workflow
- Accept or reject actions
- Dashboard views for incoming, outgoing, and accepted exchanges
- In-request messaging system
- Post-completion rating flow
- Admin management dashboard
- Reporting and moderation workflow
- Validation and centralized error handling
- Responsive modern UI

## Notes

- The frontend is a single-page interface served by Express from the `public` folder.
- The backend uses MySQL connection pooling through `mysql2/promise`.
- Admin access is controlled via the `role` field in the `users` table.
- Secrets are not hardcoded in the app source. Database credentials and the JWT secret should stay in `.env` locally and in platform environment variables when deployed.

## Deployment Approach

For deployment, keep the app and the database separate:

1. Deploy the Node.js app to a platform such as Render, Railway, or a VPS.
2. Use a hosted MySQL-compatible database such as Railway MySQL, PlanetScale, Aiven, or a managed MySQL service.
3. Add these as deployment environment variables instead of committing secrets:
   - `PORT`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `JWT_SECRET`
4. Import [database/schema.sql](/C:/Users/ADMIN/Documents/Codex/2026-04-23-create-a-fully-functional-full-stack/database/schema.sql) into the hosted database.
5. Make sure `.env` stays ignored by git through [.gitignore](/C:/Users/ADMIN/Documents/Codex/2026-04-23-create-a-fully-functional-full-stack/.gitignore).

Recommended simple path:

- App hosting: Render or Railway
- Database: Railway MySQL or another managed MySQL provider
- Secret management: hosting platform environment variables
