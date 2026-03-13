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