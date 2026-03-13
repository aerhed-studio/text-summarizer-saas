# SPEC.md — TextLens

**One-line description**: A web-based SaaS tool that gives users an AI-powered summary, keyword list, and readability score for any pasted text.

---

## 1. Target User & Core Problem

**Target user**: Knowledge workers, students, researchers, and content creators who regularly consume long documents, articles, or reports.

**Core problem**: Reading and distilling long blocks of text is time-consuming. Users need a fast way to extract the key message, important terms, and understand how accessible the text is — without installing software or signing up immediately.

---

## 2. MVP Feature List

### Guest (unauthenticated) users
- Paste text into an input area and submit for analysis
- Receive three outputs: AI summary, keyword list, readability score
- Usage counter tracked via browser localStorage (5 free uses)
- On 6th attempt: gate modal prompting account creation to continue
- No credit card, no payment at any point

### Authenticated users
- All guest features, unlimited
- Personal history: view past analyses (text snippet, summary, keywords, score, timestamp)
- Delete individual history entries
- Account settings: update email, change password, delete account

### Analysis engine
- **Summary**: 3–5 sentence extractive/abstractive summary via OpenAI GPT-4o-mini
- **Keywords**: Top 8–12 significant terms/phrases extracted from the text
- **Readability score**: Flesch-Kincaid Reading Ease score (0–100) with a plain-English label (e.g. "Very Easy", "Difficult") — computed server-side without AI
- Input validation: minimum 50 characters, maximum 10,000 characters
- Analysis returned in a single API response (summary + keywords in one LLM call, readability computed separately)

### Auth
- Email + password signup/login
- Email verification on signup
- Password reset via email link
- JWT-based session (stored in httpOnly cookie)

---

## 3. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Frontend | Next.js 15 (App Router) | SSR + API routes in one project; great DX; easy deployment |
| Styling | Tailwind CSS + shadcn/ui | Fast, minimal, accessible component primitives |
| Backend | Next.js API routes | Avoids separate server; sufficient for this scope |
| Database | PostgreSQL (via Supabase) | Managed Postgres with auth helpers; free tier sufficient |
| ORM | Prisma | Type-safe queries; easy migrations |
| Auth | NextAuth.js v5 (Auth.js) | Email/password + JWT; integrates with Prisma adapter |
| AI | OpenAI API (GPT-4o-mini) | Cost-effective; reliable; structured output support |
| Email | Resend | Simple API; generous free tier; great deliverability |
| Hosting | Vercel | Zero-config Next.js deployment; free tier |

---

## 4. Pages & Routes

### UI Pages

| Route | Description |
|---|---|
| `/` | Home/landing page with the text input tool. Works for both guests and authenticated users. |
| `/auth/signup` | Email + password registration form |
| `/auth/login` | Login form |
| `/auth/verify-email` | Shown after signup; instructs user to check email |
| `/auth/reset-password` | Request password reset (enter email) |
| `/auth/new-password` | Set new password (via token link from email) |
| `/dashboard` | Authenticated user's analysis history (paginated list) |
| `/dashboard/settings` | Account settings: email, password, delete account |

### API Routes

| Route | Method | Auth required | Description |
|---|---|---|---|
| `/api/analyse` | POST | No | Accepts text, returns summary + keywords + readability score |
| `/api/auth/[...nextauth]` | GET/POST | — | NextAuth.js handler |
| `/api/history` | GET | Yes | Returns paginated analysis history for the user |
| `/api/history/[id]` | DELETE | Yes | Deletes a single history entry |
| `/api/account` | PATCH | Yes | Update email or password |
| `/api/account` | DELETE | Yes | Delete account and all data |

---

## 5. Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `email` | `varchar(255)` | Unique, not null |
| `password_hash` | `text` | bcrypt hash, not null |
| `email_verified` | `boolean` | Default false |
| `created_at` | `timestamptz` | Default now() |
| `updated_at` | `timestamptz` | Auto-updated |

### `verification_tokens`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → users.id, cascade delete |
| `token` | `text` | Unique, hashed |
| `type` | `enum` | `email_verification` \| `password_reset` |
| `expires_at` | `timestamptz` | |
| `created_at` | `timestamptz` | Default now() |

