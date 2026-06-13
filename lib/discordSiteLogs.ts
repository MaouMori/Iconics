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

export function buildRecruitmentSubmissionEmbed(submission: {
  id: number | string;
  respostas?: Record<string, unknown> | null;
  created_at?: string | null;
}) {
  const respostas = submission.respostas && typeof submission.respostas === "object"
    ? submission.respostas
    : {};

  const fields = Object.entries(respostas).slice(0, 20).map(([key, value]) => ({
    name: key.replace(/_/g, " ").trim().slice(0, 256) || "Campo",
    value: cleanDiscordValue(value),
    inline: false,
  }));

  if (Object.keys(respostas).length > 20) {
    fields.push({
      name: "Campos adicionais",
      value: `${Object.keys(respostas).length - 20} campo(s) nao exibido(s).`,
      inline: false,
    });
  }

  return {
    title: "Nova candidatura recebida",
    description: `Formulario enviado pelo site. ID #${submission.id}`,
    color: 11141375,
    fields,
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
  return sendDiscordEmbed(
    {
      title,
      description,
      color: 5793266,
      fields,
      footer: { text: "Log do site Iconics" },
      timestamp: new Date().toISOString(),
    },
    { kind: "site", username: "ICONICS Logs" }
  );
}
