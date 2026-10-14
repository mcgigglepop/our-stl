# OurSTL — Build Progress

A full-stack civic engagement app for St. Louis, built as a hackathon vertical slice: cross-platform mobile client + AWS backend + Terraform infrastructure.

## Repo

- `app/` — Expo React Native app (iOS, Android, web)
- `infra/` — Terraform for all AWS resources + Lambda source
- 20 commits on `main` since the Stage-0 greenfield

## The app at a glance

Five tabs (per the website mockup), all live:

| Tab | What it does | Data |
|---|---|---|
| 💬 Community Feed | Shared civic reports from any user | DynamoDB GSI (newest-first) |
| 📍 Civic Reporting | AI-assisted report submission + routing + My Requests | HRSA + DynamoDB |
| 💚 Rehab Help | Nearest substance-use providers, filterable | Curated STL data |
| 🏠 Food & Shelter | 6 chips: Medical / Water / Hygiene / Shelter / Pantry / Meals | HRSA + OSM + curated |
| OurSTL header | Branded wordmark + sign-out | Cognito session |

---

## Backend (AWS, Terraform-managed)

### Auth

- **Cognito User Pool** with `email` as username, email-verification required, strong password policy, SRP sign-in. User Pool Client is public (no secret) for mobile.
- `expo-secure-store` persists tokens on the device; `CognitoProvider` React Context exposes `signUp / confirmSignUp / resendCode / signIn / signOut / tokens / user`.

### Civic Report Pipeline

- **API Gateway HTTP API** behind a Cognito JWT authorizer, 5 routes:
  ```
  POST /uploads/presign       → S3 presigned PUT
  POST /reports/analyze       → Rekognition moderation + Bedrock Claude vision + Location Service geocode
  POST /reports               → DynamoDB write + S3 copy from tmp/ to reports/
  GET  /reports/mine          → user's reports, newest first + signed thumbnails
  GET  /community/reports     → public reports feed (sparse GSI, isOwn flag)
  ```
- **Lambda** `our-stl-api` (Node 20, 512MB, 30s) handles all routes via a single router.
- **S3 bucket** `our-stl-reports-<account>` with CORS for presigned PUT and a 7-day lifecycle rule on `tmp/` prefix for abandoned uploads.
- **DynamoDB table** `our-stl-reports`: PK `userId` (Cognito sub) + SK `reportId` (ULID-ish for lex-sortable newest-first); sparse GSI `PublicByCreatedAt` (PK `publicPartition="PUBLIC"`, SK `createdAt`) only indexes shared reports.
- **Bedrock Claude Haiku 4.5** via cross-region inference profile for photo classification + description.
- **Rekognition** `DetectModerationLabels` with 60% threshold rejects inappropriate photos (deletes the S3 object on reject).
- **AWS Location Service** Esri place index for reverse geocoding; parser falls back through Street → full Label → neighborhood when fields are missing.
- Lambda IAM is scoped per-service: only the specific actions it needs on only the specific resources (its own log group, the reports bucket, the reports table + GSI, any Anthropic foundation model or inference profile, and the one Place Index).

---

## Mobile (Expo + React Native)

### Core infrastructure

- **Expo Router** with `(auth)` and `(tabs)` route groups, auth-aware redirect at the root.
- **OurSTL design system** (`src/theme/`) extracted from the live website's CSS variables — navy / teal / cream palette, Inter stack, radii + spacing tokens matching `.card`, `.chip`, `.btn` etc.
- **Shared components**: `Brand`, `Header` (with avatar sign-out), `Hero` with per-tab gradients, `Dropdown` (bottom-sheet modal), `Checkbox`, `EmptyScreen`, `MyReportsCard`.
- **Shared hook**: `useCurrentLocation` with fallback to downtown STL coords when denied.
- **Auth reducer** extracted into its own module with 6 real unit tests.

### Civic Reporting tab (the headline feature)

