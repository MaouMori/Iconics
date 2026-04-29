import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import {
  canManageMissions,
  getMissionLevel,
  getMissionRankLabel,
  getMissionXp,
  getNextLevelInfluence,
} from "@/lib/missionRules";

const fallbackMissions = [
  {
    id: 1,
    slug: "viralizacao",
    title: "Viralizacao",
    summary: "Poste 1 conteudo no Instagram com a hashtag #ICONICS.",
    details: "Publique um conteudo e envie link, imagem ou texto como prova para a lideranca.",
    category: "social",
    difficulty: "media",
    required_level: 1,
    visible_level: 0,
    reward_influence: 150,
    time_limit_hours: 24,
    image_url: "/images/portal_scene_main.png",
    status: "active",
    unlock_after_completed: 0,
    tags: ["conteudo", "social"],
  },
  {
    id: 2,
    slug: "enigma-de-nyx",
    title: "Enigma de Nyx",
    summary: "Um simbolo foi ocultado na mansao. Encontre e decifre.",
    details: "Observe pistas em eventos, lore e imagens do site. A resposta precisa ser validada pela staff.",
    category: "misterio",
    difficulty: "alta",
    required_level: 4,
    visible_level: 0,
    reward_influence: 200,
    time_limit_hours: 48,
    image_url: "/images/olho.png",
    status: "active",
    unlock_after_completed: 0,
    tags: ["enigma", "misterio"],
  },
  {
    id: 3,
    slug: "recrutamento",
    title: "Recrutamento",
    summary: "Convide 1 novo membro qualificado para a ICONICS.",
    details: "Ajude a pessoa a entrar, concluir o registro e se apresentar corretamente a staff.",
    category: "social",
    difficulty: "facil",
    required_level: 2,
    visible_level: 0,
    reward_influence: 100,
    time_limit_hours: 72,
    image_url: "/images/mansao.png",
    status: "active",
    unlock_after_completed: 0,
    tags: ["social", "recrutamento"],
  },
  {
    id: 4,
    slug: "missao-secreta",
    title: "Missao Secreta",
    summary: "Desbloqueie para ver.",
    details: "Complete 3 missoes para acessar este contrato reservado.",
    category: "secreta",
    difficulty: "secreta",
    required_level: 8,
    visible_level: 6,
    reward_influence: 400,
    time_limit_hours: 96,
    image_url: "/images/rankings-space-bg.jpg",
    status: "secret",
    unlock_after_completed: 3,
    tags: ["secreta"],
  },
];

type MissionRow = {
  id: number;
  status?: string | null;
  required_level?: number | null;
  visible_level?: number | null;
  unlock_after_completed?: number | null;
  [key: string]: unknown;
};

type ClaimRow = {
  id: number;
  mission_id: number;
  status: string;
  [key: string]: unknown;
};

type ProfileRow = {
  id: string;
  nome?: string | null;
  cargo?: string | null;
  avatar_url?: string | null;
  mission_xp?: number | null;
  mission_level?: number | null;
  influence?: number | null;
  mission_influence?: number | null;
};

function toInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : fallback;
}

function buildProfile(profile: ProfileRow) {
  const level = getMissionLevel(profile);
  const xp = getMissionXp(profile);
  return {
    id: profile.id,
    nome: profile.nome,
    cargo: profile.cargo,
    avatar_url: profile.avatar_url,
    level,
    xp,
    influence: xp,
    nextInfluence: getNextLevelInfluence(level),
    rankLabel: getMissionRankLabel(level),
    canManage: canManageMissions(profile.cargo),
  };
}

