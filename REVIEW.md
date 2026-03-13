# Code Review — TextLens

**Verdict: NEEDS_FIXES**

---

## 1. Bugs (Runtime Errors)

### B1 — All source files wrapped in markdown code fences
Every `.ts`, `.tsx`, and `prisma` file starts with ` ```ts ` / ` ```tsx ` / ` ```prisma ` and ends with ` ``` `. These are literal characters in the files, not syntax highlighting. TypeScript and Prisma will refuse to parse them. The project cannot build at all.
- Affects all 31 source files.

### B2 — Navbar: Sign Out button does nothing
`src/components/Navbar.tsx` — the Sign Out button calls `e.preventDefault()` but never calls `signOut()`. Users are permanently stuck logged in.

```tsx
// Current (broken)
<Link href="/auth/login" onClick={(e) => { e.preventDefault(); }}>Sign Out</Link>
// Fix: import signOut and call it
```

### B3 — Navbar: default export imported as named export
`src/components/Navbar.tsx` uses `export default function Navbar()`, but every consuming page imports it as `import { Navbar } from "@/components/Navbar"` (named import). TypeScript will error: "Module has no exported member 'Navbar'".
- Affects: `src/app/page.tsx`, `src/app/dashboard/page.tsx`, `src/app/dashboard/settings/page.tsx`.

### B4 — `settings/page.tsx` uses Card components without importing them
`src/app/dashboard/settings/page.tsx` renders `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>` but only imports `Button`, `Input`, `Label`, and `DeleteAccountDialog`. This crashes at runtime with "Card is not defined".

### B5 — Email verification is non-functional
`src/app/auth/verify-email/page.tsx` is a static page that ignores the `?token=` query parameter from the verification email. Users who click the email link will never have their email verified. Since `auth.ts` blocks login when `emailVerified` is false, **no registered user can ever log in**.

### B6 — Password reset flow has no handlers
`src/app/auth/reset-password/page.tsx` and `src/app/auth/new-password/page.tsx` are static stubs with `<form>` elements that have no `onSubmit` handler and no API call. No `"use client"` directive. These pages do nothing when submitted.

### B7 — `DeleteAccountDialog` deletes immediately with no confirmation
`src/components/DeleteAccountDialog.tsx` imports `Dialog`, `DialogContent` etc. from `@/components/ui/dialog` but never uses them. The "Delete Account" button fires `onConfirm()` immediately with no confirmation step.

### B8 — Next.js 15 dynamic route params must be awaited
`src/app/api/history/[id]/route.ts` destructures `{ params }` as a plain object, but Next.js 15 changed `params` to be a `Promise`. Accessing `params.id` synchronously will return `undefined`.

```ts
// Fix: change signature and await params
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
```

---

## 2. Missing Connections (References to Non-Existent Things)

### M1 — `src/components/ui/` directory does not exist
The entire `src/components/ui/` directory is missing. Every component in the app imports from paths like `@/components/ui/button`, `@/components/ui/card`, `@/components/ui/dialog`, `@/components/ui/input`, `@/components/ui/label`, `@/components/ui/badge`, `@/components/ui/textarea`. None of these files exist. The project cannot compile.

### M2 — `globals.css` is missing
`src/app/layout.tsx` imports `"./globals.css"` but this file does not exist in the project.

### M3 — `@prisma/client` not in `package.json`
`src/lib/prisma.ts` imports from `"@prisma/client"` but the package is not listed in `package.json`. `prisma` (CLI) is listed but `@prisma/client` (runtime) is not.

### M4 — `DIRECT_URL` missing from `.env.example`
`prisma/schema.prisma` requires `env("DIRECT_URL")` for Supabase connection pooling, but `.env.example` only documents `DATABASE_URL`.

### M5 — No API route for email verification
`src/lib/email.ts` sends a link to `/auth/verify-email?token=...` but no API endpoint exists to receive and validate that token. The token is never consumed.

### M6 — No API routes for password reset
The password reset flow requires:
- `POST /api/auth/reset-password` — accepts email, sends reset email
- `POST /api/auth/new-password` — accepts token + new password, updates password hash

Neither route exists.

### M7 — shadcn/ui peer dependencies missing from `package.json`
`@radix-ui/react-dialog`, `class-variance-authority`, `clsx`, and `tailwind-merge` are required by shadcn/ui components but absent from `package.json`.

---

## 3. Security Issues

### S1 — Email update does not reset `emailVerified`
`src/app/api/account/route.ts` (PATCH `type: "email"`) updates the email address but does not set `emailVerified = false`. A user can change their email to an arbitrary address and retain a verified status without owning the new address.

### S2 — No rate limiting on `/api/analyse`
The spec explicitly requires rate limiting (20 req/min per IP). No rate limiting is implemented. The endpoint makes an OpenAI API call on every request; unlimited requests are an open cost vector.

---

## 4. Missing Pieces (Spec Features Not Built)

