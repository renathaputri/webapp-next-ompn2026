import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;
  const isLoggedIn = !!user;
  const pathname = nextUrl.pathname;

  // 1. Tangani redirect login jika pengguna sudah terautentikasi
  if (isLoggedIn) {
    // Jika wajib ganti password, cegah akses halaman selain /ganti-password
    if (user.mustChangePassword && pathname !== "/ganti-password" && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/ganti-password", nextUrl));
    }

    // Jika sudah tidak wajib ganti password tapi mengakses /ganti-password
    if (!user.mustChangePassword && pathname === "/ganti-password") {
      const redirectUrl = user.role === "ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }

    // Akses ke halaman login saat sudah login
    if (pathname === "/login") {
      const redirectUrl = user.role === "ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, nextUrl));
    }

    if (pathname === "/admin/login") {
      if (user.role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      }
    }
  }

  // 2. Proteksi rute admin (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return NextResponse.next();
    }

    if (!isLoggedIn || user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/admin/login", nextUrl));
    }
  }

  // 3. Proteksi rute peserta (/dashboard/* dan /exam/*)
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/exam")) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/exam/:path*",
    "/ganti-password",
    "/login",
  ],
};
