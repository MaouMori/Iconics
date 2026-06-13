import { NextRequest, NextResponse } from "next/server";
import { getAuthedProfile } from "@/lib/apiAuth";
import { sendSiteLog } from "@/lib/discordSiteLogs";
import { hasAdminAccess } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  MANAGED_SITE_PAGES,
  PAGE_VISIBILITY_SETTINGS_KEY,
  normalizePageVisibility,
  type PageVisibilityMap,
} from "@/lib/pageVisibility";

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
    .eq("key", PAGE_VISIBILITY_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    pages: MANAGED_SITE_PAGES,
    visibility: normalizePageVisibility(data?.value),
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const rawVisibility = normalizePageVisibility(body?.visibility);
  const visibility = MANAGED_SITE_PAGES.reduce<PageVisibilityMap>((acc, page) => {
    acc[page.key] = rawVisibility[page.key] !== false;
    return acc;
  }, {});

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({
      key: PAGE_VISIBILITY_SETTINGS_KEY,
      value: visibility,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const disabledPages = MANAGED_SITE_PAGES
    .filter((page) => visibility[page.key] === false)
    .map((page) => page.label)
    .join(", ") || "Nenhuma";
  await sendSiteLog("Visibilidade de paginas alterada", "A lista de paginas ativas do site foi atualizada.", [
    { name: "Paginas desativadas", value: disabledPages, inline: false },
    { name: "Responsavel", value: auth.profile.nome || auth.profile.email || auth.userId, inline: false },
  ]);

  return NextResponse.json({ ok: true, pages: MANAGED_SITE_PAGES, visibility });
}
