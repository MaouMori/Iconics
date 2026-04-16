export const ADMIN_ROLES = new Set([
  "admin",
  "staff",
  "lider",
  "vice_lider",
  "conselheiro",
]);

export const MEMBER_CARD_ROLES = [
  "calouro",
  "elite",
  "veterano",
  "vice_lider",
  "conselheiro",
  "lider",
] as const;

export function normalizeRole(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function hasAdminAccess(role: unknown) {
  return ADMIN_ROLES.has(normalizeRole(role));
}

export function getRoleLabel(role: unknown) {
  const normalized = normalizeRole(role);
  const map: Record<string, string> = {
    lider: "Lider",
    vice_lider: "Vice-lider",
    conselheiro: "Conselheiro",
    veterano: "Veterano",
    elite: "Elite",
    calouro: "Calouro",
    admin: "Admin",
    staff: "Staff",
  };
  return map[normalized] || (normalized || "Calouro");
}

