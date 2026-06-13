import { NextRequest, NextResponse } from "next/server";
import { getAuthedProfile } from "@/lib/apiAuth";
import { buildRecruitmentSubmissionEmbed, sendDiscordEmbed, sendSiteLog } from "@/lib/discordSiteLogs";
import { hasAdminAccess } from "@/lib/roles";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type FieldDef = {
  id: string;
  label: string;
};

async function getRecruitmentFormFields() {
  const { data } = await supabaseAdmin
    .from("recruitment_form_settings")
    .select("campos")
    .eq("ativo", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  return Array.isArray(data?.campos) ? (data.campos as FieldDef[]) : [];
}

export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  if (!hasAdminAccess(auth.profile.cargo)) {
    return NextResponse.json({ error: "Sem permissao." }, { status: 403 });
  }

  const { id } = await context.params;
  const submissionId = Number(id);
  if (!Number.isFinite(submissionId)) {
    return NextResponse.json({ error: "ID invalido." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("recruitment_submissions")
    .select("id, respostas, status, created_at")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Candidatura nao encontrada." }, { status: 404 });
  }

  const fields = await getRecruitmentFormFields();
  const result = await sendDiscordEmbed(
    buildRecruitmentSubmissionEmbed(data, fields),
    { kind: "recruitment", username: "ICONICS Form" }
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  await sendSiteLog("Candidatura reenviada ao Discord", `Candidatura #${submissionId} foi enviada manualmente pelo painel.`, [
    { name: "Responsavel", value: auth.profile.nome || auth.profile.email || auth.userId, inline: false },
  ]);

  return NextResponse.json({ ok: true });
}
