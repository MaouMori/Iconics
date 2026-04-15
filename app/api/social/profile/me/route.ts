import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";

function normalizeUsername(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_.]/g, "")
    .slice(0, 24);
}

export async function GET(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  return NextResponse.json({ profile: auth.profile });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  const { profile } = auth;
  const body = await req.json().catch(() => null);

  const nome = String(body?.nome || "").trim();
  const usernameRaw = String(body?.username || "").trim();
  const bio = String(body?.bio || "").trim();
  const avatarUrl = String(body?.avatar_url || "").trim();

  const patch: Record<string, string | null> = {};
  if (nome) patch.nome = nome.slice(0, 80);
  if (bio || body?.bio === "") patch.bio = bio.slice(0, 280);
  if (avatarUrl || body?.avatar_url === "") patch.avatar_url = avatarUrl || null;

  if (usernameRaw || body?.username === "") {
    const normalized = normalizeUsername(usernameRaw);
    if (!normalized) {
      patch.username = null;
    } else {
      const { data: exists } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("username", normalized)
        .neq("id", profile.id)
        .maybeSingle();
      if (exists?.id) {
        return NextResponse.json({ error: "Esse @username já está em uso." }, { status: 409 });
      }
      patch.username = normalized;
    }
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nenhuma alteração válida." }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("id", profile.id)
    .select("id, nome, email, cargo, avatar_url, username, bio")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: updated });
}
