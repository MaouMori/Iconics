import { NextRequest, NextResponse } from "next/server";
import { buildRecruitmentSubmissionEmbed, sendDiscordEmbed, sendSiteLog } from "@/lib/discordSiteLogs";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type FieldDef = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
};

async function getRecruitmentFormSettings() {
  const { data: activeForm, error: activeError } = await supabaseAdmin
    .from("recruitment_form_settings")
    .select("*")
    .eq("ativo", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError || activeForm) {
    return { data: activeForm, error: activeError };
  }

  return supabaseAdmin
    .from("recruitment_form_settings")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const respostas = body?.respostas;

    if (!respostas || typeof respostas !== "object") {
      return NextResponse.json({ error: "Dados invalidos." }, { status: 400 });
    }

    const { data: formSettings, error: formError } = await getRecruitmentFormSettings();

    if (formError || !formSettings) {
      return NextResponse.json({ error: "Formulario nao encontrado." }, { status: 500 });
    }

    const fields = (formSettings.campos || []) as FieldDef[];

    for (const field of fields) {
      if (field.required) {
        const value = respostas[field.id];
        if (value === undefined || value === null || String(value).trim() === "") {
          return NextResponse.json(
            { error: `Campo obrigatorio nao preenchido: ${field.label}` },
            { status: 400 }
          );
        }
      }
    }

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("recruitment_submissions")
      .insert({
        respostas,
        status: "novo",
      })
      .select("id, respostas, status, created_at")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const discordResult = inserted
      ? await sendDiscordEmbed(buildRecruitmentSubmissionEmbed(inserted), {
        kind: "recruitment",
        username: "ICONICS Form",
      })
      : { ok: false, error: "Candidatura salva sem retorno do banco." };

    if (!discordResult.ok) {
      console.warn("[recruitment] candidatura salva, Discord nao enviado:", discordResult.error);
    } else if (inserted) {
      await sendSiteLog("Nova candidatura no site", `Candidatura #${inserted.id} foi recebida e enviada ao Discord.`);
    }

    return NextResponse.json({ ok: true, discordNotified: discordResult.ok });
  } catch {
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
