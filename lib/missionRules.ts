import { normalizeRole } from "@/lib/roles";

export type MissionLevelProfile = {
  cargo?: string | null;
  influence?: number | null;
  mission_influence?: number | null;
};

export function getBaseLevelFromRole(role: unknown) {
  const normalized = normalizeRole(role);
  const map: Record<string, number> = {
    calouro: 1,
    elite: 4,
    veterano: 8,
    conselheiro: 10,
    vice_lider: 12,
    lider: 15,
    staff: 12,
    admin: 15,
  };

  return map[normalized] || 1;
}

export function getMissionInfluence(profile: MissionLevelProfile | null | undefined) {
  const direct = Number(profile?.mission_influence ?? profile?.influence ?? 0);
  if (!Number.isFinite(direct) || direct < 0) return 0;
  return Math.floor(direct);
}

export function getMissionLevel(profile: MissionLevelProfile | null | undefined) {
  const roleLevel = getBaseLevelFromRole(profile?.cargo);
  const influenceLevel = Math.floor(getMissionInfluence(profile) / 500) + 1;
  return Math.max(roleLevel, influenceLevel);
}

export function getNextLevelInfluence(level: number) {
  return Math.max(1, level) * 500;
}

export function getMissionRankLabel(level: number) {
  if (level >= 12) return "Iconics Elite";
  if (level >= 8) return "Veterano";
  if (level >= 4) return "Ascendente";
  return "Iniciado";
}
