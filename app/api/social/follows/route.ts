import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;

  const { count: followersCount } = await supabaseAdmin
    .from("social_follows")
    .select("*", { count: "exact", head: true })
    .eq("following_profile_id", profile.id);

  const { count: followingCount } = await supabaseAdmin
    .from("social_follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_profile_id", profile.id);

  const { data: myFollowingData } = await supabaseAdmin
    .from("social_follows")
    .select("following_profile_id")
    .eq("follower_profile_id", profile.id);

  const followingIds = (myFollowingData || []).map((item) => String(item.following_profile_id));

  return NextResponse.json({
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
    followingIds,
  });
}

