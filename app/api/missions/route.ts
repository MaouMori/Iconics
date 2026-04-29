import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getAuthedProfile } from "@/lib/apiAuth";
import {
  getMissionInfluence,
  getMissionLevel,
  getMissionRankLabel,
  getNextLevelInfluence,
} from "@/lib/missionRules";

const fallbackMissions = [
  {
    id: 1,
    slug: "viralizacao",
    title: "Viralizacao",
    summary: "Poste 1 conteudo no Instagram com a hashtag #ICONICS.",
    details: "Publique um conteudo com presenca visual e registre o link como prova para a staff.",
    category: "social",
    difficulty: "media",
    required_level: 1,
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
    reward_influence: 400,
    time_limit_hours: 96,
    image_url: "/images/rankings-space-bg.jpg",
    status: "secret",
    unlock_after_completed: 3,
    tags: ["secreta"],
  },
];

export async function GET(req: NextRequest) {
  const auth = await getAuthedProfile(req);
  if ("error" in auth) return auth.error;

  const { profile, userId } = auth;
  const level = getMissionLevel(profile);
  const influence = getMissionInfluence(profile);
  const nextInfluence = getNextLevelInfluence(level);

  let usingFallback = false;
  const { data: missionsData, error: missionsError } = await supabaseAdmin
    .from("guild_missions")
    .select("*")
    .in("status", ["active", "secret"])
    .order("required_level", { ascending: true })
    .order("id", { ascending: true });

  let missions = missionsData || [];
  if (missionsError) {
    usingFallback = true;
    missions = fallbackMissions;
  }

  const { data: claimsData } = await supabaseAdmin
    .from("guild_mission_claims")
    .select("id, mission_id, status, progress, accepted_at, expires_at, completed_at")
    .eq("profile_id", userId)
    .order("accepted_at", { ascending: false });

  const claims = claimsData || [];
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

  const decoratedMissions = missions.map((mission) => {
    const requiredLevel = Number(mission.required_level || 1);
    const unlockAfter = Number(mission.unlock_after_completed || 0);
    const lockedByLevel = level < requiredLevel;
    const lockedBySecret = mission.status === "secret" && completedCount < unlockAfter;
    const claim = claims.find((item) => Number(item.mission_id) === Number(mission.id));

    return {
      ...mission,
      claim: claim || null,
      isAccepted: activeMissionIds.has(Number(mission.id)),
      isCompleted: claim?.status === "completed",
      isLocked: lockedByLevel || lockedBySecret,
      lockedReason: lockedByLevel
        ? `Nivel ${requiredLevel} necessario`
        : lockedBySecret
        ? `${unlockAfter} missoes completas para desbloquear`
        : "",
    };
  });

  return NextResponse.json({
    profile: {
      id: profile.id,
      nome: profile.nome,
      cargo: profile.cargo,
      avatar_url: profile.avatar_url,
      level,
      influence,
      nextInfluence,
      rankLabel: getMissionRankLabel(level),
    },
    missions: decoratedMissions,
    claims,
    activity: activityData || [],
    usingFallback,
  });
}
