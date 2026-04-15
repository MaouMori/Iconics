import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;

  const { id } = await context.params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Post inválido." }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("social_post_likes")
    .select("post_id")
    .eq("post_id", postId)
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (existing?.post_id) {
    await supabaseAdmin
      .from("social_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("profile_id", profile.id);
  } else {
    await supabaseAdmin.from("social_post_likes").insert({
      post_id: postId,
      profile_id: profile.id,
    });

    const { data: postOwner } = await supabaseAdmin
      .from("social_posts")
      .select("profile_id")
      .eq("id", postId)
      .maybeSingle();

    const ownerId = String(postOwner?.profile_id || "");
    if (ownerId && ownerId !== profile.id) {
      await supabaseAdmin.from("site_notifications").insert({
        profile_id: ownerId,
        kind: "like",
        title: "Seu post recebeu uma curtida",
        body: `${profile.nome || "Membro"} curtiu sua publicação.`,
        payload: { post_id: postId, by_profile_id: profile.id },
      });
    }
  }

  const { data: likesData } = await supabaseAdmin
    .from("social_post_likes")
    .select("post_id")
    .eq("post_id", postId);

  return NextResponse.json({
    ok: true,
    liked: !existing?.post_id,
    likeCount: (likesData || []).length,
  });
}
