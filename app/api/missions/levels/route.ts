import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import { canManageMissions } from "@/lib/missionRules";

type LevelInput = {
  level: number;
  required_xp: number;
  label: string | null;
};

export async function PUT(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  if (!canManageMissions(auth.profile.cargo)) {
    return NextResponse.json({ error: "Apenas lideranca pode editar niveis." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const levels = Array.isArray(body?.levels) ? body.levels : [];
  const rows: LevelInput[] = levels
    .map((item: { level?: unknown; required_xp?: unknown; label?: unknown }) => ({
      level: Number(item.level),
      required_xp: Number(item.required_xp),
      label: String(item.label || "").trim() || null,
    }))
    .filter((item: LevelInput) => Number.isInteger(item.level) && item.level >= 0 && Number.isFinite(item.required_xp) && item.required_xp >= 0)
    .sort((a: LevelInput, b: LevelInput) => a.level - b.level);

  if (!rows.length || rows[0].level !== 0 || rows[0].required_xp !== 0) {
    return NextResponse.json({ error: "O nivel 0 precisa existir com XP 0." }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("guild_mission_levels").upsert(rows, { onConflict: "level" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, levels: rows });
}
