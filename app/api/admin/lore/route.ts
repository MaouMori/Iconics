import { NextRequest, NextResponse } from "next/server";
import { getAuthedProfile } from "@/lib/apiAuth";
import { sendSiteLog } from "@/lib/discordSiteLogs";
import { hasAdminAccess } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  deriveLoreCategories,
  LORE_CATEGORIES_KEY,
  LORE_SETTINGS_KEY,
  LoreCategory,
  LorePageItem,
  normalizeLoreCategory,
  normalizeLorePage,
  sortLorePages,
} from "@/lib/lore";

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
    .select("key, value")
    .in("key", [LORE_SETTINGS_KEY, LORE_CATEGORIES_KEY]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const pagesRow = data?.find((row) => row.key === LORE_SETTINGS_KEY);
  const categoriesRow = data?.find((row) => row.key === LORE_CATEGORIES_KEY);
  const rawPages = Array.isArray(pagesRow?.value) ? (pagesRow.value as Partial<LorePageItem>[]) : [];
  const rawCategories = Array.isArray(categoriesRow?.value)
    ? (categoriesRow.value as Partial<LoreCategory>[])
    : [];
  const pages = sortLorePages(rawPages.map((page, index) => normalizeLorePage(page, index)));
  const categories = deriveLoreCategories(
    pages,
    rawCategories.map((category, index) => normalizeLoreCategory(category, index))
  );

  return NextResponse.json({ pages, categories });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const rawPages = Array.isArray(body?.pages) ? (body.pages as Partial<LorePageItem>[]) : null;
  const rawCategories = Array.isArray(body?.categories)
    ? (body.categories as Partial<LoreCategory>[])
    : [];

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
  const categories = deriveLoreCategories(
    pages,
    rawCategories.map((category, index) => normalizeLoreCategory(category, index))
  );

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert([
      {
        key: LORE_SETTINGS_KEY,
        value: pages,
        updated_at: new Date().toISOString(),
      },
      {
        key: LORE_CATEGORIES_KEY,
        value: categories,
        updated_at: new Date().toISOString(),
      },
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await sendSiteLog("Wiki atualizada", `${pages.length} pagina(s) e ${categories.length} categoria(s) foram salvas na wiki.`, [
    { name: "Responsavel", value: auth.profile.nome || auth.profile.email || auth.userId, inline: false },
  ]);

  return NextResponse.json({ ok: true, pages, categories });
}