### P1 — Email verification token handler
The spec requires email verification on signup. The flow starts correctly (token generated, email sent) but the token handler endpoint and the page that processes it are both missing.

### P2 — Password reset flow
The spec requires a full password reset flow. The database schema, email sending, and token generation utilities all exist, but the API routes and functional UI pages to tie them together are absent.

### P3 — `DeleteAccountDialog` confirmation step
The spec says users can delete their account from settings. The dialog should require a confirmation click before proceeding. The current implementation skips this entirely.

---

## 5. Verdict

**NEEDS_FIXES**

### Fix List

1. **`src/lib/auth.ts`** — Remove the ` ```ts ` first line and ` ``` ` last line.
2. **`src/lib/openai.ts`** — Same as above.
3. **`src/lib/email.ts`** — Same as above.
4. **`src/lib/tokens.ts`** — Same as above.
5. **`src/lib/prisma.ts`** — Same as above.
6. **`src/lib/readability.ts`** — Same as above.
7. **`src/middleware.ts`** — Same as above.
8. **`src/types/index.ts`** — Same as above.
9. **`src/app/api/account/route.ts`** — Remove code fences; add `emailVerified: false` to the email update data.
10. **`src/app/api/analyse/route.ts`** — Remove code fences.
11. **`src/app/api/auth/[...nextauth]/route.ts`** — Remove code fences.
12. **`src/app/api/auth/signup/route.ts`** — Remove code fences.
13. **`src/app/api/history/[id]/route.ts`** — Remove code fences; change `params` to `Promise<{ id: string }>` and `await` it.
14. **`src/app/api/history/route.ts`** — Remove code fences.
15. **`src/app/auth/login/page.tsx`** — Remove code fences.
16. **`src/app/auth/signup/page.tsx`** — Remove code fences.
17. **`src/app/auth/verify-email/page.tsx`** — Remove code fences; add `"use client"`, read `?token=` from URL with `useSearchParams`, call new verify-email API route, show success/error state.
18. **`src/app/auth/reset-password/page.tsx`** — Remove code fences; add `"use client"`, `useState`, `onSubmit` handler that calls `POST /api/auth/reset-password`.
19. **`src/app/auth/new-password/page.tsx`** — Remove code fences; add `"use client"`, `useState`, `onSubmit` handler that reads `?token=` and calls `POST /api/auth/new-password`.
20. **`src/app/dashboard/page.tsx`** — Remove code fences.
21. **`src/app/dashboard/settings/page.tsx`** — Remove code fences; add `Card`, `CardHeader`, `CardTitle`, `CardContent` to imports.
22. **`src/app/layout.tsx`** — Remove code fences.
23. **`src/app/page.tsx`** — Remove code fences.
24. **`src/app/error.tsx`** — Remove code fences.
25. **`src/app/not-found.tsx`** — Remove code fences.
26. **`src/components/AnalysisForm.tsx`** — Remove code fences.
27. **`src/components/Navbar.tsx`** — Remove code fences; change to named export `export function Navbar()`; import and call `signOut` from `next-auth/react`.
28. **`src/components/HistoryList.tsx`** — Remove code fences.
29. **`src/components/ResultsPanel.tsx`** — Remove code fences.
30. **`src/components/GateModal.tsx`** — Remove code fences.
31. **`src/components/DeleteAccountDialog.tsx`** — Remove code fences; add `useState` for open state; wrap the button in a Dialog that requires a second "Confirm" click.
32. **`prisma/schema.prisma`** — Remove the ` ```prisma ` first line and ` ``` ` last line.
33. **`next.config.ts`** — Remove code fences.
34. **Create `src/app/globals.css`** — Add Tailwind directives.
35. **Create `src/components/ui/button.tsx`** — Implement Button component.
36. **Create `src/components/ui/card.tsx`** — Implement Card, CardHeader, CardContent, CardTitle, CardFooter.
37. **Create `src/components/ui/dialog.tsx`** — Implement Dialog using Radix UI.
38. **Create `src/components/ui/input.tsx`** — Implement Input component.
39. **Create `src/components/ui/label.tsx`** — Implement Label component.
40. **Create `src/components/ui/badge.tsx`** — Implement Badge component.
41. **Create `src/components/ui/textarea.tsx`** — Implement Textarea component.
42. **Create `src/app/api/auth/verify-email/route.ts`** — POST endpoint: find token by hash, check not expired and type, set `emailVerified = true`, delete token.
43. **Create `src/app/api/auth/reset-password/route.ts`** — POST endpoint: find user by email, generate reset token, send reset email.
44. **Create `src/app/api/auth/new-password/route.ts`** — POST endpoint: find token by hash, check not expired, update password hash, delete token.
45. **`package.json`** — Add `@prisma/client`, `@radix-ui/react-dialog`, `class-variance-authority`, `clsx`, `tailwind-merge`.
46. **`.env.example`** — Add `DIRECT_URL=`.
