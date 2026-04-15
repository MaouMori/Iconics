import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { canApproveLink } from "@/lib/memberLink";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const approverId = userData.user?.id;
  if (userError || !approverId) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("cargo")
    .eq("id", approverId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!canApproveLink(profile?.cargo)) {
    return NextResponse.json(
      { error: "Apenas lider, vice_lider, admin ou staff podem aprovar." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const requestId = Number(body?.requestId);
  const action = String(body?.action || "").toLowerCase();
  const reason = String(body?.reason || "").trim() || null;

  if (!Number.isInteger(requestId) || requestId <= 0) {
    return NextResponse.json({ error: "requestId invalido." }, { status: 400 });
  }

  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action deve ser approve ou reject." }, { status: 400 });
  }

  const { data: linkRequest, error: requestError } = await supabaseAdmin
    .from("member_card_link_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError || !linkRequest) {
    return NextResponse.json({ error: "Solicitacao nao encontrada." }, { status: 404 });
  }

  if (linkRequest.status !== "pending") {
    return NextResponse.json({ error: "Solicitacao ja foi processada." }, { status: 409 });
  }

  if (action === "reject") {
    const { error: rejectError } = await supabaseAdmin
      .from("member_card_link_requests")
      .update({
        status: "rejected",
        rejected_reason: reason,
        approved_at: new Date().toISOString(),
        approved_by_profile_id: approverId,
      })
      .eq("id", requestId);

    if (rejectError) {
      return NextResponse.json({ error: rejectError.message }, { status: 500 });
    }

    if (linkRequest.requested_by_profile_id) {
      await supabaseAdmin.from("site_notifications").insert({
        profile_id: linkRequest.requested_by_profile_id,
        kind: "member_link_rejected",
        title: "Solicitacao de vinculo rejeitada",
        body: reason || "Sua solicitacao de vinculo foi rejeitada pela lideranca.",
        payload: { request_id: requestId, member_card_id: linkRequest.member_card_id },
      });
    }

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  const now = new Date().toISOString();
  let requestedByProfileId: string | null = linkRequest.requested_by_profile_id || null;
  let requestedByDiscordId: number | null = linkRequest.requested_by_discord_id || null;

  if (!requestedByProfileId && requestedByDiscordId) {
    const { data: profileByDiscord } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("discord_user_id", requestedByDiscordId)
      .maybeSingle();
    requestedByProfileId = profileByDiscord?.id || null;
  }

  if (requestedByProfileId && !requestedByDiscordId) {
    const { data: profileById } = await supabaseAdmin
      .from("profiles")
      .select("discord_user_id")
      .eq("id", requestedByProfileId)
      .maybeSingle();
    requestedByDiscordId = profileById?.discord_user_id || null;
  }

  if (!requestedByProfileId && !requestedByDiscordId) {
    return NextResponse.json(
      {
        error:
          "Nao foi possivel identificar conta do site ou Discord dessa solicitacao. Peca novo vinculo apos usar !vincularsite.",
      },
      { status: 400 }
    );
  }

  await supabaseAdmin
    .from("member_card_link_requests")
    .update({
      requested_by_profile_id: requestedByProfileId,
      requested_by_discord_id: requestedByDiscordId,
    })
    .eq("id", requestId);

  if (requestedByProfileId) {
    await supabaseAdmin
      .from("member_card_links")
      .update({ status: "revoked", updated_at: now })
      .eq("profile_id", requestedByProfileId)
      .eq("status", "active");
  }

  if (requestedByDiscordId) {
    await supabaseAdmin
      .from("member_card_links")
      .update({ status: "revoked", updated_at: now })
      .eq("discord_user_id", requestedByDiscordId)
      .eq("status", "active");
  }

  await supabaseAdmin
    .from("member_card_links")
    .update({ status: "revoked", updated_at: now })
    .eq("member_card_id", linkRequest.member_card_id)
    .eq("status", "active");

  const { error: insertLinkError } = await supabaseAdmin
    .from("member_card_links")
    .insert({
      member_card_id: linkRequest.member_card_id,
      profile_id: requestedByProfileId,
      discord_user_id: requestedByDiscordId,
      status: "active",
      can_edit: true,
      approved_by_profile_id: approverId,
      created_from_request_id: requestId,
      created_at: now,
      updated_at: now,
    });

  if (insertLinkError) {
    return NextResponse.json({ error: insertLinkError.message }, { status: 500 });
  }

  if (requestedByProfileId && requestedByDiscordId) {
    await supabaseAdmin
      .from("profiles")
      .update({ discord_user_id: null })
      .eq("discord_user_id", requestedByDiscordId)
      .neq("id", requestedByProfileId);

    await supabaseAdmin
      .from("profiles")
      .update({ discord_user_id: requestedByDiscordId })
      .eq("id", requestedByProfileId);
  }

  const { error: approveError } = await supabaseAdmin
    .from("member_card_link_requests")
    .update({
      status: "approved",
      approved_at: now,
      approved_by_profile_id: approverId,
      rejected_reason: null,
    })
    .eq("id", requestId);

  if (approveError) {
    return NextResponse.json({ error: approveError.message }, { status: 500 });
  }

  if (requestedByProfileId) {
    await supabaseAdmin.from("site_notifications").insert({
      profile_id: requestedByProfileId,
      kind: "member_link_approved",
      title: "Solicitacao de vinculo aprovada",
      body: `Seu vinculo para o card #${linkRequest.member_card_id} foi aprovado.`,
      payload: { request_id: requestId, member_card_id: linkRequest.member_card_id },
    });
  }

  return NextResponse.json({ ok: true, status: "approved" });
}
