export type LorePageItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  image_url?: string;
  tags?: string[];
  order?: number;
  published?: boolean;
  updated_at?: string;
};

export const LORE_SETTINGS_KEY = "lore_pages";

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

export function normalizeLorePage(page: Partial<LorePageItem>, index = 0): LorePageItem {
  const title = String(page.title || "Nova pagina").trim() || "Nova pagina";
  const slug = normalizeLoreSlug(page.slug || title) || `pagina-${index + 1}`;

  return {
    id: String(page.id || slug || `lore-${index + 1}`),
    slug,
    title,
    category: String(page.category || "Historia").trim() || "Historia",
    summary: String(page.summary || "").trim(),
    content: String(page.content || "").trim(),
    image_url: String(page.image_url || "").trim(),
    tags: Array.isArray(page.tags)
      ? page.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    order: Number.isFinite(Number(page.order)) ? Number(page.order) : index,
    published: page.published !== false,
    updated_at: page.updated_at || new Date().toISOString(),
  };
}

export function sortLorePages(pages: LorePageItem[]) {
  return [...pages].sort((a, b) => {
    const order = Number(a.order || 0) - Number(b.order || 0);
    if (order !== 0) return order;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}
