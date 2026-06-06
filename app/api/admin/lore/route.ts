import { NextRequest, NextResponse } from "next/server";
import { getAuthedProfile } from "@/lib/apiAuth";
import { hasAdminAccess } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LORE_SETTINGS_KEY, LorePageItem, normalizeLorePage, sortLorePages } from "@/lib/lore";

async function requireAdmin(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return { error: auth.error };

  if (!hasAdminAccess(auth.profile.cargo)) {
    return { error: NextResponse.json({ error: "Sem permissao." }, { status: 403 }) };
  }

  return auth;
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", LORE_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rawPages = Array.isArray(data?.value) ? (data.value as Partial<LorePageItem>[]) : [];
  const pages = sortLorePages(rawPages.map((page, index) => normalizeLorePage(page, index)));

  return NextResponse.json({ pages });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const rawPages = Array.isArray(body?.pages) ? (body.pages as Partial<LorePageItem>[]) : null;

  if (!rawPages) {
    return NextResponse.json({ error: "Lista de paginas invalida." }, { status: 400 });
  }

  const seen = new Set<string>();
  const pages = rawPages.map((page, index) => {
    const normalized = normalizeLorePage(
      { ...page, order: index, updated_at: new Date().toISOString() },
      index
    );
    let slug = normalized.slug;
    let suffix = 2;
    while (seen.has(slug)) {
      slug = `${normalized.slug}-${suffix}`;
      suffix += 1;
    }
    seen.add(slug);
    return { ...normalized, slug, id: normalized.id || slug };
  });

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({
      key: LORE_SETTINGS_KEY,
      value: pages,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pages });
}
