# SYSTEM_PROMPT.md — TextLens Coding Instructions

You are building **TextLens**, a Next.js 15 SaaS web app that analyzes pasted text and returns an AI-generated summary, a keyword list, and a Flesch-Kincaid readability score. Follow every instruction below exactly. Do not deviate from the stack, file structure, or conventions specified.

---

## Stack — Use Exactly These

| Concern | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 15.x |
| Language | TypeScript | strict mode |
| Styling | Tailwind CSS + shadcn/ui | latest |
| Database | PostgreSQL via Supabase | hosted |
| ORM | Prisma | 5.x |
| Auth | NextAuth.js (Auth.js) | v5 (`next-auth@beta`) |
| AI | OpenAI SDK | 4.x |
| Email | Resend SDK | latest |
| Runtime | Node.js (Vercel serverless) | 20.x |

**Do not introduce any other libraries** unless they are utility-only (e.g. `bcryptjs`, `crypto`). Do not use `axios` — use `fetch`. Do not use `moment` — use native `Date`. Do not use `lodash`.

---

## Environment Variables

All secrets come from environment variables. Never hardcode any value.

```
DATABASE_URL=           # PostgreSQL connection string (Supabase)
NEXTAUTH_SECRET=        # 32-byte random string
NEXTAUTH_URL=           # Full public URL (e.g. https://textlens.vercel.app)
OPENAI_API_KEY=         # OpenAI key
RESEND_API_KEY=         # Resend key
RESEND_FROM_EMAIL=      # e.g. noreply@textlens.app
```

Create `.env.example` with these keys (empty values). Never commit `.env.local`.

---

## Build Order — Follow This Exactly

Build in this phase order. Do not skip ahead. Each phase must be complete and working before starting the next.

### Phase 1 — Project Scaffold
1. Run `npx create-next-app@latest` with: TypeScript, Tailwind CSS, App Router, `src/` directory, no `turbopack` for prod stability.
2. Install dependencies:
   ```bash
   npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter openai resend bcryptjs
   npm install -D @types/bcryptjs
   npx shadcn@latest init
   npx shadcn@latest add button input textarea label dialog badge card separator
   ```
3. Create `prisma/schema.prisma` with the full schema (see Database section below).
4. Run `npx prisma migrate dev --name init`.
5. Create `src/lib/prisma.ts` — singleton Prisma client.
6. Create `src/lib/auth.ts` — NextAuth config.
7. Create `src/app/api/auth/[...nextauth]/route.ts` — export `GET` and `POST` from NextAuth handlers.
8. Create `src/middleware.ts` — protect `/dashboard` routes.

### Phase 2 — Core Analysis Feature
9. Create `src/lib/readability.ts` — Flesch-Kincaid function.
10. Create `src/lib/openai.ts` — OpenAI client + `analyseText()`.
11. Create `src/app/api/analyse/route.ts` — full analysis endpoint.
12. Create `src/components/AnalysisForm.tsx` — textarea + submit, localStorage counter, gate modal trigger.
13. Create `src/components/ResultsPanel.tsx` — render summary, keywords, score.
14. Create `src/components/GateModal.tsx` — shown on 6th guest attempt.
15. Update `src/app/page.tsx` — compose the home page.

### Phase 3 — Auth Flows
16. Create `src/lib/tokens.ts` — token generation and hashing.
17. Create `src/lib/email.ts` — Resend client + email send functions.
18. Build signup: `src/app/auth/signup/page.tsx` + handler in `/api/auth/signup/route.ts`.
19. Build email verification: `src/app/auth/verify-email/page.tsx`.
20. Build login: `src/app/auth/login/page.tsx` using NextAuth `signIn`.
21. Build password reset: `src/app/auth/reset-password/page.tsx` + `src/app/auth/new-password/page.tsx`.
22. Create `src/components/Navbar.tsx` — session-aware navigation.
23. Update `src/app/layout.tsx` to include `SessionProvider` and `Navbar`.

### Phase 4 — Authenticated Features
24. Create `src/app/api/history/route.ts` (GET) and `src/app/api/history/[id]/route.ts` (DELETE).
25. Create `src/components/HistoryList.tsx`.
26. Create `src/app/dashboard/page.tsx`.
27. Create `src/app/api/account/route.ts` (PATCH + DELETE).
28. Create `src/components/DeleteAccountDialog.tsx`.
29. Create `src/app/dashboard/settings/page.tsx`.

### Phase 5 — Polish
30. Add loading skeletons and error states to all async components.
31. Add `src/lib/ratelimit.ts` and apply it to `/api/analyse`.
32. Add `src/app/not-found.tsx` and `src/app/error.tsx`.
33. Audit all pages for mobile responsiveness.

---

## Database Schema — `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // required by Supabase connection pooling
}

