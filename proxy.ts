import { NextRequest, NextResponse } from "next/server";
import {
  PAGE_VISIBILITY_SETTINGS_KEY,
  isManagedPathDisabled,
  normalizePageVisibility,
} from "@/lib/pageVisibility";

const PUBLIC_FILE = /\.(.*)$/;

async function loadVisibility() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return normalizePageVisibility(null);
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/site_settings?key=eq.${PAGE_VISIBILITY_SETTINGS_KEY}&select=value`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      next: { revalidate: 10 },
    }
  ).catch(() => null);

  if (!response?.ok) {
    return normalizePageVisibility(null);
  }

  const rows = await response.json().catch(() => []);
  return normalizePageVisibility(rows?.[0]?.value);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname === "/pagina-indisponivel" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const visibility = await loadVisibility();

  if (!isManagedPathDisabled(pathname, visibility)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/pagina-indisponivel";
  url.searchParams.set("from", pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
