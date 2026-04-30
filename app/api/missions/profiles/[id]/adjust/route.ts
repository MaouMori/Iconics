import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canManageMissions, getMissionLevel, getMissionXp } from "@/lib/missionRules";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  if (!canManageMissions(auth.profile.cargo)) {
    return NextResponse.json({ error: "Apenas lideranca pode ajustar perfis." }, { status: 403 });
  }

  const { id } = await context.params;
  const body = await req.json().catch(() => null);
  const xpDelta = Number(body?.xp_delta || 0);
  const setLevel = body?.level === "" || body?.level === undefined ? null : Number(body?.level);

  const { data: target, error: targetError } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, cargo, mission_xp, mission_level")
    .eq("id", id)
    .maybeSingle();

  if (targetError || !target) {
    return NextResponse.json({ error: "Perfil nao encontrado." }, { status: 404 });
  }

  const nextXp = Math.max(0, getMissionXp(target) + (Number.isFinite(xpDelta) ? Math.floor(xpDelta) : 0));
  const { data: levels } = await supabaseAdmin
    .from("guild_mission_levels")
    .select("level, required_xp")
    .order("level", { ascending: true });
  const levelByXp = (levels || []).reduce(
    (current, rule) => (nextXp >= Number(rule.required_xp || 0) ? Number(rule.level) : current),
    0
  );
  const nextLevel = Number.isFinite(setLevel as number)
    ? Math.max(0, Math.floor(setLevel as number))
    : Math.max(getMissionLevel(target), levelByXp);

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ mission_xp: nextXp, mission_level: nextLevel })
    .eq("id", id)
    .select("id, nome, cargo, avatar_url, mission_xp, mission_level")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("guild_mission_activity").insert({
    profile_id: id,
    title: "Perfil ajustado",
    description: `${auth.profile.nome || "Lideranca"} ajustou nivel/XP de ${target.nome || "um membro"}.`,
    influence_delta: Number.isFinite(xpDelta) ? Math.floor(xpDelta) : 0,
  });

  return NextResponse.json({ ok: true, profile: data });
}