model User {
  id            String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email         String    @unique @db.VarChar(255)
  passwordHash  String    @map("password_hash")
  emailVerified Boolean   @default(false) @map("email_verified")
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")

  analyses           Analysis[]
  verificationTokens VerificationToken[]

  @@map("users")
}

enum TokenType {
  email_verification
  password_reset
}

model VerificationToken {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  token     String    @unique
  type      TokenType
  expiresAt DateTime  @map("expires_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("verification_tokens")
}

model Analysis {
  id                String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String?  @map("user_id") @db.Uuid
  inputSnippet      String   @map("input_snippet")
  inputLength       Int      @map("input_length")
  summary           String
  keywords          String[]
  readabilityScore  Decimal  @map("readability_score") @db.Decimal(5, 2)
  readabilityLabel  String   @map("readability_label") @db.VarChar(50)
  modelUsed         String   @map("model_used") @db.VarChar(50)
  processingMs      Int      @map("processing_ms")
  createdAt         DateTime @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("analyses")
}
```

---

## File-by-File Implementation Instructions

### `src/lib/prisma.ts`
```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```
- This pattern prevents multiple Prisma instances in Next.js dev mode (hot reload issue).

---

### `src/lib/auth.ts`
- Use `NextAuth` from `next-auth` v5 beta.
- Use `PrismaAdapter` from `@auth/prisma-adapter`.
- Configure a single `Credentials` provider.
- The credentials provider must: find user by email, verify bcrypt hash, check `emailVerified === true` (reject login if not verified), return the user object.
- Session strategy: `"jwt"`.
- Callbacks: in `jwt` callback, attach `user.id` to token. In `session` callback, attach `token.sub` as `session.user.id`.
- Do NOT use the Prisma adapter for session management (JWT mode only — the adapter is only for the `verificationTokens` NextAuth table if needed, but in this project we manage tokens manually).

```ts
// src/lib/auth.ts — shape only, fill in full implementation
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (credentials) => {
        // 1. find user by email
        // 2. compare password hash
        // 3. check emailVerified
        // 4. return { id, email } or null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      session.user.id = token.sub!;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});
```

---

### `src/app/api/auth/[...nextauth]/route.ts`
```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

---

### `src/middleware.ts`
```ts
import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  if (isDashboard && !isLoggedIn) {
    return Response.redirect(new URL("/auth/login", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
```

---

### `src/lib/readability.ts`

Implement Flesch-Kincaid Reading Ease. Formula:
```
score = 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
```

Syllable counting: count vowel groups (a, e, i, o, u) per word, treating consecutive vowels as one syllable, with a minimum of 1 per word.

Label mapping:
| Score | Label |
|---|---|
| 90–100 | Very Easy |
| 80–89 | Easy |
| 70–79 | Fairly Easy |
| 60–69 | Standard |
| 50–59 | Fairly Difficult |
| 30–49 | Difficult |
| 0–29 | Very Confusing |

Export: `fleschKincaid(text: string): { score: number; label: string }`

Edge cases: if text has 0 sentences or 0 words, return `{ score: 0, label: "Very Confusing" }`.

---

### `src/lib/openai.ts`

```ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyseText(text: string): Promise<{
  summary: string;
  keywords: string[];
}> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a text analysis assistant. Given a passage of text, return a JSON object with exactly two keys:
- "summary": a 3-5 sentence summary of the text (abstractive, in your own words, capturing the main idea)
- "keywords": an array of 8-12 significant terms or short phrases from the text (nouns, proper nouns, technical terms; no stop words)

Return only valid JSON. No markdown. No explanation.`,
      },
      { role: "user", content: text },
    ],
  });

  const raw = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(raw);

  return {
    summary: String(parsed.summary ?? ""),
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
  };
}
```

---

### `src/lib/tokens.ts`

```ts
import crypto from "crypto";

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
```

Token flow: generate a raw token → send raw token in email URL → store only the hash in DB → on verification, hash the incoming token and compare.

Token expiry: verification tokens expire in 24 hours, password reset tokens in 1 hour.

---

### `src/lib/email.ts`

```ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL!;
const BASE_URL = process.env.NEXTAUTH_URL!;

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${BASE_URL}/auth/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your TextLens email",
    html: `<p>Click <a href="${url}">here</a> to verify your email. Link expires in 24 hours.</p>`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${BASE_URL}/auth/new-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your TextLens password",
    html: `<p>Click <a href="${url}">here</a> to reset your password. Link expires in 1 hour.</p>`,
  });
}
```

---

### `src/app/api/analyse/route.ts`

This is the most important API route. Implement it exactly as described:

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fleschKincaid } from "@/lib/readability";
import { analyseText } from "@/lib/openai";
// import ratelimiter if implemented

export async function POST(req: NextRequest) {
  // 1. Rate limit check (IP-based)
  // 2. Parse body: { text: string }
  // 3. Validate: typeof text === "string", length 50–10000
  //    → 400 if invalid
  // 4. Get session (may be null for guests)
  // 5. Start timer: const start = Date.now()
  // 6. Compute readability: const { score, label } = fleschKincaid(text)
  // 7. Call OpenAI: const { summary, keywords } = await analyseText(text)
  // 8. processingMs = Date.now() - start
  // 9. If session?.user?.id: save to DB
  //    prisma.analysis.create({ data: { userId, inputSnippet: text.slice(0,200),
  //      inputLength: text.length, summary, keywords, readabilityScore: score,
  //      readabilityLabel: label, modelUsed: "gpt-4o-mini", processingMs } })
  // 10. Return JSON: { summary, keywords, readabilityScore: score, readabilityLabel: label }
}
```

