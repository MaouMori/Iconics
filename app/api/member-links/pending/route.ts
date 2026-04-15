import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { canApproveLink } from "@/lib/memberLink";

type PendingRow = {
  id: number;
  member_card_id: number;
  requested_by_profile_id: string | null;
  requested_by_discord_id: number | null;
  requested_by_name: string | null;
  request_source: string;
  status: string;
  requested_at: string;
};

export async function GET(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const userId = userData.user?.id;
  if (userError || !userId) {
    return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("cargo")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!canApproveLink(profile?.cargo)) {
    return NextResponse.json({ error: "Sem permissão para visualizar pendências." }, { status: 403 });
  }

  const { data: requests, error: requestError } = await supabaseAdmin
    .from("member_card_link_requests")
    .select(
      "id, member_card_id, requested_by_profile_id, requested_by_discord_id, requested_by_name, request_source, status, requested_at"
    )
    .eq("status", "pending")
    .order("requested_at", { ascending: false })
    .limit(100);

  if (requestError) {
    return NextResponse.json({ error: requestError.message }, { status: 500 });
  }

  const pending = (requests || []) as PendingRow[];
  const memberIds = Array.from(new Set(pending.map((item) => item.member_card_id).filter(Boolean)));
  const profileIds = Array.from(
    new Set(pending.map((item) => item.requested_by_profile_id).filter((x): x is string => Boolean(x)))
  );

  const memberMap = new Map<number, string>();
  const profileMap = new Map<string, string>();

  if (memberIds.length > 0) {
    const { data: members } = await supabaseAdmin
      .from("member_cards")
      .select("id, nome")
      .in("id", memberIds);

    (members || []).forEach((row) => {
      memberMap.set(Number(row.id), String(row.nome || `Membro #${row.id}`));
    });
  }

  if (profileIds.length > 0) {
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, nome")
      .in("id", profileIds);

    (profiles || []).forEach((row) => {
      profileMap.set(String(row.id), String(row.nome || "Sem nome"));
    });
  }

  const enriched = pending.map((item) => ({
    ...item,
    member_name: memberMap.get(item.member_card_id) || `Membro #${item.member_card_id}`,
    requester_profile_name: item.requested_by_profile_id
      ? profileMap.get(item.requested_by_profile_id) || item.requested_by_name || "Sem nome"
      : item.requested_by_name || null,
  }));

  return NextResponse.json({ requests: enriched });
}
