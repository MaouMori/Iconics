import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type FieldDef = {
  id: string;
  label: string;
  type: string;
  required?: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const respostas = body?.respostas;

    if (!respostas || typeof respostas !== "object") {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { data: formSettings, error: formError } = await supabaseAdmin
      .from("recruitment_form_settings")
      .select("*")
      .eq("ativo", true)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (formError || !formSettings) {
      return NextResponse.json({ error: "Formulário não encontrado." }, { status: 500 });
    }

    const fields = (formSettings.campos || []) as FieldDef[];

    for (const field of fields) {
      if (field.required) {
        const value = respostas[field.id];
        if (value === undefined || value === null || String(value).trim() === "") {
          return NextResponse.json(
            { error: `Campo obrigatório não preenchido: ${field.label}` },
            { status: 400 }
          );
        }
      }
    }

    const { error: insertError } = await supabaseAdmin
      .from("recruitment_submissions")
      .insert({
        respostas,
        status: "novo",
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const webhook = process.env.DISCORD_WEBHOOK_URL;

    if (webhook) {
      const lines = fields.map((field) => {
        const value = respostas[field.id] ?? "—";
        return `**${field.label}:** ${String(value)}`;
      });

      await fetch(webhook, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "ICONICS Form",
          embeds: [
            {
              title: "Nova candidatura recebida",
              description: lines.join("\n"),
              color: 11141375,
              footer: {
                text: "Sistema de recrutamento Iconics",
              },
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}