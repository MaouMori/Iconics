import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";

export async function POST(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  const { profile } = auth;
  const body = await req.json().catch(() => null);
  const content = String(body?.content || "").trim();
  const imageUrl = String(body?.imageUrl || "").trim();

  if (content.length < 1 || content.length > 1200) {
    return NextResponse.json(
      { error: "Conteúdo deve ter entre 1 e 1200 caracteres." },
      { status: 400 }
    );
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("social_posts")
    .insert({
      profile_id: profile.id,
      content,
      image_url: imageUrl || null,
    })
    .select("id, profile_id, content, image_url, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    post: {
      ...inserted,
      author: {
        id: profile.id,
        nome: profile.nome,
        username: profile.username,
        avatar_url: profile.avatar_url,
      },
      like_count: 0,
      comment_count: 0,
      liked_by_me: false,
      recent_comments: [],
    },
  });
}
