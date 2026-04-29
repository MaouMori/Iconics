import { normalizeRole } from "@/lib/roles";

export type MissionLevelProfile = {
  cargo?: string | null;
  mission_xp?: number | null;
  mission_level?: number | null;
  influence?: number | null;
  mission_influence?: number | null;
};

export const MISSION_MANAGER_ROLES = new Set(["admin", "staff", "lider", "vice_lider", "conselheiro"]);

export function canManageMissions(role: unknown) {
  const normalized = normalizeRole(role);
  return MISSION_MANAGER_ROLES.has(normalized);
}

export function getMissionXp(profile: MissionLevelProfile | null | undefined) {
  const direct = Number(profile?.mission_xp ?? profile?.mission_influence ?? profile?.influence ?? 0);
  if (!Number.isFinite(direct) || direct < 0) return 0;
  return Math.floor(direct);
}

export function getMissionLevel(profile: MissionLevelProfile | null | undefined) {
  const manualLevel = Number(profile?.mission_level);
  if (Number.isFinite(manualLevel) && manualLevel >= 0) return Math.floor(manualLevel);
  return Math.floor(getMissionXp(profile) / 500);
}

export function getNextLevelInfluence(level: number) {
  return (Math.max(0, level) + 1) * 500;
}

export function getMissionRankLabel(level: number) {
  if (level >= 12) return "Iconics Elite";
  if (level >= 8) return "Veterano";
  if (level >= 4) return "Ascendente";
  if (level >= 1) return "Iniciado";
  return "Recem-chegado";
}
