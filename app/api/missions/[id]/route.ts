import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canManageMissions } from "@/lib/missionRules";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  if (!canManageMissions(auth.profile.cargo)) {
    return NextResponse.json({ error: "Apenas lideranca pode editar missoes." }, { status: 403 });
  }

  const { id } = await context.params;
  const missionId = Number(id);
  const body = await req.json().catch(() => null);

  const patch = {
    title: String(body?.title || "").trim().slice(0, 120),
    summary: String(body?.summary || "").trim().slice(0, 240),
    details: String(body?.details || "").trim().slice(0, 1200) || null,
    category: String(body?.category || "geral").trim().slice(0, 40),
    difficulty: String(body?.difficulty || "media").trim().slice(0, 40),
    required_level: toInt(body?.required_level, 0),
    visible_level: toInt(body?.visible_level, 0),
    reward_influence: toInt(body?.reward_influence, 50),
    time_limit_hours: Math.max(1, toInt(body?.time_limit_hours, 24)),
    image_url: String(body?.image_url || "").trim() || null,
    status: body?.status === "secret" ? "secret" : "active",
    unlock_after_completed: toInt(body?.unlock_after_completed, 0),
    tags: Array.isArray(body?.tags) ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [],
    updated_at: new Date().toISOString(),
  };

  if (!patch.title || !patch.summary) {
    return NextResponse.json({ error: "Titulo e resumo sao obrigatorios." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("guild_missions")
    .update(patch)
    .eq("id", missionId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, mission: data });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  if (!canManageMissions(auth.profile.cargo)) {
    return NextResponse.json({ error: "Apenas lideranca pode deletar missoes." }, { status: 403 });
  }

  const { id } = await context.params;
  const missionId = Number(id);
  if (!Number.isFinite(missionId)) {
    return NextResponse.json({ error: "Missao invalida." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("guild_missions")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", missionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
