import { supabaseAdmin } from "@/lib/supabaseAdmin";

type DiscordEmbedField = {
  name: string;
  value: string;
  inline?: boolean;
};

type DiscordEmbed = {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  footer?: { text: string };
  timestamp?: string;
};

type RecruitmentFieldDef = {
  id: string;
  label: string;
};

function getWebhookUrl(kind: "recruitment" | "site" = "site") {
  if (kind === "recruitment") {
    return (
      process.env.DISCORD_RECRUITMENT_WEBHOOK_URL ||
      process.env.DISCORD_SITE_LOG_WEBHOOK_URL ||
      process.env.DISCORD_WEBHOOK_URL ||
      ""
    );
  }

  return process.env.DISCORD_SITE_LOG_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL || "";
}

function cleanDiscordValue(value: unknown, fallback = "-") {
  if (value === undefined || value === null) return fallback;
  if (Array.isArray(value)) {
    const text = value.map((item) => String(item || "").trim()).filter(Boolean).join(", ");
    return text || fallback;
  }
  if (typeof value === "object") {
    return JSON.stringify(value).slice(0, 1000);
  }
  return String(value).trim().slice(0, 1000) || fallback;
}

function buildRecruitmentLines(
  respostas: Record<string, unknown>,
  fields: RecruitmentFieldDef[] = []
) {
  const used = new Set<string>();
  const lines: string[] = [];

  for (const field of fields) {
    if (!field?.id || !(field.id in respostas)) continue;
    used.add(field.id);
    lines.push(`**${field.label || field.id}:** ${cleanDiscordValue(respostas[field.id])}`);
  }

  for (const [key, value] of Object.entries(respostas)) {
    if (used.has(key)) continue;
    const label = key.replace(/_/g, " ").trim() || "Campo";
    lines.push(`**${label}:** ${cleanDiscordValue(value)}`);
  }

  return lines;
}

export function buildRecruitmentSubmissionEmbed(submission: {
  id: number | string;
  respostas?: Record<string, unknown> | null;
  created_at?: string | null;
}, fields: RecruitmentFieldDef[] = []) {
  const respostas = submission.respostas && typeof submission.respostas === "object"
    ? submission.respostas
    : {};
  const lines = buildRecruitmentLines(respostas, fields);
  const description = lines.length > 0
    ? lines.join("\n").slice(0, 4000)
    : `Formulario enviado pelo site. ID #${submission.id}`;

  return {
    title: "Nova candidatura recebida",
    description,
    color: 11141375,
    footer: { text: "Sistema de recrutamento Iconics" },
    timestamp: submission.created_at || new Date().toISOString(),
  };
}

export async function sendDiscordEmbed(
  embed: DiscordEmbed,
  options: { kind?: "recruitment" | "site"; username?: string } = {}
) {
  const webhook = getWebhookUrl(options.kind || "site");
  if (!webhook) {
    return { ok: false, error: "Webhook do Discord nao configurado." };
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: options.username || "ICONICS Site",
        embeds: [embed],
      }),
    });

    if (!response.ok) {
      return { ok: false, error: `Discord respondeu ${response.status}.` };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Falha ao enviar webhook.",
    };
  }

  return { ok: true };
}

export async function sendSiteLog(title: string, description: string, fields: DiscordEmbedField[] = []) {
  const fieldText = fields.length > 0
    ? `\n\n${fields.map((field) => `**${field.name}:** ${field.value}`).join("\n")}`
    : "";

  const { error } = await supabaseAdmin
    .from("discord_logs")
    .insert({
      guild_id: "site",
      channel_id: process.env.DISCORD_SITE_LOG_CHANNEL_ID || "1446473299260608536",
      event_title: title.slice(0, 200),
      event_description: `${description}${fieldText}`.slice(0, 4000),
      level: "info",
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.warn("[site-log] nao foi possivel registrar log:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
