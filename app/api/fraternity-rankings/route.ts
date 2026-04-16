import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canApproveLink } from "@/lib/memberLink";

function toNumber(input: unknown, fallback = 0) {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("fraternity_rankings")
    .select("id, nome, pontos, cor, foguete_emoji, ativo, created_at, updated_at")
    .eq("ativo", true)
    .order("pontos", { ascending: false })
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rankings: data || [] });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  if (!canApproveLink(auth.profile.cargo)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const nome = String(body?.nome || "").trim();
  const pontos = toNumber(body?.pontos, 0);
  const cor = String(body?.cor || "#a855f7").trim();
  const fogueteEmoji = String(body?.foguete_emoji || "🚀").trim();

  if (!nome) {
    return NextResponse.json({ error: "Nome da fraternidade obrigatorio." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("fraternity_rankings")
    .insert({
      nome,
      pontos,
      cor: cor || "#a855f7",
      foguete_emoji: fogueteEmoji || "🚀",
      ativo: true,
    })
    .select("id, nome, pontos, cor, foguete_emoji, ativo")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: data });
}

