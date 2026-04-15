import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canApproveLink } from "@/lib/memberLink";

export async function GET(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  const { profile } = auth;
  const onlySummary = req.nextUrl.searchParams.get("summary") === "1";

  const { data: notifData, error: notifError } = await supabaseAdmin
    .from("site_notifications")
    .select("id, kind, title, body, payload, is_read, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(40);

  if (notifError) {
    return NextResponse.json({ error: notifError.message }, { status: 500 });
  }

  const notifications = notifData || [];
  const unreadCount = notifications.filter((item) => !item.is_read).length;

  let adminPendingCount = 0;
  if (canApproveLink(profile.cargo)) {
    const { data: pendingData } = await supabaseAdmin
      .from("member_card_link_requests")
      .select("id")
      .eq("status", "pending");
    adminPendingCount = (pendingData || []).length;
  }

  if (onlySummary) {
    return NextResponse.json({ unreadCount, adminPendingCount });
  }

  return NextResponse.json({
    unreadCount,
    adminPendingCount,
    notifications,
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  const { profile } = auth;

  const body = await req.json().catch(() => null);
  const id = Number(body?.id || 0);

  if (id > 0) {
    const { error } = await supabaseAdmin
      .from("site_notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("profile_id", profile.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabaseAdmin
      .from("site_notifications")
      .update({ is_read: true })
      .eq("profile_id", profile.id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
