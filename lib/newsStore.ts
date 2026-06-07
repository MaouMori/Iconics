import { NEWS_SETTINGS_KEY, normalizeNewsItems } from "@/lib/newsData";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function loadNewsItems() {
  const { data } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", NEWS_SETTINGS_KEY)
    .maybeSingle();

  return normalizeNewsItems(data?.value);
}
