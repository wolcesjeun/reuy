import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const requestCache = new Map<string, { count: number; timestamp: number }>();

async function checkRequestLimit(ip: string): Promise<number> {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const current = requestCache.get(ip) || { count: 0, timestamp: now };

  if (now - current.timestamp > windowMs) {
    current.count = 0;
    current.timestamp = now;
  }

  current.count++;
  requestCache.set(ip, current);

  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > windowMs) {
      requestCache.delete(key);
    }
  }

  return current.count;
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const requestCount = await checkRequestLimit(ip);

  if (requestCount > 100) {
    return new NextResponse(
      JSON.stringify({
        error: "Çok fazla istek gönderildi. Lütfen biraz bekleyin.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      }
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { pathname } = req.nextUrl;
  const authCookie = req.cookies.get("supabase-auth-token");
  const hasAuthCookie = !!authCookie?.value;

  const securityHeaders = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "X-XSS-Protection": "1; mode=block",
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  if (pathname.startsWith("/auth/")) {
    if (session || hasAuthCookie) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return res;
  }

  if (!session && !hasAuthCookie) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
