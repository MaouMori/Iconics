import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: Params) {
  const { id } = await context.params;
  const eventId = Number(id);

  if (!Number.isFinite(eventId) || eventId <= 0) {
    return NextResponse.json({ error: "ID de evento invalido." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("events")
    .select("id, titulo, descricao, data_evento, horario, local, imagem_url")
    .eq("id", eventId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Evento nao encontrado." }, { status: 404 });
  }

  return NextResponse.json({ event: data });
}

