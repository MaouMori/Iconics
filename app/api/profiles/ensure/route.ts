import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type AuthUserLike = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

function pickDisplayName(user: AuthUserLike): string {
  const metadata = user?.user_metadata || {};
  const fallbackEmail = String(user?.email || "").split("@")[0] || "Membro";
  const raw =
    metadata.nome ||
    metadata.name ||
    metadata.full_name ||
    metadata.user_name ||
    fallbackEmail;
  return String(raw || "Membro").trim().slice(0, 80) || "Membro";
}

function normalizeUsuario(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9_.-]/g, "")
    .slice(0, 24);
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const user = userData.user;
  if (userError || !user?.id) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const userId = user.id;
  const userEmail = user.email || null;
  const usuarioFromMetadata = normalizeUsuario(user.user_metadata?.usuario);
  const nome = pickDisplayName(user);

  const { data: existing, error: selectError } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, email, cargo, usuario")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (existing?.id) {
    const patch: Record<string, string | null> = {};
    if (!existing.nome) patch.nome = nome;
    if (!existing.email && userEmail) patch.email = userEmail;
    if (!existing.usuario && usuarioFromMetadata) patch.usuario = usuarioFromMetadata;
    if (Object.keys(patch).length > 0) {
      await supabaseAdmin.from("profiles").update(patch).eq("id", userId);
    }
    return NextResponse.json({ ok: true, created: false, profileId: userId });
  }

  const { error: insertError } = await supabaseAdmin.from("profiles").insert({
    id: userId,
    nome,
    email: userEmail,
    cargo: "calouro",
    usuario: usuarioFromMetadata || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, created: true, profileId: userId });
}
