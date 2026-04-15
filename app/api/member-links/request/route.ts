import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashAccessCode, normalizeAccessCode } from "@/lib/memberLink";

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const userId = userData.user?.id;
  if (userError || !userId) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const memberId = Number(body?.memberId);
  const accessCode = normalizeAccessCode(body?.accessCode);

  if (!Number.isInteger(memberId) || memberId <= 0) {
    return NextResponse.json({ error: "ID de membro invalido." }, { status: 400 });
  }

  if (!accessCode) {
    return NextResponse.json({ error: "Codigo de acesso obrigatorio." }, { status: 400 });
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from("member_cards")
    .select("id, access_code_hash")
    .eq("id", memberId)
    .maybeSingle();

  if (memberError || !member) {
    return NextResponse.json({ error: "Membro nao encontrado." }, { status: 404 });
  }

  const codeHash = hashAccessCode(memberId, accessCode);
  if (!member.access_code_hash || member.access_code_hash !== codeHash) {
    return NextResponse.json({ error: "Codigo de acesso invalido." }, { status: 403 });
  }

  const { data: pendingExisting } = await supabaseAdmin
    .from("member_card_link_requests")
    .select("id")
    .eq("member_card_id", memberId)
    .eq("requested_by_profile_id", userId)
    .eq("status", "pending")
    .maybeSingle();

  if (pendingExisting?.id) {
    return NextResponse.json({
      ok: true,
      requestId: pendingExisting.id,
      message: "Solicitacao pendente ja existente.",
    });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("nome")
    .eq("id", userId)
    .maybeSingle();

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("member_card_link_requests")
    .insert({
      member_card_id: memberId,
      access_code_hash: codeHash,
      requested_by_profile_id: userId,
      requested_by_name: profile?.nome || null,
      request_source: "site",
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    requestId: inserted.id,
    message: "Solicitacao enviada. Aguarde aprovacao da lideranca/staff.",
  });
}
