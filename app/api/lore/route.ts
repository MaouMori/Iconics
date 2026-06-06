import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { LORE_SETTINGS_KEY, LorePageItem, normalizeLorePage, sortLorePages } from "@/lib/lore";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", LORE_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rawPages = Array.isArray(data?.value) ? (data.value as Partial<LorePageItem>[]) : [];
  const pages = sortLorePages(rawPages.map((page, index) => normalizeLorePage(page, index)))
    .filter((page) => page.published);

  return NextResponse.json({ pages });
}