- Smart Department Routing card with 5-step workflow pills, 6 issue chips, Issue + Municipality dropdowns, reactive routing preview (useMemo), warn note, CSB + Open311 links.
- **My Requests** horizontal strip of past reports with thumbnail / status pill / "Shared" badge / location / description / relative timestamp.
- **AI-assisted report form**:
  - Tap photo upload → presign → PUT to S3 → `/reports/analyze`
  - "Analyzing photo…" overlay for 2–4s
  - Form auto-fills: category from Claude, location from Location Service, description from Claude
  - Low-confidence results show a yellow "double-check" hint
  - Rejected photos get a red reason banner and are cleared from local state
- **"Also share with the community"** checkbox — defaults off. On submit flows through to `isPublic` in the backend; the success alert mentions the Community Feed when shared.

### Community Feed tab

- Hero + pull-to-refresh scroll of public civic reports
- Post cards with author initials avatar, name (or "You" for your own), location, time ago, category tag, description, Directions button, "Posted by you" badge

### Food & Shelter tab (6 chips)

Each chip reflects real STL data, haversine-sorted by distance, with day/audience filters where the source data supports them:

| Chip | Source | Count | Features |
|---|---|---|---|
| 🩺 Medical | HRSA locator API (live) | 44 FQHCs in 10mi | Pre-computed distance, pagination |
| 💧 Water | OSM Overpass + curated SLPL | OSM + 15 libraries | 3-endpoint OSM failover |
| 🚿 Hygiene | City drop-in directory (scrape) | 4 drop-ins | Day picker |
| 🏠 Shelter | City housing (scrape) | 10 providers | 211-first card, Audience + Day filters |
| 🥫 Pantry | City food.cfm (scrape) | 14 pantries | Real hours, ZIP eligibility badges |
| 🥘 Meals | City food.cfm (scrape) | 12 programs | Meal-type tags, monthly cadence notes |

Plus the mockup's bottom 211 resource guide (2×2 card grid: Food assistance / Emergency shelter / Transportation / Near me).

### Rehab Help tab

- Teal gradient hero
- Single native-style dropdown for "What help do you need?" (All / Treatment / Peer / Crisis)
- 13 providers: 12 from the City of St. Louis substance-use directory + national 988 Lifeline
- Women-only tag where applicable (Queen of Peace)
- Bottom 4-card "Find the right support" guide (SAMHSA call / findtreatment.gov / loved-one guidance / privacy badge)

---

## What's real end-to-end

A user can:

1. Sign up with email → confirm with Cognito code → sign in via SRP
2. Grant location permission → see nearby providers across 7 categories (99 total real STL providers)
3. Tap a chip in Civic Reporting → see the responsible city department
4. Photograph a civic issue → AI auto-fills category + description + address → optionally share with community → persist to DynamoDB
5. See their own reports in My Requests (shared and private alike)
6. See other users' shared reports in the Community Feed
7. Sign out from the header

## By the numbers

- **~5600 lines of code** added across all commits (mobile + Lambda + Terraform)
- **99 real STL providers** curated from authoritative public sources
- **5 AWS Lambda-backed API endpoints** behind Cognito JWT auth
- **22 Terraform resources** (Cognito, S3, DynamoDB + GSI, Location, Lambda, IAM, API Gateway, log groups)
- **1 AI model** (Claude Haiku 4.5 vision) + **1 moderation model** (Rekognition)
- **6/6 reducer unit tests** passing, `tsc` clean, `expo-doctor` 21/21

## What's deliberately not built (for a future stage)

- **City staff admin view** of all reports (private + public). DynamoDB structure supports it; just needs a new endpoint + IAM policy for a staff role.
- **Report status workflow** (acknowledged / in-progress / resolved). `status` field is already in the schema.
- **Push notifications** on report status changes.
- **Feed interactions** (confirm / comment / follow) from the mockup — currently reports are view-only on the Community Feed.
- **Walk-in flag** on Rehab Help — the city page doesn't publish it, so we don't invent it.
- **Hours of operation** for FQHCs — HRSA's API doesn't expose it.
