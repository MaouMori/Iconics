import { NextResponse } from "next/server";
import { PAGE_VISIBILITY_SETTINGS_KEY, normalizePageVisibility } from "@/lib/pageVisibility";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", PAGE_VISIBILITY_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ visibility: normalizePageVisibility(null) });
  }

  return NextResponse.json({
    visibility: normalizePageVisibility(data?.value),
  });
}
