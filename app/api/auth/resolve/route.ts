import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
}

export async function GET(req: NextRequest) {
  const identifier = normalizeIdentifier(req.nextUrl.searchParams.get("identifier") || "");
  if (!identifier) {
    return NextResponse.json({ error: "Informe email ou usuario." }, { status: 400 });
  }

  if (identifier.includes("@")) {
    return NextResponse.json({ email: identifier });
  }

  const clean = identifier.replace(/^@/, "");

  const { data: byUsuario } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("usuario", clean)
    .maybeSingle();

  if (byUsuario?.email) {
    return NextResponse.json({ email: String(byUsuario.email).toLowerCase() });
  }

  const { data: byUsername } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("username", clean)
    .maybeSingle();

  if (byUsername?.email) {
    return NextResponse.json({ email: String(byUsername.email).toLowerCase() });
  }

  return NextResponse.json({ error: "Usuario nao encontrado." }, { status: 404 });
}

