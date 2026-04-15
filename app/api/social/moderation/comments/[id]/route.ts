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
  const commentId = Number(id);
  if (!Number.isInteger(commentId) || commentId <= 0) {
    return NextResponse.json({ error: "Comentário inválido." }, { status: 400 });
  }

  const { data: comment } = await supabaseAdmin
    .from("social_post_comments")
    .select("profile_id")
    .eq("id", commentId)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from("social_post_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (comment?.profile_id) {
    await supabaseAdmin.from("site_notifications").insert({
      profile_id: comment.profile_id,
      kind: "moderation",
      title: "Um comentário foi removido",
      body: "Seu comentário foi removido pela moderação.",
      payload: { comment_id: commentId },
    });
  }

  return NextResponse.json({ ok: true });
}