Return HTTP 400 for validation errors. Return HTTP 429 for rate limit. Return HTTP 500 with `{ error: "Analysis failed" }` for unexpected errors (do not leak internals).

---

### `src/app/api/auth/signup/route.ts` (custom signup — not NextAuth)

```
POST body: { email, password }
1. Validate email format and password length (min 8 chars)
2. Check if user already exists (prisma.user.findUnique)
   → 409 if exists
3. bcrypt.hash(password, 12)
4. prisma.user.create({ data: { email, passwordHash } })
5. generateToken() → hashToken() → prisma.verificationToken.create(
     { data: { userId, token: hashedToken, type: "email_verification",
       expiresAt: new Date(Date.now() + 24*60*60*1000) } })
6. sendVerificationEmail(email, rawToken)
7. Return 201 { message: "Check your email" }
```

---

### `src/app/api/history/route.ts`

```
GET (authenticated only)
Query params: page (default 1), limit (default 10, max 50)

1. Get session → 401 if no session
2. prisma.analysis.findMany({
     where: { userId: session.user.id },
     orderBy: { createdAt: "desc" },
     skip: (page - 1) * limit,
     take: limit,
     select: { id, inputSnippet, readabilityScore, readabilityLabel, keywords, createdAt }
   })
3. prisma.analysis.count({ where: { userId } })
4. Return { data, total, page, limit }
```

---

### `src/app/api/history/[id]/route.ts`

```
DELETE (authenticated only)
1. Get session → 401 if none
2. prisma.analysis.findUnique({ where: { id } })
   → 404 if not found
   → 403 if analysis.userId !== session.user.id (ownership check — critical)
3. prisma.analysis.delete({ where: { id } })
4. Return 200 { message: "Deleted" }
```

---

### `src/app/api/account/route.ts`

```
PATCH body: { type: "email" | "password", value: string, currentPassword?: string }
- type "email": validate new email format, check not already taken, update
- type "password": require currentPassword, verify bcrypt, hash new, update

DELETE:
- Requires confirmation — accept body { confirm: true }
- prisma.user.delete({ where: { id: session.user.id } }) (cascades to analyses + tokens)
- Call signOut() or return instruction to clear session
```

---

## Component Specifications

### `AnalysisForm.tsx`
- Client component (`"use client"`).
- State: `text` (string), `isLoading` (bool), `result` (AnalysisResult | null), `error` (string | null), `showGate` (bool).
- On mount: read `localStorage.getItem("textlens_uses")` — parse as integer.
- On submit:
  1. Count = stored count or 0.
  2. Get session (use `useSession` from `next-auth/react`).
  3. If no session AND count >= 5: set `showGate = true`, return early.
  4. Else: POST to `/api/analyse`, await result, set `result`.
  5. If no session: increment and store count in localStorage.
- Render: `<Textarea>` (shadcn), character counter (`{text.length}/10000`), `<Button>` with spinner when loading, `<ResultsPanel>` when result exists, `<GateModal>` when `showGate`.

### `ResultsPanel.tsx`
- Props: `result: { summary: string; keywords: string[]; readabilityScore: number; readabilityLabel: string }`.
- Layout: three cards (shadcn `<Card>`).
  1. Summary card — paragraph text.
  2. Keywords card — render each keyword as a `<Badge>`.
  3. Readability card — large score number, label below, brief tooltip explaining what the score means.
- No internal state; pure display component.

### `GateModal.tsx`
- Props: `open: boolean; onClose: () => void`.
- Uses shadcn `<Dialog>`.
- Content: "You've used your 5 free analyses. Create a free account to continue."
- Two buttons: "Create Account" → `/auth/signup`, "Log In" → `/auth/login`.

### `Navbar.tsx`
- Uses `useSession` — show: logo left, right side: if session → user email + "Dashboard" link + sign-out button; if no session → "Log In" + "Sign Up" buttons.
- Must be a client component.

