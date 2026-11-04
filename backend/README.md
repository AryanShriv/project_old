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

## Trust and approval (PRD Phase 2)

Rules live in `src/constants/trust.js`, mirrored in the app at `src/constants/trust.ts`. **Change both together**
and bump `TERMS_VERSION` / `DISCLAIMER_VERSION` whenever the Terms or disclaimer wording changes.

- **Signup** (`POST /auth/register`) requires the current `termsVersion` and every role-specific acknowledgement;
  each is stored with a timestamp in `user.legalAcceptance`. Experts also send `expertProfile`
  (country, city, domain, engagementTypes, optional LinkedIn). Electrical, Plumbing and HVAC (and the Gas Fitting skill)
  require a certificate type, number and issuing body. On-site is Canada only and requires an insurance declaration.
- **Approval** (`PATCH /admin/applications/:id`) takes `checklist { idVerified, certificateVerified, insuranceConfirmed, linkedinVerified }`.
  ID is always required, the certificate for regulated trades, insurance for on-site. Rejection needs a reason
  (min 10 chars), which is emailed. A rejected expert resubmits with `POST /applications/expert`, once; a second
  rejection is final. Licences are marked `verified` only by an approval with `certificateVerified`.
- **Requests** must include `acknowledgedDisclaimers` and `disclaimerVersion`; the backend computes which disclaimers
  apply (expert's field + session type) and stores the acknowledgement on the request.
- **Reviews** (`POST /reviews/:expertId`): user role only, completed sessions only, one per session
  (`request.reviewedAt` + unique `requestId`). Fields: `whatILearned` (min 20), `expertStyle`
  (structured | conversational | hands_on), `wouldRecommend`. Completing a session sends a review prompt by push + email.
  Admins moderate with `GET /admin/reviews` and `PATCH /admin/reviews/:id/visibility` (hiding needs a note).
  Expert stats are always recomputed from visible reviews (`reviews.stats.js`).
- **Backfill** existing data: `node src/migrations/trust-fields-backfill.js dry-run`, then `run`.

## Email

Transactional email goes through [Resend](https://resend.com) (`src/utils/email.js`). Set `RESEND_API_KEY` and
`EMAIL_FROM` (an address on a domain verified in Resend). Without a key, emails are printed to the console, so
local development and tests never send real mail.

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
