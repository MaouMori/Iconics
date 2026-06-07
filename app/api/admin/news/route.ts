import { NextRequest, NextResponse } from "next/server";
import { getAuthedProfile } from "@/lib/apiAuth";
import { hasAdminAccess } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  NEWS_SETTINGS_KEY,
  NewsItem,
  normalizeNewsItems,
} from "@/lib/newsData";

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
    .eq("key", NEWS_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: normalizeNewsItems(data?.value) });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const rawItems = Array.isArray(body?.items) ? (body.items as Partial<NewsItem>[]) : null;

  if (!rawItems) {
    return NextResponse.json({ error: "Lista de noticias invalida." }, { status: 400 });
  }

  const items = normalizeNewsItems(rawItems.map((item, index) => ({
    ...item,
    order: index,
  })));

  const { error } = await supabaseAdmin
    .from("site_settings")
    .upsert({
      key: NEWS_SETTINGS_KEY,
      value: items,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items });
}
