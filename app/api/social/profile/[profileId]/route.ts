import { NextRequest, NextResponse } from "next/server";
import { getAuthedProfile } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Context = {
  params: Promise<{ profileId: string }>;
};

export async function GET(req: NextRequest, context: Context) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;
  const { profileId } = await context.params;

  const targetId = String(profileId || "").trim();
  if (!targetId) {
    return NextResponse.json({ error: "Perfil invalido." }, { status: 400 });
  }

  const { data: targetProfile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, username, email, cargo, avatar_url, bio")
    .eq("id", targetId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!targetProfile) {
    return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 404 });
  }

  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    supabaseAdmin
      .from("social_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_profile_id", targetId),
    supabaseAdmin
      .from("social_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_profile_id", targetId),
  ]);

  const { data: myFollow } = await supabaseAdmin
    .from("social_follows")
    .select("id")
    .eq("follower_profile_id", profile.id)
    .eq("following_profile_id", targetId)
    .maybeSingle();

  const { data: recentPosts } = await supabaseAdmin
    .from("social_posts")
    .select("id, content, image_url, created_at, like_count, comment_count")
    .eq("profile_id", targetId)
    .order("created_at", { ascending: false })
    .limit(20);

  const normalizedPosts = (recentPosts || []).map((post) => ({
    id: Number(post.id),
    content: String(post.content || ""),
    image_url: post.image_url ? String(post.image_url) : null,
    created_at: String(post.created_at || ""),
    like_count: Number(post.like_count || 0),
    comment_count: Number(post.comment_count || 0),
  }));

  return NextResponse.json({
    profile: targetProfile,
    followersCount: followersCount || 0,
    followingCount: followingCount || 0,
    following: Boolean(myFollow?.id),
    recentPosts: normalizedPosts,
  });
}
