import { createHash } from "crypto";

const EDITOR_ROLES = new Set(["admin", "lider", "vice_lider", "staff"]);

export function normalizeAccessCode(input: unknown) {
  return String(input || "").trim().toUpperCase();
}

export function hashAccessCode(memberId: number, rawCode: unknown) {
  const normalized = normalizeAccessCode(rawCode);
  const secret = process.env.MEMBER_LINK_CODE_SECRET || "iconics-member-link";
  return createHash("sha256")
    .update(`${secret}:${memberId}:${normalized}`)
    .digest("hex");
}

export function canApproveLink(cargo: unknown) {
  const normalized = String(cargo || "").trim().toLowerCase();
  return EDITOR_ROLES.has(normalized);
}

export const ALLOWED_MEMBER_UPDATE_FIELDS = new Set([
  "nome",
  "idade",
  "cargo",
  "meta",
  "personalidade",
  "habitos",
  "gostos",
  "hobbies",
  "tags",
  "stats",
  "sigil",
  "imagem_url",
  "accent_color",
  "galeria",
]);
