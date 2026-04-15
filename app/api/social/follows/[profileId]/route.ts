import { NextRequest, NextResponse } from "next/server";
import { getAuthedProfile } from "@/lib/apiAuth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Context = {
  params: Promise<{ profileId: string }>;
};

export async function POST(req: NextRequest, context: Context) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;
  const { profileId } = await context.params;

  const targetId = String(profileId || "").trim();
  if (!targetId) {
    return NextResponse.json({ error: "Perfil invalido." }, { status: 400 });
  }
  if (targetId === profile.id) {
    return NextResponse.json({ error: "Voce nao pode seguir a si mesmo." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("social_follows").insert({
    follower_profile_id: profile.id,
    following_profile_id: targetId,
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, following: true });
}

export async function DELETE(req: NextRequest, context: Context) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;
  const { profileId } = await context.params;

  const targetId = String(profileId || "").trim();
  if (!targetId) {
    return NextResponse.json({ error: "Perfil invalido." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("social_follows")
    .delete()
    .eq("follower_profile_id", profile.id)
    .eq("following_profile_id", targetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, following: false });
}

