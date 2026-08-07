import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale } from "@/lib/i18n/dictionary";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignore static files (images + video) and the API
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    /\.(svg|png|jpg|jpeg|ico|webp|txt|xml|mp4|webm|gif)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // If the path already starts with a valid locale, pass it through
  const firstSegment = pathname.split("/")[1];
  if (firstSegment && isLocale(firstSegment)) {
    return NextResponse.next();
  }

  // Redirect from / to the default language
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
