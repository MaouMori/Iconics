import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET() {
  const { data: activeForm, error: activeError } = await supabaseAdmin
    .from("recruitment_form_settings")
    .select("*")
    .eq("ativo", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (activeError) {
    return NextResponse.json({ error: activeError.message }, { status: 500 });
  }

  if (activeForm) {
    return NextResponse.json(activeForm);
  }

  const { data: latestForm, error: latestError } = await supabaseAdmin
    .from("recruitment_form_settings")
    .select("*")
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    return NextResponse.json({ error: latestError.message }, { status: 500 });
  }

  if (!latestForm) {
    return NextResponse.json({ error: "Formulario nao encontrado." }, { status: 404 });
  }

  return NextResponse.json(latestForm);
}
