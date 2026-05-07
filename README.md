# Circle of Friends

Responsive full-stack association management website for Circle of Friends, built with:

- Node.js
- Express
- MySQL with demo fallback
- Vite
- React + TypeScript
- Tailwind CSS
- Recharts
- jsPDF

## Features

- Professional public website with Home, About, and Events pages
- Secure member portal with login, feed, announcements, and contribution analytics
- Role-based dashboard for:
  - Super Admin
  - Admin
  - General Coordinator
  - Secretary General
  - General Treasurer
  - Branch Coordinator
  - Branch Treasurer
- Member creation with photo upload
- PDF export for member lists, contribution reports, and membership cards
- MySQL schema bootstrap and automatic demo-data seeding when the database is empty

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
copy .env.example .env
```

3. Update `.env` with your MySQL credentials.

4. Start both frontend and backend:

```bash
npm run dev:full
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:4000`

## Database

- MySQL schema file: [`server/schema.sql`](server/schema.sql)
- If MySQL credentials are present, the API will:
  - connect to MySQL
  - ensure the schema exists
  - seed demo data automatically if the tables are empty
- If MySQL is not configured, the app falls back to demo mode so the UI still runs

## Useful scripts

```bash
npm run dev
npm run server:dev
npm run dev:full
npm run build
npm run start
```
