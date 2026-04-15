import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ALLOWED_MEMBER_UPDATE_FIELDS } from "@/lib/memberLink";

async function getAuthedProfileId(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return { error: NextResponse.json({ error: "Não autenticado." }, { status: 401 }) };
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const userId = userData.user?.id;

  if (userError || !userId) {
    return { error: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }) };
  }

  return { userId };
}

function sanitizeUpdatePayload(raw: Record<string, unknown>) {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!ALLOWED_MEMBER_UPDATE_FIELDS.has(key)) continue;

    if (key === "idade") {
      if (value === null || value === "") {
        payload.idade = null;
      } else {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 0 || parsed > 120) {
          continue;
        }
        payload.idade = parsed;
      }
      continue;
    }

    if (key === "galeria") {
      const source = Array.isArray(value) ? value : [];
      payload.galeria = source
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 16);
      continue;
    }

    if (typeof value === "string") {
      payload[key] = value.trim();
    } else if (value === null) {
      payload[key] = null;
    }
  }

  return payload;
}

export async function GET(req: NextRequest) {
  const auth = await getAuthedProfileId(req);
  if ("error" in auth) return auth.error;

  const { userId } = auth;

  const { data: activeLink } = await supabaseAdmin
    .from("member_card_links")
    .select("id, member_card_id, can_edit, status, created_at")
    .eq("profile_id", userId)
    .eq("status", "active")
    .maybeSingle();

  const { data: pendingRequests } = await supabaseAdmin
    .from("member_card_link_requests")
    .select("id, member_card_id, status, requested_at")
    .eq("requested_by_profile_id", userId)
    .eq("status", "pending")
    .order("requested_at", { ascending: false });

  if (!activeLink?.member_card_id) {
    return NextResponse.json({
      linked: false,
      pendingRequests: pendingRequests || [],
    });
  }

  const { data: memberCard, error: memberError } = await supabaseAdmin
    .from("member_cards")
    .select("*")
    .eq("id", activeLink.member_card_id)
    .maybeSingle();

  if (memberError || !memberCard) {
    return NextResponse.json({
      linked: false,
      pendingRequests: pendingRequests || [],
      warning: "Link ativo encontrado, mas card não foi localizado.",
    });
  }

  return NextResponse.json({
    linked: true,
    link: activeLink,
    card: memberCard,
    pendingRequests: pendingRequests || [],
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedProfileId(req);
  if ("error" in auth) return auth.error;

  const { userId } = auth;
  const body = await req.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const { data: activeLink, error: linkError } = await supabaseAdmin
    .from("member_card_links")
    .select("member_card_id, can_edit, status")
    .eq("profile_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (linkError || !activeLink?.member_card_id) {
    return NextResponse.json({ error: "Nenhum vínculo ativo encontrado." }, { status: 403 });
  }

  if (!activeLink.can_edit) {
    return NextResponse.json({ error: "Seu vínculo não possui permissão de edição." }, { status: 403 });
  }

  const updatePayload = sanitizeUpdatePayload(body as Record<string, unknown>);
  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "Nenhum campo válido para atualizar." }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabaseAdmin
    .from("member_cards")
    .update(updatePayload)
    .eq("id", activeLink.member_card_id)
    .select("*")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, card: updated });
}

export async function DELETE(req: NextRequest) {
  const auth = await getAuthedProfileId(req);
  if ("error" in auth) return auth.error;

  const { userId } = auth;
  const now = new Date().toISOString();

  const { data: activeLinks, error: fetchError } = await supabaseAdmin
    .from("member_card_links")
    .select("id")
    .eq("profile_id", userId)
    .eq("status", "active");

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!activeLinks || activeLinks.length === 0) {
    return NextResponse.json({ error: "Nenhum vínculo ativo encontrado." }, { status: 404 });
  }

  const linkIds = activeLinks.map((item) => item.id).filter(Boolean);
  const { error: revokeError } = await supabaseAdmin
    .from("member_card_links")
    .update({ status: "revoked", can_edit: false, updated_at: now })
    .in("id", linkIds);

  if (revokeError) {
    return NextResponse.json({ error: revokeError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, revoked: linkIds.length });
}