### `HistoryList.tsx`
- Props: `entries: HistoryEntry[]; onDelete: (id: string) => void`.
- Render as a table or card list. Each row: snippet (truncated), score, label, date, delete icon button.
- Delete button calls `onDelete(id)` which triggers the parent to call `DELETE /api/history/:id` and refresh.

---

## TypeScript Types — `src/types/index.ts`

```ts
export interface AnalysisResult {
  summary: string;
  keywords: string[];
  readabilityScore: number;
  readabilityLabel: string;
}

export interface HistoryEntry {
  id: string;
  inputSnippet: string;
  readabilityScore: number;
  readabilityLabel: string;
  keywords: string[];
  createdAt: string;
}
```

---

## Coding Conventions

1. **File casing**: React components → `PascalCase.tsx`. Utilities → `camelCase.ts`. App Router files → lowercase (`page.tsx`, `route.ts`, `layout.tsx`).
2. **No default exports for utilities**. Use named exports in `lib/` files. Default exports only for page and layout components (required by Next.js App Router).
3. **Server vs. Client**: API routes and lib files are server-only. Add `"use client"` only to components that use hooks or browser APIs. Never import server-only modules (prisma, openai) in client components.
4. **Error handling in API routes**: Always return `NextResponse.json({ error: "..." }, { status: N })`. Never throw unhandled errors. Wrap handler bodies in try/catch.
5. **Auth in API routes**: Always call `const session = await auth()` at the top of protected routes. Check `session?.user?.id` before any DB operation.
6. **Prisma queries**: Always use `select` to return only needed fields — never return `passwordHash` to the client.
7. **Environment variables**: Access via `process.env.VAR_NAME`. Assert non-null with `!` only in server-side lib files where the variable is guaranteed. Log a clear error if missing.
8. **No inline styles**: Use only Tailwind utility classes. Never use `style={{}}` except for dynamic values that can't be expressed in Tailwind.
9. **Forms**: Use controlled inputs (React state). No uncontrolled refs for form values. Validate on client before submitting to save round trips.
10. **Pagination**: The history API must accept `page` and `limit` query params. The dashboard page must manage these in state and show next/prev controls.

---

## Common Mistakes to Avoid

| Mistake | Correct Approach |
|---|---|
| Importing `prisma` in a client component | Only import prisma in `lib/`, `app/api/`, or server components |
| Storing JWT or passwords in localStorage | JWTs live in httpOnly cookies managed by NextAuth; never touch them manually |
| Forgetting ownership check on DELETE /history/:id | Always verify `analysis.userId === session.user.id` before deleting |
| Calling OpenAI with `max_tokens` too low | Don't set `max_tokens`; let gpt-4o-mini use its default for the prompt |
| Using `response_format: json_object` without instructing JSON in prompt | Always include "return JSON" in the system prompt when using json_object mode |
| Storing raw token in DB | Store only `hashToken(rawToken)`; send raw token in email URL |
| Not handling Prisma unique constraint errors | Catch `PrismaClientKnownRequestError` with code `P2002` for duplicate email |
| Leaking error details to client | Return generic `{ error: "Something went wrong" }` for 500 errors |
| Forgetting `await` on `auth()` in API routes | `auth()` is async in NextAuth v5; always await it |
| Not adding `DIRECT_URL` for Supabase | Supabase requires both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) for Prisma migrations |
| Creating new OpenAI/Prisma client per request | Use the singletons in `lib/openai.ts` and `lib/prisma.ts` |
| Missing `matcher` in middleware | Without `matcher`, middleware runs on every route including static assets — always scope it |
| Using `parseInt` on localStorage value without fallback | `parseInt(localStorage.getItem("key") ?? "0", 10)` — always provide fallback |

---

## `next.config.ts` — Required Settings

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // No turbopack in production
  },
  // Allow server actions if needed
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
```

---

## Deployment Checklist

Before pushing to Vercel:
- [ ] All 6 env vars set in Vercel dashboard
- [ ] `DIRECT_URL` also set (Supabase needs it for migrations)
- [ ] `npx prisma migrate deploy` run against production DB
- [ ] Resend domain verified (or use sandbox mode for testing)
- [ ] `.env.local` is in `.gitignore`
- [ ] `prisma generate` runs as part of build (`npx prisma generate && next build`)

---

## What Done Looks Like

The app is complete when:
1. A guest can paste text, get analysis results, and is blocked on the 6th attempt with a signup prompt.
2. A new user can sign up, verify email, log in, and see their analysis history.
3. A logged-in user can delete history entries and update their account.
4. Password reset flow works end-to-end via email.
5. All routes return correct HTTP status codes and no unhandled errors reach the client.
6. The app is deployed to Vercel and all features work in production.
