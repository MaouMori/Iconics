export type NewsContentBlock = {
  id: string;
  type: "text" | "heading" | "titled_text" | "image" | "media" | "callout";
  title?: string;
  body?: string;
  image?: string;
  imageAlt?: string;
  caption?: string;
  align?: "left" | "right";
};

export type NewsItem = {
  id?: string;
  slug: string;
  category: string;
  title: string;
  subtitle: string;
  summary: string[];
  contentBlocks?: NewsContentBlock[];
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
    contentBlocks: [
      {
        id: "bloco-ciclo-1",
        type: "text",
        body: "A nova fase da ICONICS nasce com uma proposta simples: transformar rotina em registro e presenca em legado. A diretoria afirma que a irmandade passa a organizar comunicados, missoes e acontecimentos em um fluxo mais constante, aproximando membros antigos e novos integrantes.",
      },
      {
        id: "bloco-ciclo-2",
        type: "media",
        title: "Arquivo vivo",
        body: "O painel administrativo ganha papel central nessa mudanca. Noticias, lore, paginas publicas e registros de atividade passam a ser tratados como parte de um arquivo vivo, onde cada atualizacao ajuda a contar a historia da fraternidade.",
        image: "/images/lore.png",
        imageAlt: "Arquivo roxo da lore da Iconics",
        caption: "A wiki e o portal de noticias passam a caminhar juntos.",
        align: "right",
      },
      {
        id: "bloco-ciclo-3",
        type: "callout",
        body: "Mais do que crescer, a ICONICS quer deixar marcas reconheciveis em cada canto da cidade.",
      },
      {
        id: "bloco-ciclo-4",
        type: "titled_text",
        title: "Proximos passos",
        body: "Entre as proximas entregas estao novas publicacoes editoriais, melhorias no ranking, paginas especiais de parceiros e eventos com registro publico. A meta e fazer com que cada membro encontre um caminho claro para participar.",
      },
      {
        id: "bloco-ciclo-5",
        type: "image",
        image: "/images/portal_scene_main.png",
        imageAlt: "Portal roxo da Iconics",
        caption: "A expansao tambem reforca a identidade visual sombria da fraternidade.",
      },
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
    contentBlocks: [
      {
        id: "missoes-1",
        type: "text",
        body: "O novo sistema de missoes foi implementado com o objetivo de incentivar os membros a participarem ativamente da fraternidade, completarem desafios e conquistarem recompensas exclusivas.",
      },
      {
        id: "missoes-2",
        type: "media",
        title: "Como funciona",
        body: "As missoes sao organizadas por niveis e categorias, permitindo que cada membro escolha onde deseja focar seus esforcos. O progresso pode ser acompanhado diretamente no painel, com atualizacoes em tempo real e recompensas desbloqueaveis.",
        image: "/images/mission-parchment-large.png",
        imageAlt: "Pergaminho de missoes da Iconics",
        caption: "Cada missao representa uma etapa dentro da jornada interna.",
        align: "right",
      },
      {
        id: "missoes-3",
        type: "callout",
        body: "Esse e mais que um sistema. E sobre proposito, presenca e legado.",
      },
      {
        id: "missoes-4",
        type: "image",
        image: "/images/mission-guild-hall-bg.png",
        imageAlt: "Sala de missoes iluminada em roxo",
        caption: "A sala de missoes simboliza a organizacao dos membros ativos.",
      },
      {
        id: "missoes-5",
        type: "titled_text",
        title: "Recompensas",
        body: "Ao concluir missoes, os membros acumulam pontos que podem ser trocados por beneficios unicos, cargos especiais, acesso a areas exclusivas, itens raros e destaque no ranking interno.",
      },
    ],
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
    contentBlocks: [
      {
        id: "wiki-1",
        type: "text",
        body: "A Wiki ICONICS foi criada para funcionar como uma enciclopedia interna e publica. Nela, personagens, casos, lugares, datas e relacoes podem ser organizados em paginas com ficha, imagens e secoes narrativas.",
      },
      {
        id: "wiki-2",
        type: "media",
        title: "Categorias e casos",
        body: "A estrutura permite separar lore, investigacoes, eventos, membros importantes e registros de cidade. Cada pagina pode ganhar imagem de destaque, campos personalizados e blocos de texto com visual editorial.",
        image: "/images/iconics_emblem_main.png",
        imageAlt: "Emblema da Iconics",
        caption: "O emblema marca paginas oficiais do arquivo.",
        align: "left",
      },
      {
        id: "wiki-3",
        type: "callout",
        body: "Toda memoria precisa de um lugar para existir. A wiki e esse lugar.",
      },
      {
        id: "wiki-4",
        type: "image",
        image: "/images/valores.png",
        imageAlt: "Valores da Iconics",
        caption: "Valores e simbolos tambem podem virar registros permanentes.",
      },
    ],
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
    contentBlocks: [
      {
        id: "mansao-1",
        type: "text",
        body: "A mansao foi organizada como ponto central para receber membros, visitantes e aliados. O novo mapa ajuda a localizar entradas, areas de encontro e pontos importantes da sede.",
      },
      {
        id: "mansao-2",
        type: "media",
        title: "Mapa interativo",
        body: "A pagina da mansao permite consultar locais internos sem depender de explicacoes soltas. A ideia e facilitar eventos, reunioes e recepcao de novos convidados.",
        image: "/images/mapa-cidade-fivem.png",
        imageAlt: "Mapa da cidade",
        caption: "O mapa serve como guia para quem chega pela primeira vez.",
        align: "right",
      },
      {
        id: "mansao-3",
        type: "callout",
        body: "Toda fraternidade precisa de um centro. A mansao e o ponto onde a presenca se torna encontro.",
      },
      {
        id: "mansao-4",
        type: "image",
        image: "/images/mansao.png",
        imageAlt: "Mansao da Iconics",
        caption: "A sede representa o lado publico da irmandade.",
      },
    ],
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
    contentBlocks: [
      {
        id: "parcerias-1",
        type: "text",
        body: "A area de parcerias foi criada para dar visibilidade a comunidades, marcas e aliados que caminham junto da ICONICS. Cada parceiro pode ter pagina propria, imagem, descricao e links oficiais.",
      },
      {
        id: "parcerias-2",
        type: "media",
        title: "Vitrine publica",
        body: "A vitrine permite que visitantes conhecam rapidamente quem faz parte da rede. Para a administracao, o recurso tambem ajuda a manter acordos organizados e sempre acessiveis.",
        image: "/images/portal_scene_main.png",
        imageAlt: "Portal roxo da rede de aliados",
        caption: "A rede de aliados ganha espaco fixo no site.",
        align: "left",
      },
      {
        id: "parcerias-3",
        type: "titled_text",
        title: "Paginas individuais",
        body: "Quando uma parceria e publicada, ela pode receber conteudo proprio, beneficios, descricao detalhada e canais de contato. Isso transforma a pagina em um cartao publico permanente.",
      },
      {
        id: "parcerias-4",
        type: "callout",
        body: "Parceria boa nao fica escondida. Ela vira parte da historia publica da fraternidade.",
      },
    ],
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
  const rawBlocks = Array.isArray(item.contentBlocks) ? item.contentBlocks : [];
  const contentBlocks: NewsContentBlock[] = rawBlocks
    .map((block, blockIndex) => {
      const validTypes: NewsContentBlock["type"][] = ["text", "heading", "titled_text", "image", "media", "callout"];
      const type = validTypes.includes(block?.type as NewsContentBlock["type"])
        ? (block?.type as NewsContentBlock["type"])
        : "text";
      const align: NewsContentBlock["align"] = block?.align === "right" ? "right" : "left";
      return {
        id: String(block?.id || `block-${index}-${blockIndex}`),
        type,
        title: String(block?.title || "").trim(),
        body: String(block?.body || "").trim(),
        image: String(block?.image || "").trim(),
        imageAlt: String(block?.imageAlt || "").trim(),
        caption: String(block?.caption || "").trim(),
        align,
      };
    })
    .filter((block) => {
      if (block.type === "heading") return Boolean(block.title);
      if (block.type === "image") return Boolean(block.image);
      if (block.type === "media") return Boolean(block.image || block.body || block.title);
      return Boolean(block.body || block.title);
    });
  const defaultNews = DEFAULT_NEWS_ITEMS.find((defaultItem) => defaultItem.slug === slug);
  const defaultBlocks = defaultNews?.contentBlocks || [];
  const normalizedContentBlocks = rawBlocks.length === 0 && defaultBlocks.length > 0
    ? defaultBlocks
    : contentBlocks;

  return {
    id: String(item.id || slug),
    slug,
    category: String(item.category || "Fraternidade").trim(),
    title,
    subtitle: String(item.subtitle || "Subtitulo da noticia.").trim(),
    summary: summary.length > 0 ? summary : ["Resumo da noticia."],
    contentBlocks: normalizedContentBlocks.length > 0
      ? normalizedContentBlocks
      : (summary.length > 0 ? summary : ["Resumo da noticia."]).map((line, blockIndex) => ({
        id: `summary-${index}-${blockIndex}`,
        type: "text",
        body: line,
      })),
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
