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
  const mutedUntil = profile.social_muted_until ? String(profile.social_muted_until) : "";
  if (mutedUntil && new Date(mutedUntil).getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Sua conta está temporariamente silenciada para novos comentários." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const postId = Number(id);
  if (!Number.isInteger(postId) || postId <= 0) {
    return NextResponse.json({ error: "Post inválido." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const content = String(body?.content || "").trim();
  if (content.length < 1 || content.length > 600) {
    return NextResponse.json(
      { error: "Comentário deve ter entre 1 e 600 caracteres." },
      { status: 400 }
    );
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("social_post_comments")
    .insert({
      post_id: postId,
      profile_id: profile.id,
      content,
    })
    .select("id, post_id, profile_id, content, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: postOwner } = await supabaseAdmin
    .from("social_posts")
    .select("profile_id")
    .eq("id", postId)
    .maybeSingle();

  const recipientId = String(postOwner?.profile_id || "");
  if (recipientId && recipientId !== profile.id) {
    await supabaseAdmin.from("site_notifications").insert({
      profile_id: recipientId,
      kind: "comment",
      title: "Novo comentário no seu post",
      body: `${profile.nome || "Membro"} comentou: ${content.slice(0, 120)}`,
      payload: { post_id: postId, by_profile_id: profile.id },
    });
  }

  return NextResponse.json({
    ok: true,
    comment: {
      ...inserted,
      author: {
        id: profile.id,
        nome: profile.nome,
        username: profile.username,
        avatar_url: profile.avatar_url,
      },
    },
  });
}
