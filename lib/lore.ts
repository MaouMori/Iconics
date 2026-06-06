export type LorePageKind = "lore" | "caso" | "personagem" | "local" | "evento" | "outro";

export type LoreContentBlock = {
  id: string;
  type: "heading" | "text" | "image" | "media" | "quote" | "list";
  title?: string;
  body?: string;
  image_url?: string;
  caption?: string;
  align?: "full" | "left" | "right";
};

export type LoreCategory = {
  id: string;
  name: string;
  description?: string;
  order?: number;
};

export type LorePageItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  kind?: LorePageKind;
  summary: string;
  content: string;
  image_url?: string;
  date?: string;
  age?: string;
  relationships?: string;
  location?: string;
  status?: string;
  blocks?: LoreContentBlock[];
  tags?: string[];
  order?: number;
  published?: boolean;
  updated_at?: string;
};

export const LORE_SETTINGS_KEY = "lore_pages";
export const LORE_CATEGORIES_KEY = "lore_categories";

export const LORE_KIND_LABELS: Record<LorePageKind, string> = {
  lore: "Lore",
  caso: "Caso",
  personagem: "Personagem",
  local: "Local",
  evento: "Evento",
  outro: "Outro",
};

export function normalizeLoreSlug(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeLoreKind(value: unknown): LorePageKind {
  const kind = String(value || "lore").trim().toLowerCase() as LorePageKind;
  return Object.keys(LORE_KIND_LABELS).includes(kind) ? kind : "lore";
}

function normalizeBlockType(value: unknown): LoreContentBlock["type"] {
  const type = String(value || "text").trim().toLowerCase();
  if (["heading", "text", "image", "media", "quote", "list"].includes(type)) {
    return type as LoreContentBlock["type"];
  }
  return "text";
}

function createBlocksFromContent(content: string): LoreContentBlock[] {
  const blocks = String(content || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("## ")) {
      return {
        id: `legacy-heading-${index}`,
        type: "heading",
        title: block.replace(/^##\s+/, ""),
        body: "",
      };
    }

    if (block.startsWith(">")) {
      return {
        id: `legacy-quote-${index}`,
        type: "quote",
        body: block.replace(/^>\s?/, ""),
      };
    }

    if (block.startsWith("- ")) {
      return {
        id: `legacy-list-${index}`,
        type: "list",
        body: block.split("\n").map((line) => line.replace(/^-\s*/, "").trim()).filter(Boolean).join("\n"),
      };
    }

    return {
      id: `legacy-text-${index}`,
      type: "text",
      body: block,
    };
  });
}

export function normalizeLoreBlock(block: Partial<LoreContentBlock>, index = 0): LoreContentBlock {
  const type = normalizeBlockType(block.type);
  const align = ["full", "left", "right"].includes(String(block.align || ""))
    ? (block.align as LoreContentBlock["align"])
    : "full";

  return {
    id: String(block.id || `block-${Date.now()}-${index}`),
    type,
    title: String(block.title || "").trim(),
    body: String(block.body || "").trim(),
    image_url: String(block.image_url || "").trim(),
    caption: String(block.caption || "").trim(),
    align,
  };
}

export function normalizeLoreCategory(category: Partial<LoreCategory> | string, index = 0): LoreCategory {
  const rawName = typeof category === "string" ? category : category.name;
  const name = String(rawName || "Historia").trim() || "Historia";
  return {
    id: typeof category === "string"
      ? normalizeLoreSlug(name) || `categoria-${index + 1}`
      : String(category.id || normalizeLoreSlug(name) || `categoria-${index + 1}`),
    name,
    description: typeof category === "string" ? "" : String(category.description || "").trim(),
    order: typeof category === "string"
      ? index
      : Number.isFinite(Number(category.order))
      ? Number(category.order)
      : index,
  };
}

export function normalizeLorePage(page: Partial<LorePageItem>, index = 0): LorePageItem {
  const title = String(page.title || "Nova pagina").trim() || "Nova pagina";
  const slug = normalizeLoreSlug(page.slug || title) || `pagina-${index + 1}`;
  const content = String(page.content || "").trim();
  const rawBlocks = Array.isArray(page.blocks) ? page.blocks : createBlocksFromContent(content);
  const blocks = rawBlocks.map((block, blockIndex) => normalizeLoreBlock(block, blockIndex));

  return {
    id: String(page.id || slug || `lore-${index + 1}`),
    slug,
    title,
    category: String(page.category || "Historia").trim() || "Historia",
    kind: normalizeLoreKind(page.kind),
    summary: String(page.summary || "").trim(),
    content,
    image_url: String(page.image_url || "").trim(),
    date: String(page.date || "").trim(),
    age: String(page.age || "").trim(),
    relationships: String(page.relationships || "").trim(),
    location: String(page.location || "").trim(),
    status: String(page.status || "").trim(),
    blocks,
    tags: Array.isArray(page.tags)
      ? page.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    order: Number.isFinite(Number(page.order)) ? Number(page.order) : index,
    published: page.published !== false,
    updated_at: page.updated_at || new Date().toISOString(),
  };
}

export function deriveLoreCategories(pages: LorePageItem[], categories: LoreCategory[] = []) {
  const byName = new Map<string, LoreCategory>();

  categories.forEach((category, index) => {
    const normalized = normalizeLoreCategory(category, index);
    byName.set(normalized.name, normalized);
  });

  pages.forEach((page, index) => {
    const name = page.category || "Historia";
    if (!byName.has(name)) {
      byName.set(name, normalizeLoreCategory({ name, order: categories.length + index }, categories.length + index));
    }
  });

  return Array.from(byName.values()).sort((a, b) => {
    const order = Number(a.order || 0) - Number(b.order || 0);
    if (order !== 0) return order;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function sortLorePages(pages: LorePageItem[]) {
  return [...pages].sort((a, b) => {
    const order = Number(a.order || 0) - Number(b.order || 0);
    if (order !== 0) return order;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}
