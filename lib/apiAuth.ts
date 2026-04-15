import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getAuthedUserId(req: NextRequest) {
  const authorization = req.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const userId = userData.user?.id;
  if (userError || !userId) {
    return { error: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }) };
  }

  return { token, userId };
}

export async function getAuthedProfile(req: NextRequest) {
  const auth = await getAuthedUserId(req);
  if ("error" in auth) return { error: auth.error };

  const { userId, token } = auth;
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, email, cargo, avatar_url, username, bio, social_muted_until")
    .eq("id", userId)
    .maybeSingle();

  if (profileError || !profile) {
    return {
      error: NextResponse.json(
        { error: profileError?.message || "Perfil não encontrado." },
        { status: 404 }
      ),
    };
  }

  return { token, userId, profile };
}
