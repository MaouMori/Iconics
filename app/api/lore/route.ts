import { NextResponse } from "next/server";
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

export async function GET() {
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
  const pages = sortLorePages(rawPages.map((page, index) => normalizeLorePage(page, index)))
    .filter((page) => page.published);
  const categories = deriveLoreCategories(
    pages,
    rawCategories.map((category, index) => normalizeLoreCategory(category, index))
  );

  return NextResponse.json({ pages, categories });
}
