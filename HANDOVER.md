# Handover — 2026-04-20

Paused the day with Elite Tools deployed but blocked on a Convex auth issue. This doc gets you back in action tomorrow in ~5 minutes.

---

## TL;DR

Elite Tools is **live on Vercel**, **sign-in works**, but the dashboard queries fail with `Unauthorised`. The cause is almost certainly a **stale Clerk session token that predates the "convex" JWT template**. The fix is a full sign-out + clear site data + sign back in. If that doesn't work, there are three more things to check, all listed below.

---

## Current state

| Thing | Status | URL |
|---|---|---|
| Repo | Scaffolded, pushed | https://github.com/mattboostkit/elitetools |
| Vercel deployment | READY | https://elitetools-gold.vercel.app |
| Vercel project dashboard | | https://vercel.com/boostkit/elitetools |
| Custom domain `elitetools.app` | Not yet pointed | Configure in Vercel → Settings → Domains |
| Clerk app ("Elite Tools") | Configured | https://dashboard.clerk.com/apps/app_3CdMtjFZEXXXB2qcdDznzpIsA1q |
| Clerk "convex" JWT template | Created with correct claims (`aud: "convex"` etc.) | JWT Templates tab |
| Convex deployment (`woozy-wildebeest-92`) | Live | https://dashboard.convex.dev/d/woozy-wildebeest-92 |
| Convex auth.config.ts | Deployed with correct domain | https://dashboard.convex.dev/d/woozy-wildebeest-92/settings/authentication |
| Build pipeline | Working (Vercel ↔ Convex) | — |

### Environment variables

**Vercel (Production / Preview / Development, all set):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` ✓
- `CLERK_SECRET_KEY` ✓
- `CONVEX_DEPLOY_KEY` ✓ (dev key — Starter plan limitation)
- `CLERK_JWT_ISSUER_DOMAIN` ✓

**Convex deployment env:**
- `CLERK_JWT_ISSUER_DOMAIN=https://deep-alien-28.clerk.accounts.dev` ✓

---

## The blocker

When you load `elitetools-gold.vercel.app` and sign in, the dashboard flickers on briefly then errors out. Console shows:

```
[CONVEX Q(enquiries:getEnquiriesStats)] Server Error
Uncaught Error: Unauthorised
    at requireAdmin (convex/adminAuth.ts:18:9)
```

`ctx.auth.getUserIdentity()` is returning `null`. Everything on the config side looks right — Clerk template has `aud: "convex"`, Convex has the correct issuer domain in auth.config.ts, `ConvexProviderWithClerk` wraps the app. So the most likely remaining cause is a **stale browser session token** that was issued before the JWT template existed.

---

## What to do first thing tomorrow

### Step 1 — Full reset (30 seconds)

1. On `elitetools-gold.vercel.app`, click your avatar (bottom of sidebar) → **Sign out**
2. DevTools → **Application** tab → **Storage** (left panel) → **Clear site data** (big button at top)
3. Close the tab
4. Open an incognito/private window → go to `https://elitetools-gold.vercel.app`
5. Sign in fresh
6. Check the dashboard — if numbers load (probably all zeros), you're unblocked. **Skip to "After it's unblocked" below.**

### Step 2 — If Step 1 doesn't fix it

Check Convex logs for the specific rejection reason:

- Open https://dashboard.convex.dev/d/woozy-wildebeest-92/logs
- Reload the dashboard on `elitetools-gold.vercel.app`
- Look for a red error. It'll tell you whether the JWT is expired, has wrong audience, bad signature, etc.
- Paste the error into a new Claude chat to diagnose

### Step 3 — If the logs don't help

Check the "Custom signing key" toggle in the Clerk JWT template:

