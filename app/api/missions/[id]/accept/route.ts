import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { getMissionLevel } from "@/lib/missionRules";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const missionId = Number(id);
  if (!Number.isInteger(missionId) || missionId <= 0) {
    return NextResponse.json({ error: "Missao invalida." }, { status: 400 });
  }

  const { profile, userId } = auth;
  const { data: mission, error: missionError } = await supabaseAdmin
    .from("guild_missions")
    .select("*")
    .eq("id", missionId)
    .maybeSingle();

  if (missionError || !mission) {
    return NextResponse.json({ error: "Missao nao encontrada." }, { status: 404 });
  }

  const level = getMissionLevel(profile);
  const requiredLevel = Number(mission.required_level || 1);
  if (level < requiredLevel) {
    return NextResponse.json(
      { error: `Nivel ${requiredLevel} necessario para aceitar esta missao.` },
      { status: 403 }
    );
  }

  const { count: completedCount } = await supabaseAdmin
    .from("guild_mission_claims")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", userId)
    .eq("status", "completed");

  const unlockAfter = Number(mission.unlock_after_completed || 0);
  if (mission.status === "secret" && (completedCount || 0) < unlockAfter) {
    return NextResponse.json(
      { error: `${unlockAfter} missoes completas sao necessarias para desbloquear.` },
      { status: 403 }
    );
  }

  const { data: existing } = await supabaseAdmin
    .from("guild_mission_claims")
    .select("id, status")
    .eq("mission_id", missionId)
    .eq("profile_id", userId)
    .in("status", ["accepted", "submitted"])
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Voce ja aceitou esta missao." }, { status: 409 });
  }

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + Number(mission.time_limit_hours || 24) * 60 * 60 * 1000
  ).toISOString();

  const { data: claim, error: claimError } = await supabaseAdmin
    .from("guild_mission_claims")
    .insert({
      mission_id: missionId,
      profile_id: userId,
      status: "accepted",
      progress: 0,
      accepted_at: now.toISOString(),
      expires_at: expiresAt,
    })
    .select("id, mission_id, status, progress, accepted_at, expires_at")
    .single();

  if (claimError) {
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  await supabaseAdmin.from("guild_mission_activity").insert({
    mission_id: missionId,
    profile_id: userId,
    title: "Missao aceita",
    description: `${profile.nome || "Membro"} aceitou ${mission.title}.`,
    influence_delta: 0,
  });

  return NextResponse.json({ ok: true, claim });
}
