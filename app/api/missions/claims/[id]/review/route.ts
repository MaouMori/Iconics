import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canManageMissions, getMissionLevel, getMissionXp } from "@/lib/missionRules";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  if (!canManageMissions(auth.profile.cargo)) {
    return NextResponse.json({ error: "Apenas lideranca pode revisar missoes." }, { status: 403 });
  }

  const { id } = await context.params;
  const claimId = Number(id);
  const body = await req.json().catch(() => null);
  const action = body?.action === "reject" ? "reject" : "approve";
  const note = String(body?.note || "").trim().slice(0, 600) || null;

  const { data: claim, error: claimError } = await supabaseAdmin
    .from("guild_mission_claims")
    .select("id, mission_id, profile_id, status")
    .eq("id", claimId)
    .maybeSingle();

  if (claimError || !claim) {
    return NextResponse.json({ error: "Envio nao encontrado." }, { status: 404 });
  }

  if (claim.status !== "submitted") {
    return NextResponse.json({ error: "Somente envios pendentes podem ser revisados." }, { status: 409 });
  }

  const { data: mission } = await supabaseAdmin
    .from("guild_missions")
    .select("id, title, reward_influence")
    .eq("id", claim.mission_id)
    .maybeSingle();

  if (action === "reject") {
    const { data, error } = await supabaseAdmin
      .from("guild_mission_claims")
      .update({
        status: "rejected",
        review_note: note,
        reviewed_by: auth.userId,
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, claim: data });
  }

  const reward = Number(mission?.reward_influence || 0);
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, cargo, mission_xp, mission_level")
    .eq("id", claim.profile_id)
    .maybeSingle();

  const nextXp = getMissionXp(targetProfile) + reward;
  const nextLevel = Math.max(getMissionLevel(targetProfile), Math.floor(nextXp / 500));

  const { data, error } = await supabaseAdmin
    .from("guild_mission_claims")
    .update({
      status: "completed",
      review_note: note,
      reviewed_by: auth.userId,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin
    .from("profiles")
    .update({ mission_xp: nextXp, mission_level: nextLevel })
    .eq("id", claim.profile_id);

  await supabaseAdmin.from("guild_mission_activity").insert({
    mission_id: claim.mission_id,
    profile_id: claim.profile_id,
    title: "Missao aprovada",
    description: `${targetProfile?.nome || "Membro"} recebeu ${reward} XP por ${mission?.title || "uma missao"}.`,
    influence_delta: reward,
  });

  return NextResponse.json({ ok: true, claim: data, xp: nextXp, level: nextLevel });
}
