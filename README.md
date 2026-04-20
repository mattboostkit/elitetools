# Elite Tools

Central CRM for the Elite Leisure Collection — **One Warwick Park**, **Salomons Estate** and **Bewl Water**. Unifies enquiries, wedding proposals, quotes and form-error tracking from every property website into one admin dashboard.

Lives at [elitetools.app](https://elitetools.app).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind 4)
- **Clerk** — authentication
- **Convex** — real-time database + serverless functions
- **Vercel** — hosting
- **Lucide** icons, **date-fns** for relative times

## First-time setup

You need three accounts: Clerk, Convex, Vercel. Rough order:

### 1. Clone and install

```bash
git clone https://github.com/mattboostkit/elitetools.git
cd elitetools
npm install
cp .env.example .env.local
```

### 2. Set up Convex

```bash
npx convex dev
```

This launches an interactive setup. Follow the prompts to create a new Convex project. When it finishes, `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` will be written to `.env.local` automatically. Leave this command running — it watches `convex/*.ts` and re-deploys on save.

### 3. Set up Clerk

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. In **API Keys**, copy the **Publishable Key** and **Secret Key** into `.env.local`:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. In **JWT Templates**, click **New template → Convex**. Accept the defaults and save.
4. Copy the **Issuer** URL from the template page and put it in `.env.local`:
   - `CLERK_JWT_ISSUER_DOMAIN`
5. Push the issuer config to Convex:
   ```bash
   npx convex env set CLERK_JWT_ISSUER_DOMAIN "<your-issuer-url>"
   ```
6. (Optional) Restrict sign-ups in the Clerk dashboard so only invited users can create accounts.

### 4. Run the dev server

```bash
# in a second terminal
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/sign-in`. Create your account, and you're in the dashboard.

## Architecture

```
┌──────────────────────────┐     ┌──────────────────────────┐
│  Public marketing sites  │     │    elitetools.app        │
│                          │     │    (this repo)           │
│  onewarwickpark.co.uk    │     │                          │
│  salomons-estate.com     │     │  Next.js + Clerk auth    │
│  bewlwater.co.uk         │     │                          │
│                          │     │  Read/write via Convex   │
│  Public form submissions │─────▶  `createEnquiry`         │
│  call Convex mutations   │     │                          │
└──────────────────────────┘     └──────────┬───────────────┘
                                            │
                                            ▼
                                ┌──────────────────────────┐
                                │    Shared Convex DB      │
                                │                          │
                                │  enquiries               │
                                │  weddingProposals        │
                                │  quotes                  │
                                │  formErrors              │
                                │  newsletters             │
                                │                          │
                                │  property: owp/salomons/ │
                                │            bewl          │
                                └──────────────────────────┘
```

Every table is scoped by a `property` column so one Convex deployment holds data from all three sites. Clerk authorises admin reads and writes; public form submissions are unauthenticated but validated.

## Data model

See [`convex/schema.ts`](./convex/schema.ts) for the full schema. Key tables:

| Table | Purpose |
|---|---|
| `enquiries` | Form submissions from all three public sites. Partitioned by `property`. Includes full UTM attribution and `gclid`. |
| `weddingProposals` | Personalised landing pages sent to couples after their viewing. Slug-based, optional access code, view tracking. |
| `quotes` | Quote builder with line items, status workflow (draft / sent / accepted / expired). |
| `newsletters` | Newsletter signups from site footers and popups. |
| `formErrors` | Client-side form failures. Email is masked at write time. |
| `googleAdsMetrics`, `ga4Metrics`, `searchConsoleMetrics`, `analyticsSnapshot` | Cached analytics data for dashboard reporting. |
| `recommendedSuppliers`, `signedContracts`, `projectChecklist` | Legacy Salomons tables — kept for compatibility. |

## Connecting the public sites

The public marketing sites (OWP / Salomons / Bewl) submit enquiries directly to this CRM's Convex deployment. To wire one up:

1. In the public site's `.env.local`, set `NEXT_PUBLIC_CONVEX_URL` to this project's Convex URL.
2. Copy the generated Convex client types (`convex/_generated/api.d.ts`) or regenerate them against this schema.
3. The public site's form handler calls `api.enquiries.create` with `property: "owp"` (or the appropriate property).
4. The CRM picks it up in real time — admin dashboard updates instantly.

Historical data from the existing per-property Convex deployments can be migrated via `npx convex export` → `npx convex import`. A migration guide will land in `docs/migration.md`.

## Deploying to Vercel

1. Push this repo to GitHub (already wired to `mattboostkit/elitetools`).
2. In [vercel.com/new](https://vercel.com/new), import the repo.
3. During setup, add the env vars from your `.env.local`:
   - `CONVEX_DEPLOYMENT`
   - `NEXT_PUBLIC_CONVEX_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Deploy. Point `elitetools.app` at the deployment in **Domains**.
5. Set the production Convex env var for Clerk issuer:
   ```bash
   npx convex env set --prod CLERK_JWT_ISSUER_DOMAIN "<your-issuer-url>"
   ```
6. Run a production Convex deploy to pick it up:
   ```bash
   npx convex deploy
   ```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Next.js dev server on :3000 |
| `npm run build` | Production build — runs `convex codegen` then `next build` |
| `npm run start` | Serve the production build |
| `npm run convex:dev` | Convex watcher (keep running alongside `npm run dev`) |
| `npm run convex:deploy` | Deploy Convex functions to production |

## Not yet built (v0.1 scope)

Proposals and quotes currently have stub pages. The Convex schema and functions are fully ported, but the UI needs the edit/list/detail views built out. That's the next iteration.

Other things to add when needed:

- Kanban pipeline view for enquiries
- Slack / email alerts on new enquiry
- Auto-assignment to a sales rep (round-robin or by property)
- Attribution reports (conversion by UTM source)
- CSV export
- External CRM sync (HubSpot / Pipedrive via Convex actions)
