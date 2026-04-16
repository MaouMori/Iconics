import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const DEFAULT_LOCATION = { x: 0.685, y: 0.442 };
const SETTINGS_KEY = "mansion_location";
const ALLOWED_MARK_ROLES = new Set(["admin", "staff", "lider", "vice_lider", "conselheiro"]);

function sanitizePoint(raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as { x?: unknown; y?: unknown };
  const x = Number(value.x);
  const y = Number(value.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x, y };
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("key", SETTINGS_KEY)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(DEFAULT_LOCATION);
  }

  const point = sanitizePoint(data.value);
  return NextResponse.json(point ?? DEFAULT_LOCATION);
}

export async function POST(req: NextRequest) {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  const userId = userData.user?.id;
  if (userError || !userId) {
    return NextResponse.json({ error: "Sessao invalida." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("cargo")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const cargo = String(profile?.cargo || "").trim().toLowerCase();
  if (!ALLOWED_MARK_ROLES.has(cargo)) {
    return NextResponse.json({ error: "Apenas lideranca pode alterar a localizacao." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const point = sanitizePoint(body);
  if (!point) {
    return NextResponse.json({ error: "Coordenadas invalidas." }, { status: 400 });
  }

  const { error: saveError } = await supabaseAdmin
    .from("site_settings")
    .upsert(
      { key: SETTINGS_KEY, value: point, updated_at: new Date().toISOString() },
      { onConflict: "key" }
    );

  if (saveError) {
    return NextResponse.json({ error: saveError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, ...point });
}