- Clerk Dashboard → JWT Templates → convex
- Scroll to **Custom signing key**
- It should be **OFF** (uses Clerk's default key, which matches the JWKS endpoint Convex fetches from)
- If it's ON, turn it off and save

### Step 4 — If none of the above works

The suspect becomes the `ConvexProviderWithClerk` wiring for Clerk v7. Might need to explicitly pass the template:

```tsx
// src/app/providers.tsx
import { useAuth as useClerkAuth } from "@clerk/nextjs";

function useAuthForConvex() {
  const auth = useClerkAuth();
  return {
    ...auth,
    getToken: () => auth.getToken({ template: "convex" }),
  };
}

<ConvexProviderWithClerk client={convex} useAuth={useAuthForConvex}>
```

Don't make this change unless Steps 1–3 fail — the standard pattern *should* work.

---

## After it's unblocked

Once the dashboard loads (empty data is fine), the next items are:

1. **Point `elitetools.app` at the Vercel deployment**
   - Vercel project → **Settings → Domains** → add `elitetools.app` and `www.elitetools.app`
   - Follow the DNS records they give you at your registrar
   - ~2 minutes to propagate

2. **Port the Proposals UI** from Salomons (`src/app/(admin)/admin/proposals/page.tsx` in `C:/Dev/Cascade/ELC/salomons`)
   - Convex schema + functions already ported
   - Just need to port the React page + adjust property filter
   - Estimate: ~45 minutes

3. **Port the Quotes UI** from Salomons
   - Same pattern as Proposals
   - Estimate: ~45 minutes

4. **Wire OWP to write enquiries into elitetools' Convex**
   - On OWP, change `NEXT_PUBLIC_CONVEX_URL` to `https://woozy-wildebeest-92.eu-west-1.convex.cloud`
   - Copy `convex/_generated/api.d.ts` from elitetools
   - New OWP enquiries will appear in the CRM in real time
   - Do the same for Salomons site when ready

5. **Migrate historical enquiries** from OWP's and Salomons' existing Convex deployments into elitetools
   - `npx convex export` from each source → `npx convex import` into elitetools
   - Scripted — I can write it when ready

6. **Upgrade Convex to Pro** when budget allows
   - Unlocks production deploy keys (separate prod vs dev deployments)
   - Today's Vercel is pointed at the dev deployment because Starter plan only issues dev keys

---

## Commits pushed today (elitetools)

In order:

1. `90256a0` — Initial scaffold (Next.js 16 + Clerk + Convex + ported Salomons schema)
2. `f84faed` — Rename `middleware.ts` → `proxy.ts` for Next.js 16
3. `86e8139` — Remove leftover `adminToken` destructures after Clerk auth rewire
4. `9dcd69e` — Build script wraps `next build` with `convex deploy`
5. `71058ba` — Run `convex codegen` before deploy so `_generated/` exists for next build
6. `3a2175a` — Move `afterSignOutUrl` from `UserButton` to `ClerkProvider` (Clerk v7 API)
7. `76c2e79` — Empty commit to trigger Vercel rebuild with new `CLERK_JWT_ISSUER_DOMAIN` env var

---

## Things I shipped today across the whole ELC portfolio

So you have context of what's been touched while picking this up:

### One Warwick Park (`C:/Dev/Cascade/ELC/owp`)

**Shipped and deployed:**
- Two `/blog/*` catch-all redirects removed (the site's blog posts had been 308-redirecting to `/blog` since launch — largest SEO hit of the year)
- 4 weak wedding PSEO pages consolidated into `/weddings`
- Lead capture forms shortened + hardened (Convex retry, UTM in FormSpark email, form error masking, deduped GA4 conversions, brochure download CTA on wedding thank-you)
- Celebration sub-pages now embed pre-filled enquiry forms inline (no redirect hop)
- 7 broken internal links audit + fixes
- Convex deploy pipeline unblocked (@types/node 25 broke tsc typecheck)

**Drafted but not published:**
- `docs/marketing-automation-proposal.md` — tiered Tier 1/2/3 pitch doc for the Head of Marketing conversation
- `docs/blog-content-replication-plan.md` — 15-post prioritised content plan from GSC data
- `docs/drafts/01-is-tunbridge-wells-worth-visiting.md` — first blog post, ~2,100 words, awaiting your tone sign-off before I draft #2 and #4

**Not yet addressed:**
- Turnstile / rate limiting on the Convex enquiries mutation (spam hardening)
- Cross-publishing 4–5 Salomons-tagged blog posts for OWP

### Elite Tools (`C:/Dev/Cascade/ELC/elitetools`)

- See "Current state" section above
- Proposals + Quotes UI still stubs (dashboard, enquiries list, form errors list are all live-wired to Convex)
- Sidebar nav, sign-in/sign-up pages, Clerk middleware all set up

---

## Quick reference — how to work on Elite Tools locally

```bash
cd C:/Dev/Cascade/ELC/elitetools

# Terminal 1 (Convex watcher — leave running)
npx convex dev

# Terminal 2 (Next.js dev server — leave running)
npm run dev

# Open http://localhost:3000 → sign in → dashboard
```

If `convex dev` complains, check `.env.local` still has the Clerk + Convex values.

---

## Open questions for when you're back

- Tone of the OWP blog draft — approve as-is, or adjustments?
- Proposals UI port priority vs `elitetools.app` domain setup first?
- OK to also move Salomons' `NEXT_PUBLIC_CONVEX_URL` over to elitetools so both sites start feeding the CRM immediately, or wait until Proposals/Quotes UIs exist?

---

Good night. When you're back, start with Step 1 (full reset) on `elitetools-gold.vercel.app` — 90% chance that unblocks you in 30 seconds.
