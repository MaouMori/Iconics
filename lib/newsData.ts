export type NewsItem = {
  id?: string;
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  summary: string[];
  author: string;
  location: string;
  time: string;
  image: string;
  imageAlt: string;
  caption: string;
  featured?: boolean;
  urgent?: boolean;
  published?: boolean;
  order?: number;
};

export const NEWS_SETTINGS_KEY = "news_items";

export function normalizeNewsSlug(value: string) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const DEFAULT_NEWS_ITEMS: NewsItem[] = [
  {
    slug: "iconics-abre-novo-ciclo",
    id: "iconics-abre-novo-ciclo",
    category: "Fraternidade",
    title: "ICONICS abre novo ciclo e anuncia fase de expansao da irmandade",
    subtitle: "Diretoria prepara novas missoes, registros publicos e uma rotina mais forte para membros ativos.",
    summary: [
      "A ICONICS iniciou uma nova fase de organizacao interna com foco em presenca, lore e participacao dos membros.",
      "Segundo a administracao, o objetivo e transformar acontecimentos da cidade em registros oficiais da fraternidade.",
      "As proximas semanas devem trazer novos eventos, atualizacoes no painel e publicacoes especiais na wiki.",
    ],
    author: "Redacao Iconics",
    location: "Arquivo da Fraternidade",
    time: "Atualizado ha 12 min",
    image: "/images/iconics_emblem_main.png",
    imageAlt: "Emblema roxo da Iconics",
    caption: "Emblema oficial usado nos comunicados da fraternidade.",
    featured: true,
    urgent: true,
    published: true,
    order: 0,
  },
  {
    slug: "membros-recebem-novas-missoes",
    id: "membros-recebem-novas-missoes",
    category: "Missoes",
    title: "Membros recebem novas missoes para fortalecer influencia na cidade",
    subtitle: "Sistema de tarefas passa a orientar a rotina de quem quer subir de nivel dentro da ICONICS.",
    summary: [
      "As missoes foram desenhadas para premiar presenca, criatividade e participacao em eventos.",
      "Membros podem acompanhar progresso, revisar entregas e disputar posicoes no ranking interno.",
    ],
    author: "Equipe de Missoes",
    location: "Painel Iconics",
    time: "Ha 1 hora",
    image: "/images/mission-guild-hall-bg.png",
    imageAlt: "Sala escura de guilda com luz roxa",
    caption: "Ambiente das missoes representa a base operacional da fraternidade.",
    published: true,
    order: 1,
  },
  {
    slug: "wiki-reune-lore-e-casos",
    id: "wiki-reune-lore-e-casos",
    category: "Wiki",
    title: "Wiki da ICONICS reune lore, personagens, casos e registros em formato de enciclopedia",
    subtitle: "Pagina publica agora funciona como arquivo vivo da historia da fraternidade.",
    summary: [
      "A wiki organiza paginas por categorias e permite publicar imagens, fichas, datas e relacionamentos.",
      "O formato foi inspirado em enciclopedias digitais, mas adaptado ao visual roxo e sombrio da ICONICS.",
    ],
    author: "Curadoria Iconics",
    location: "Biblioteca",
    time: "Ha 2 horas",
    image: "/images/lore.png",
    imageAlt: "Arte da lore da Iconics",
    caption: "Arquivo de lore guarda a memoria narrativa da fraternidade.",
    published: true,
    order: 2,
  },
  {
    slug: "mansao-vira-ponto-de-encontro",
    id: "mansao-vira-ponto-de-encontro",
    category: "Cidade",
    title: "Mansao vira ponto de encontro e ganha mapa interativo para visitantes",
    subtitle: "Pagina da mansao ajuda membros e convidados a localizar areas importantes da sede.",
    summary: [
      "O mapa da mansao foi criado para facilitar a circulacao e reforcar a ambientacao da fraternidade.",
      "A administracao afirma que a sede deve ser usada como ponto central de recepcao e reunioes.",
    ],
    author: "Redacao Iconics",
    location: "Mansao Iconics",
    time: "Ha 4 horas",
    image: "/images/mansao.png",
    imageAlt: "Imagem da mansao Iconics",
    caption: "Mansao aparece como uma das paginas centrais do site.",
    published: true,
    order: 3,
  },
  {
    slug: "parcerias-entram-no-ar",
    id: "parcerias-entram-no-ar",
    category: "Parcerias",
    title: "Parcerias entram no ar com vitrine publica e paginas individuais",
    subtitle: "Nova area destaca comunidades e marcas que caminham junto da fraternidade.",
    summary: [
      "A vitrine publica exibe logos, descricoes e links de parceiros cadastrados pelo painel administrativo.",
      "Quando ativadas, paginas individuais mostram detalhes, beneficios e canais oficiais.",
    ],
    author: "Comercial Iconics",
    location: "Rede de aliados",
    time: "Ha 6 horas",
    image: "/images/portal_scene_secondary.png",
    imageAlt: "Cena roxa de portal",
    caption: "Parcerias reforcam a rede publica da ICONICS.",
    published: true,
    order: 4,
  },
];

export function normalizeNewsItem(item: Partial<NewsItem>, index = 0): NewsItem {
  const title = String(item.title || `Nova noticia ${index + 1}`).trim();
  const slug = normalizeNewsSlug(item.slug || title) || `noticia-${index + 1}`;
  const summary = Array.isArray(item.summary)
    ? item.summary.map((line) => String(line || "").trim()).filter(Boolean)
    : String(item.summary || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  return {
    id: String(item.id || slug),
    slug,
    category: String(item.category || "Fraternidade").trim(),
    title,
    subtitle: String(item.subtitle || "Subtitulo da noticia.").trim(),
    summary: summary.length > 0 ? summary : ["Resumo da noticia."],
    author: String(item.author || "Redacao Iconics").trim(),
    location: String(item.location || "Arquivo da Fraternidade").trim(),
    time: String(item.time || "Agora").trim(),
    image: String(item.image || "/images/iconics_emblem_main.png").trim(),
    imageAlt: String(item.imageAlt || item.title || "Imagem da noticia").trim(),
    caption: String(item.caption || "").trim(),
    featured: Boolean(item.featured),
    urgent: Boolean(item.urgent),
    published: item.published !== false,
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : index,
  };
}

export function normalizeNewsItems(value: unknown) {
  const source = Array.isArray(value) && value.length > 0
    ? (value as Partial<NewsItem>[])
    : DEFAULT_NEWS_ITEMS;
  const seen = new Set<string>();

  return source
    .map((item, index) => {
      const normalized = normalizeNewsItem(item, index);
      let slug = normalized.slug;
      let suffix = 2;
      while (seen.has(slug)) {
        slug = `${normalized.slug}-${suffix}`;
        suffix += 1;
      }
      seen.add(slug);
      return { ...normalized, slug, id: normalized.id || slug };
    })
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0));
}

export function getPublishedNews(items: NewsItem[]) {
  return items.filter((item) => item.published !== false);
}

export function getNewsBySlug(items: NewsItem[], slug: string) {
  return items.find((item) => item.slug === slug && item.published !== false);
}
