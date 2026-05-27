# Backend (Node + Express + MongoDB)

This folder contains the backend API scaffold for the marketplace app.

## Quick start

1. Copy `.env.example` to `.env`
2. Install dependencies:
   - `npm install`
3. Run dev server:
   - `npm run dev`

Base URL: `http://localhost:4000/api/v1`

Health endpoint: `GET /health`

## Current status

- Route/module skeletons are implemented for:
  - auth
  - users
  - freelancers
  - applications
  - requests
  - saved
  - admin
  - notifications
  - availability
- Controllers currently return stub responses and are ready for model/service implementation.
