import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canApproveLink } from "@/lib/memberLink";

type Params = {
  params: Promise<{ id: string }>;
};

function toNumber(input: unknown, fallback = 0) {
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function authorize(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return { error: auth.error };
  if (!canApproveLink(auth.profile.cargo)) {
    return {
      error: NextResponse.json({ error: "Sem permissao." }, { status: 403 }),
    };
  }
  return auth;
}

export async function PATCH(req: NextRequest, context: Params) {
  const auth = await authorize(req);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const rankingId = Number(id);
  if (!Number.isFinite(rankingId) || rankingId <= 0) {
    return NextResponse.json({ error: "ID invalido." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const update: Record<string, unknown> = {};

  if (typeof body?.nome !== "undefined") update.nome = String(body.nome || "").trim();
  if (typeof body?.pontos !== "undefined") update.pontos = toNumber(body.pontos, 0);
  if (typeof body?.cor !== "undefined") update.cor = String(body.cor || "#a855f7").trim();
  if (typeof body?.foguete_emoji !== "undefined") {
    update.foguete_emoji = String(body.foguete_emoji || "🚀").trim();
  }
  if (typeof body?.ativo !== "undefined") update.ativo = Boolean(body.ativo);

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("fraternity_rankings")
    .update(update)
    .eq("id", rankingId)
    .select("id, nome, pontos, cor, foguete_emoji, ativo")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(req: NextRequest, context: Params) {
  const auth = await authorize(req);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const rankingId = Number(id);
  if (!Number.isFinite(rankingId) || rankingId <= 0) {
    return NextResponse.json({ error: "ID invalido." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("fraternity_rankings")
    .delete()
    .eq("id", rankingId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

