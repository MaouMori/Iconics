import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canApproveLink } from "@/lib/memberLink";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;

  if (!canApproveLink(profile.cargo)) {
    return NextResponse.json({ error: "Sem permissão para moderação." }, { status: 403 });
  }

  const { id } = await context.params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Post inválido." }, { status: 400 });
  }

  const { data: post } = await supabaseAdmin
    .from("social_posts")
    .select("profile_id")
    .eq("id", postId)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("social_posts").delete().eq("id", postId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (post?.profile_id) {
    await supabaseAdmin.from("site_notifications").insert({
      profile_id: post.profile_id,
      kind: "moderation",
      title: "Uma publicação foi removida",
      body: "Sua publicação foi removida pela moderação.",
      payload: { post_id: postId },
    });
  }

  return NextResponse.json({ ok: true });
}
