import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("recruitment_form_settings")
    .select("*")
    .eq("ativo", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}