### `analyses`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → users.id, cascade delete; nullable (guest analyses not stored) |
| `input_snippet` | `text` | First 200 chars of input text (for history display) |
| `input_length` | `integer` | Character count of full input |
| `summary` | `text` | AI-generated summary |
| `keywords` | `text[]` | Array of keyword strings |
| `readability_score` | `numeric(5,2)` | Flesch-Kincaid score |
| `readability_label` | `varchar(50)` | e.g. "Standard", "Fairly Difficult" |
| `model_used` | `varchar(50)` | e.g. "gpt-4o-mini" |
| `processing_ms` | `integer` | Time taken for analysis |
| `created_at` | `timestamptz` | Default now() |

---

## 6. Monetisation

**None at MVP.** The product is fully free with account creation as the only gate. This is intentional to maximise adoption, collect usage data, and validate the core product before introducing any paid tier.

Future paid tier hooks (not built now): rate limits per plan stored on `users` table, usage tracking via `analyses` table already in place.

---

## 7. Third-Party Services

| Service | Purpose | Free tier |
|---|---|---|
| **OpenAI API** | GPT-4o-mini for summary + keyword extraction | Pay-per-token; ~$0.00015/1K input tokens |
| **Resend** | Transactional email (verification, password reset) | 3,000 emails/month free |
| **Supabase** | Managed PostgreSQL | 500MB DB, 2 projects free |
| **Vercel** | Hosting + edge functions | Generous free tier |

---

## 8. Build Order

### Phase 1 — Project scaffold
1. `npx create-next-app@latest` with TypeScript, Tailwind, App Router
2. Install and configure: Prisma, NextAuth.js v5, shadcn/ui, Resend SDK, OpenAI SDK
3. Set up Supabase project, get `DATABASE_URL`
4. Write Prisma schema, run initial migration
5. Configure NextAuth with Prisma adapter and credentials provider

### Phase 2 — Core analysis feature (guest)
6. Build the home page UI: textarea input, submit button, results panel (summary / keywords / readability)
7. Implement `/api/analyse` route: validate input length, compute Flesch-Kincaid score, call OpenAI for summary + keywords, return JSON
8. Wire frontend to API; display results
9. Implement localStorage usage counter; show gate modal on 6th attempt

### Phase 3 — Auth flows
10. Build `/auth/signup` page + API: hash password, create user, send verification email via Resend
11. Build email verification: token generation, `/auth/verify-email` page, token validation endpoint
12. Build `/auth/login` page using NextAuth credentials provider
13. Build password reset flow: request page, Resend email, token validation, new password page
14. Add session-aware navbar (show login/signup vs. user menu)

### Phase 4 — Authenticated features
15. On successful analysis, if user is authenticated, save to `analyses` table
16. Build `/dashboard` page: paginated history list with snippet, score, date; delete button per row
17. Build `/dashboard/settings` page: update email form, update password form, delete account with confirmation

### Phase 5 — Polish & hardening
18. Add loading states and error handling throughout
19. Input sanitisation and rate limiting on `/api/analyse` (e.g. 20 req/min per IP via Vercel edge config or upstash/ratelimit)
20. Responsive design audit (mobile + desktop)
21. Empty states, 404 page, error boundary
22. End-to-end test of all flows manually

---

## 9. Deployment

**Deployment type**: `fullstack`

**Build command**:
```
npx prisma generate && next build
```

**Output directory**: `.next`

**Environment variables**:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string from Supabase |
| `NEXTAUTH_SECRET` | Random 32-byte string for signing JWTs (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Full public URL of the app (e.g. `https://textlens.vercel.app`) |
| `OPENAI_API_KEY` | OpenAI API key for GPT-4o-mini calls |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `RESEND_FROM_EMAIL` | Sender address (e.g. `noreply@textlens.app`) |

**Deploy steps**:
1. Push repo to GitHub
2. Import project in Vercel; set all environment variables
3. Vercel auto-detects Next.js; runs build command on deploy
4. Run `npx prisma migrate deploy` once via Vercel CLI or a one-off script on first deploy