export async function GET(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  const { profile, userId } = auth;
  const profileInfo = buildProfile(profile);
  let usingFallback = false;

  const { data: missionsData, error: missionsError } = await supabaseAdmin
    .from("guild_missions")
    .select("*")
    .in("status", ["active", "secret"])
    .order("visible_level", { ascending: true })
    .order("required_level", { ascending: true })
    .order("id", { ascending: true });

  let missions = (missionsData || []) as MissionRow[];
  if (missionsError) {
    usingFallback = true;
    missions = fallbackMissions;
  }

  const { data: claimsData } = await supabaseAdmin
    .from("guild_mission_claims")
    .select("id, mission_id, profile_id, status, progress, proof_text, proof_links, proof_files, review_note, accepted_at, expires_at, submitted_at, completed_at, rejected_at")
    .eq("profile_id", userId)
    .order("accepted_at", { ascending: false });

  const claims = (claimsData || []) as ClaimRow[];
  const completedCount = claims.filter((claim) => claim.status === "completed").length;
  const activeMissionIds = new Set(
    claims
      .filter((claim) => claim.status === "accepted" || claim.status === "submitted")
      .map((claim) => Number(claim.mission_id))
  );

  const { data: activityData } = await supabaseAdmin
    .from("guild_mission_activity")
    .select("id, title, description, influence_delta, created_at")
    .or(`profile_id.eq.${userId},profile_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(8);

  const { data: profilesData } = await supabaseAdmin
    .from("profiles")
    .select("id, nome, cargo, avatar_url, mission_xp, mission_level")
    .order("mission_level", { ascending: false })
    .order("mission_xp", { ascending: false })
    .limit(50);

  const ranking = ((profilesData || []) as ProfileRow[])
    .map((item) => buildProfile(item))
    .sort((a, b) => b.level - a.level || b.xp - a.xp || String(a.nome || "").localeCompare(String(b.nome || "")));

  const { data: adminClaimsData } = profileInfo.canManage
    ? await supabaseAdmin
        .from("guild_mission_claims")
        .select("id, mission_id, profile_id, status, progress, proof_text, proof_links, proof_files, review_note, accepted_at, submitted_at, completed_at, rejected_at")
        .in("status", ["accepted", "submitted", "completed", "rejected"])
        .order("accepted_at", { ascending: false })
        .limit(80)
    : { data: [] };

  const decoratedMissions = missions
    .filter((mission) => profileInfo.level >= toInt(mission.visible_level, 0) || profileInfo.canManage)
    .map((mission) => {
      const requiredLevel = toInt(mission.required_level, 0);
      const visibleLevel = toInt(mission.visible_level, 0);
      const unlockAfter = toInt(mission.unlock_after_completed, 0);
      const lockedByLevel = profileInfo.level < requiredLevel;
      const lockedBySecret = mission.status === "secret" && completedCount < unlockAfter;
      const claim = claims.find((item) => Number(item.mission_id) === Number(mission.id));

      return {
        ...mission,
        visible_level: visibleLevel,
        claim: claim || null,
        isAccepted: activeMissionIds.has(Number(mission.id)),
        isCompleted: claim?.status === "completed",
        isSubmitted: claim?.status === "submitted",
        isLocked: lockedByLevel || lockedBySecret,
        lockedReason: lockedByLevel
          ? `Nivel ${requiredLevel} necessario`
          : lockedBySecret
          ? `${unlockAfter} missoes completas para desbloquear`
          : "",
      };
    });

  return NextResponse.json({
    profile: profileInfo,
    missions: decoratedMissions,
    claims,
    adminClaims: adminClaimsData || [],
    ranking,
    activity: activityData || [],
    usingFallback,
  });
}

export async function POST(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;
  if (!canManageMissions(auth.profile.cargo)) {
    return NextResponse.json({ error: "Apenas lideranca pode criar missoes." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const title = String(body?.title || "").trim();
  const summary = String(body?.summary || "").trim();
  if (!title || !summary) {
    return NextResponse.json({ error: "Titulo e resumo sao obrigatorios." }, { status: 400 });
  }

  const slug = (String(body?.slug || title)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60)) || `missao-${Date.now()}`;

  const payload = {
    slug,
    title: title.slice(0, 120),
    summary: summary.slice(0, 240),
    details: String(body?.details || "").trim().slice(0, 1200) || null,
    category: String(body?.category || "geral").trim().slice(0, 40),
    difficulty: String(body?.difficulty || "media").trim().slice(0, 40),
    required_level: toInt(body?.required_level, 0),
    visible_level: toInt(body?.visible_level, 0),
    reward_influence: toInt(body?.reward_influence, 50),
    time_limit_hours: Math.max(1, toInt(body?.time_limit_hours, 24)),
    image_url: String(body?.image_url || "").trim() || null,
    status: body?.status === "secret" ? "secret" : "active",
    unlock_after_completed: toInt(body?.unlock_after_completed, 0),
    tags: Array.isArray(body?.tags) ? body.tags.map((tag: unknown) => String(tag).trim()).filter(Boolean) : [],
  };

  const { data, error } = await supabaseAdmin.from("guild_missions").insert(payload).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabaseAdmin.from("guild_mission_activity").insert({
    mission_id: data.id,
    profile_id: auth.userId,
    title: "Missao criada",
    description: `${auth.profile.nome || "Lideranca"} criou ${data.title}.`,
    influence_delta: 0,
  });

  return NextResponse.json({ ok: true, mission: data });
}
