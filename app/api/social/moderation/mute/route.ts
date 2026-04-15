import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canApproveLink } from "@/lib/memberLink";

export async function POST(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;

  if (!canApproveLink(profile.cargo)) {
    return NextResponse.json({ error: "Sem permissão para moderação." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const targetProfileId = String(body?.profileId || "").trim();
  const minutes = Number(body?.minutes || 60);
  const reason = String(body?.reason || "").trim();

  if (!targetProfileId) {
    return NextResponse.json({ error: "Perfil alvo inválido." }, { status: 400 });
  }

  const safeMinutes = Number.isFinite(minutes)
    ? Math.max(5, Math.min(60 * 24 * 7, Math.trunc(minutes)))
    : 60;

  const mutedUntil = new Date(Date.now() + safeMinutes * 60 * 1000).toISOString();

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ social_muted_until: mutedUntil })
    .eq("id", targetProfileId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from("site_notifications").insert({
    profile_id: targetProfileId,
    kind: "moderation",
    title: "Conta silenciada temporariamente",
    body:
      reason ||
      `Você foi silenciado por ${safeMinutes} minuto(s) para publicações, comentários e mensagens.`,
    payload: { muted_until: mutedUntil },
  });

  return NextResponse.json({ ok: true, mutedUntil });
}
