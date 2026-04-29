import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean).slice(0, 12);
}

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  const { id } = await context.params;
  const claimId = Number(id);
  if (!Number.isInteger(claimId) || claimId <= 0) {
    return NextResponse.json({ error: "Missao aceita invalida." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const proofText = String(body?.proof_text || "").trim().slice(0, 2500);
  const proofLinks = stringArray(body?.proof_links);
  const proofFiles = Array.isArray(body?.proof_files) ? body.proof_files.slice(0, 12) : [];

  if (!proofText && proofLinks.length === 0 && proofFiles.length === 0) {
    return NextResponse.json({ error: "Envie pelo menos uma prova da missao." }, { status: 400 });
  }

  const { data: claim, error: claimError } = await supabaseAdmin
    .from("guild_mission_claims")
    .select("id, mission_id, profile_id, status")
    .eq("id", claimId)
    .eq("profile_id", auth.userId)
    .maybeSingle();

  if (claimError || !claim) {
    return NextResponse.json({ error: "Missao aceita nao encontrada." }, { status: 404 });
  }

  if (claim.status !== "accepted") {
    return NextResponse.json({ error: "Somente missoes em andamento podem ser finalizadas." }, { status: 409 });
  }

  const { data: updated, error } = await supabaseAdmin
    .from("guild_mission_claims")
    .update({
      status: "submitted",
      proof_text: proofText || null,
      proof_links: proofLinks,
      proof_files: proofFiles,
      progress: 100,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("guild_mission_activity").insert({
    mission_id: claim.mission_id,
    profile_id: auth.userId,
    title: "Missao enviada para revisao",
    description: `${auth.profile.nome || "Membro"} finalizou uma missao e enviou comprovantes.`,
    influence_delta: 0,
  });

  return NextResponse.json({ ok: true, claim: updated });
}
