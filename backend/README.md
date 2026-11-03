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

## Naming: expert / user (and the legacy names you will still see)

The product language is **expert** (supply side) and **user** (demand side). "Freelancer" and "client"
are retired. The user roles and the `expertprofiles` collection were already migrated
(`src/migrations/terminology-refactor.js`). A few old identifiers remain on purpose because renaming
them means a data migration or a breaking URL change. **They all mean "expert"**:

| Legacy name | Where | What it actually is | Plan |
|---|---|---|---|
| `freelancerId` | `availability` + `availabilityexceptions` collections, `/availability/:freelancerId` routes | `ExpertProfile._id` | Rename with a migration (PRD Phase 3) |
| `FreelancerProfile` | `availability.access.js` | Local alias of the `ExpertProfile` model | Rename with the above |
| `/freelancers/*` | `routes/index.js` | Redirect to `/experts/*` for old app builds | Remove once no old builds are in use |
| `app/(admin)/(tabs)/freelancers.tsx` | Admin web app | The admin "Experts" tab (its label already says Experts) | Rename the route file in Phase 3 |

Note for PRD 5.5: the dedicated endpoint already exists as `POST /applications/expert`; the remaining work is
moving the app's expert sign-up onto it instead of `/auth/register`.

Do not add new code using these names. Use `expert` / `expertId` / `user` / `userId`.

## Requests ("Request a Session")

`POST /requests` takes `expertId, headline, description, sessionType (remote|onsite|ongoing), timingPreference (asap|week|month|flexible)`.
There is no budget: experts set their own rates. On-site is only accepted for experts whose `country` is Canada.

For older app builds the API still accepts `projectTitle` / `userMessage` / `engagementType`, and every new
request is **dual-written** to those legacy fields. Read the new fields in new code.

- **Backfill** old requests into the new fields (idempotent, additive):
  `node src/migrations/request-fields-backfill.js dry-run` then `... run`
- **Expiry:** pending requests expire 48 hours after creation. `requests.expiry.js` sweeps every 5 minutes
  (started from `server.js`), marks them `expired`, and notifies the user by push (`utils/push.js`, Expo push service)
  and the `request:updated` socket event.

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
