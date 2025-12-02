import { auth } from "@/auth";
import { NextResponse } from "next/server";

// Route yang tidak memerlukan autentikasi
const publicRoutes = ["/login", "/api/auth"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if not logged in and accessing non-public route
  if (!isPublicRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to home if accessing login while already logged in
  if (nextUrl.pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
