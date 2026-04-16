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

function normalizeUsuario(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_.-]/g, "")
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
  const usuarioRaw = String(body?.usuario || "").trim();
  const bio = String(body?.bio || "").trim();
  const avatarUrl = String(body?.avatar_url || "").trim();
  const emailRaw = String(body?.email || "").trim().toLowerCase();
  const passwordRaw = String(body?.password || "").trim();

  const patch: Record<string, string | null> = {};
  let authUpdated = false;

  if (nome) patch.nome = nome.slice(0, 80);
  if (bio || body?.bio === "") patch.bio = bio.slice(0, 280);
  if (avatarUrl || body?.avatar_url === "") patch.avatar_url = avatarUrl || null;

  if (emailRaw || body?.email === "") {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);
    if (!isValidEmail) {
      return NextResponse.json({ error: "Informe um e-mail valido." }, { status: 400 });
    }
    patch.email = emailRaw;
  }

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
        return NextResponse.json({ error: "Esse @username ja esta em uso." }, { status: 409 });
      }
      patch.username = normalized;
    }
  }

  if (usuarioRaw || body?.usuario === "") {
    const normalizedUsuario = normalizeUsuario(usuarioRaw);
    if (!normalizedUsuario) {
      patch.usuario = null;
    } else {
      const { data: existsUsuario } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("usuario", normalizedUsuario)
        .neq("id", profile.id)
        .maybeSingle();

      if (existsUsuario?.id) {
        return NextResponse.json({ error: "Esse usuario ja esta em uso." }, { status: 409 });
      }
      patch.usuario = normalizedUsuario;
    }
  }

  if (passwordRaw) {
    if (passwordRaw.length < 6) {
      return NextResponse.json({ error: "A senha precisa ter pelo menos 6 caracteres." }, { status: 400 });
    }

    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      password: passwordRaw,
    });

    if (passwordError) {
      return NextResponse.json({ error: passwordError.message }, { status: 400 });
    }
    authUpdated = true;
  }

  if (patch.email && patch.email !== profile.email) {
    const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      email: patch.email,
    });

    if (emailError) {
      return NextResponse.json({ error: emailError.message }, { status: 400 });
    }
    authUpdated = true;
  }

  if (Object.keys(patch).length === 0 && !authUpdated) {
    return NextResponse.json({ error: "Nenhuma alteracao valida." }, { status: 400 });
  }

  if (Object.keys(patch).length === 0 && authUpdated) {
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, nome, email, cargo, avatar_url, username, usuario, bio, social_muted_until")
      .eq("id", profile.id)
      .single();

    return NextResponse.json({ ok: true, profile: currentProfile || profile });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("profiles")
    .update(patch)
    .eq("id", profile.id)
    .select("id, nome, email, cargo, avatar_url, username, usuario, bio, social_muted_until")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile: updated });
}
