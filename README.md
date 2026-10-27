# Job Application Tracker

A simple full-stack job application tracker with a React frontend and Express + SQLite backend.

## Requirements
- Node.js 18+

## Run backend
```bash
cd backend
npm install
npm run dev
```
Backend runs at http://localhost:4000

## Run frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
Vite prints the local frontend URL (usually http://localhost:5173).

## Features
- Add, view, update status, and delete job applications
- Search by company, role, or notes
- Track application date, job URL, notes, and status
- SQLite database is created automatically at backend/data/jobs.db

## API
- `GET /api/applications`
- `POST /api/applications`
- `PATCH /api/applications/:id`
- `DELETE /api/applications/:id`
- `GET /api/health`

This is a starter project. Add authentication and deployment configuration before using it with sensitive or multi-user data.
