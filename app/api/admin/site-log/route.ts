import { NextRequest, NextResponse } from "next/server";
import { getAuthedProfile } from "@/lib/apiAuth";
import { sendSiteLog } from "@/lib/discordSiteLogs";
import { hasAdminAccess } from "@/lib/roles";

export async function POST(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  if (!hasAdminAccess(auth.profile.cargo)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const title = String(body?.title || "Atualizacao no site").slice(0, 256);
  const description = String(body?.description || "Uma atualizacao foi feita pelo painel administrativo.").slice(0, 2000);

  const result = await sendSiteLog(title, description, [
    { name: "Responsavel", value: auth.profile.nome || auth.profile.email || auth.userId, inline: false },
  ]);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
