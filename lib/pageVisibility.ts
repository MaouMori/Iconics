export type ManagedSitePage = {
  key: string;
  label: string;
  path: string;
  description: string;
  match: "exact" | "prefix";
};

export type PageVisibilityMap = Record<string, boolean>;

export const PAGE_VISIBILITY_SETTINGS_KEY = "page_visibility";

export const MANAGED_SITE_PAGES: ManagedSitePage[] = [
  { key: "home", label: "Home", path: "/", description: "Pagina inicial publica.", match: "exact" },
  { key: "noticias", label: "Noticias", path: "/noticias", description: "Portal publico de noticias da Iconics.", match: "prefix" },
  { key: "recrutamento", label: "Formulario", path: "/recrutamento", description: "Formulario publico de recrutamento.", match: "exact" },
  { key: "lore", label: "Wiki / Lore", path: "/lore", description: "Wiki publica da Iconics.", match: "prefix" },
  { key: "mansao", label: "Mansao", path: "/mansao", description: "Mapa e pagina da mansao.", match: "exact" },
  { key: "parcerias", label: "Parcerias", path: "/parcerias", description: "Lista publica de parceiros.", match: "prefix" },
  { key: "parceria", label: "Detalhes de parceria", path: "/parceria", description: "Paginas individuais de parceria.", match: "prefix" },
  { key: "rankings", label: "Rankings", path: "/rankings", description: "Rankings das fraternidades.", match: "exact" },
  { key: "calendario", label: "Calendario", path: "/calendario", description: "Eventos e calendario publico.", match: "exact" },
  { key: "eventos", label: "Eventos", path: "/evento", description: "Paginas individuais de eventos.", match: "prefix" },
  { key: "membros", label: "Membros", path: "/membro", description: "Wiki/perfil publico de membros.", match: "prefix" },
  { key: "painel", label: "Painel", path: "/painel", description: "Area interna do membro.", match: "prefix" },
  { key: "missoes", label: "Missoes", path: "/missoes", description: "Sistema de missoes.", match: "prefix" },
  { key: "rede", label: "Rede", path: "/rede", description: "Rede social e mensagens.", match: "prefix" },
];

export function normalizePageVisibility(value: unknown): PageVisibilityMap {
  const raw = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

  return MANAGED_SITE_PAGES.reduce<PageVisibilityMap>((acc, page) => {
    acc[page.key] = raw[page.key] !== false;
    return acc;
  }, {});
}

export function isManagedPathDisabled(pathname: string, visibility: PageVisibilityMap) {
  const page = MANAGED_SITE_PAGES.find((item) => {
    if (item.match === "exact") return pathname === item.path;
    return pathname === item.path || pathname.startsWith(`${item.path}/`);
  });

  if (!page) return false;
  return visibility[page.key] === false;
}
