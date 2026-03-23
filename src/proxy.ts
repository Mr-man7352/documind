import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Already signed in → redirect away from login page
  if (token && pathname === "/login") {
    return NextResponse.redirect(new URL("/callback", req.url));
  }

  // Not signed in → redirect to login for protected app routes
  if (!token && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

function isPublicPath(pathname: string) {
  return (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/callback") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/widget") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  );
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
