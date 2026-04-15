import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";

export async function GET(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;

  const withProfileId = String(req.nextUrl.searchParams.get("with") || "").trim();

  const { data: membersData } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, username, avatar_url, cargo")
    .neq("id", profile.id)
    .order("nome", { ascending: true })
    .limit(200);

  const members = (membersData || []).map((item) => ({
    id: String(item.id),
    nome: item.nome || "Membro",
    username: item.username || null,
    avatar_url: item.avatar_url || null,
    cargo: item.cargo || "membro",
  }));

  const { data: conversationRaw } = await supabaseAdmin
    .from("social_direct_messages")
    .select("id, sender_profile_id, recipient_profile_id, content, image_url, created_at, read_at")
    .or(`sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${profile.id}`)
    .order("created_at", { ascending: false })
    .limit(500);

  const profileCache = new Map(
    members.map((m) => [m.id, m] as const)
  );

  const convoMap = new Map<
    string,
    {
      with: (typeof members)[number];
      lastMessage: string;
      lastAt: string;
      unreadCount: number;
    }
  >();

  for (const row of conversationRaw || []) {
    const otherId =
      row.sender_profile_id === profile.id
        ? String(row.recipient_profile_id)
        : String(row.sender_profile_id);
    if (!otherId) continue;

    const cached = profileCache.get(otherId);
    if (!cached) continue;

    const current = convoMap.get(otherId);
    const isUnreadForMe =
      row.recipient_profile_id === profile.id && !row.read_at;

    if (!current) {
      convoMap.set(otherId, {
        with: cached,
        lastMessage: row.content || (row.image_url ? "[imagem]" : ""),
        lastAt: row.created_at,
        unreadCount: isUnreadForMe ? 1 : 0,
      });
      continue;
    }

    if (isUnreadForMe) current.unreadCount += 1;
  }

  const conversations = Array.from(convoMap.values()).sort(
    (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
  );

  if (!withProfileId) {
    return NextResponse.json({ members, conversations, messages: [] });
  }

  const { data: messageData } = await supabaseAdmin
    .from("social_direct_messages")
    .select("id, sender_profile_id, recipient_profile_id, content, image_url, created_at, read_at")
    .or(
      `and(sender_profile_id.eq.${profile.id},recipient_profile_id.eq.${withProfileId}),and(sender_profile_id.eq.${withProfileId},recipient_profile_id.eq.${profile.id})`
    )
    .order("created_at", { ascending: true })
    .limit(200);

  await supabaseAdmin
    .from("social_direct_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("sender_profile_id", withProfileId)
    .eq("recipient_profile_id", profile.id)
    .is("read_at", null);

  await supabaseAdmin
    .from("site_notifications")
    .update({ is_read: true })
    .eq("profile_id", profile.id)
    .eq("kind", "message")
    .eq("is_read", false);

  return NextResponse.json({
    members,
    conversations,
    messages: messageData || [],
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;
  const mutedUntil = profile.social_muted_until ? String(profile.social_muted_until) : "";
  if (mutedUntil && new Date(mutedUntil).getTime() > Date.now()) {
    return NextResponse.json(
      { error: "Sua conta está temporariamente silenciada para enviar mensagens." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const recipientId = String(body?.recipientId || "").trim();
  const content = String(body?.content || "").trim();
  const imageUrl = String(body?.imageUrl || "").trim();

  if (!recipientId) {
    return NextResponse.json({ error: "Destinatário inválido." }, { status: 400 });
  }

  if (recipientId === profile.id) {
    return NextResponse.json({ error: "Não é possível enviar para si mesmo." }, { status: 400 });
  }

  if (!content || content.length > 1200) {
    return NextResponse.json(
      { error: "Mensagem deve ter entre 1 e 1200 caracteres." },
      { status: 400 }
    );
  }

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("social_direct_messages")
    .insert({
      sender_profile_id: profile.id,
      recipient_profile_id: recipientId,
      content,
      image_url: imageUrl || null,
    })
    .select("id, sender_profile_id, recipient_profile_id, content, image_url, created_at, read_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabaseAdmin.from("site_notifications").insert({
    profile_id: recipientId,
    kind: "message",
    title: "Nova mensagem privada",
    body: `${profile.nome || "Membro"}: ${content.slice(0, 120)}`,
    payload: { from_profile_id: profile.id },
  });

  return NextResponse.json({ ok: true, message: inserted });
}
