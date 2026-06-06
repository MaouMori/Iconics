"use client";

import AdminShell from "@/components/AdminShell";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import {
  LORE_KIND_LABELS,
  LoreCategory,
  LoreContentBlock,
  LorePageItem,
  LorePageKind,
  normalizeLoreSlug,
} from "@/lib/lore";
import { hasAdminAccess, normalizeRole } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

const blockLabels: Record<LoreContentBlock["type"], string> = {
  heading: "Titulo",
  text: "Texto",
  image: "Imagem",
  media: "Imagem + texto",
  quote: "Citacao",
  list: "Lista",
};

function createBlock(type: LoreContentBlock["type"]): LoreContentBlock {
  return {
    id: `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    title: type === "heading" ? "Nova secao" : "",
    body: type === "text" || type === "media" ? "Escreva um novo trecho da wiki." : "",
    image_url: "",
    caption: "",
    align: "full",
  };
}

function createLorePage(existing: LorePageItem[], category = "Historia"): LorePageItem {
  const next = existing.length + 1;
  return {
    id: `lore-${Date.now()}`,
    slug: `nova-pagina-${next}`,
    title: "Nova pagina da wiki",
    category,
    kind: "lore",
    summary: "Resumo curto para aparecer na wiki.",
    content: "",
    image_url: "",
    date: "",
    age: "",
    relationships: "",
    location: "",
    status: "",
    blocks: [
      { ...createBlock("heading"), title: "Contexto" },
      { ...createBlock("text"), body: "Conte a historia, caso ou registro aqui." },
    ],
    tags: ["Iconics"],
    order: existing.length,
    published: true,
  };
}

function createCategory(existing: LoreCategory[]): LoreCategory {
  const next = existing.length + 1;
  return {
    id: `categoria-${Date.now()}`,
    name: `Nova categoria ${next}`,
    description: "Descricao curta da categoria.",
    order: existing.length,
  };
}

function renderPreviewBlock(block: LoreContentBlock) {
  if (block.type === "heading") return <h3 key={block.id}>{block.title || "Secao sem titulo"}</h3>;
  if (block.type === "quote") return <blockquote key={block.id}>{block.body || "Citacao sem texto."}</blockquote>;
  if (block.type === "list") {
    const items = String(block.body || "").split("\n").map((item) => item.trim()).filter(Boolean);
    return <ul key={block.id}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
  }
  if (block.type === "image") {
    return (
      <figure key={block.id} className={`wiki-preview-image ${block.align || "full"}`}>
        {block.image_url ? <img src={block.image_url} alt={block.caption || "Imagem da wiki"} /> : <div>Imagem</div>}
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }
  if (block.type === "media") {
    return (
      <section key={block.id} className={`wiki-preview-media ${block.align === "right" ? "right" : "left"}`}>
        <figure>
          {block.image_url ? <img src={block.image_url} alt={block.caption || block.title || "Imagem da wiki"} /> : <div>Imagem</div>}
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
        <div>
          {block.title ? <h3>{block.title}</h3> : null}
          <p>{block.body || "Texto vazio."}</p>
        </div>
      </section>
    );
  }
  return <p key={block.id}>{block.body || "Texto vazio."}</p>;
}

export default function AdminLorePage() {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [token, setToken] = useState("");
  const [pages, setPages] = useState<LorePageItem[]>([]);
  const [categories, setCategories] = useState<LoreCategory[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const selected = pages[selectedIndex] || null;
  const categoryNames = useMemo(() => categories.map((category) => category.name), [categories]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      setToken(accessToken);

      const { data: profile } = await supabase
        .from("profiles")
        .select("cargo")
        .eq("id", userData.user.id)
        .single();

      if (!hasAdminAccess(normalizeRole(profile?.cargo))) {
        setLoading(false);
        return;
      }

      setPermitido(true);

      const response = await fetch("/api/admin/lore", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      const loadedPages = Array.isArray(payload.pages) ? payload.pages : [];
      const loadedCategories = Array.isArray(payload.categories) ? payload.categories : [];
      const fallbackCategories = loadedCategories.length > 0
        ? loadedCategories
        : [{ id: "historia", name: "Historia", description: "Lore principal da fraternidade.", order: 0 }];

      setCategories(fallbackCategories);
      setPages(loadedPages.length > 0 ? loadedPages : [createLorePage([], fallbackCategories[0].name)]);
      setLoading(false);
    }

    load();
  }, []);

  function updatePage(index: number, patch: Partial<LorePageItem>) {
    setPages((current) =>
      current.map((page, pageIndex) => {
        if (pageIndex !== index) return page;
        const next = { ...page, ...patch };
        if (patch.title !== undefined && (!page.slug || page.slug.startsWith("nova-pagina"))) {
          next.slug = normalizeLoreSlug(patch.title) || page.slug;
        }
        return next;
      })
    );
  }

  function updateBlock(blockIndex: number, patch: Partial<LoreContentBlock>) {
    if (!selected) return;
    const blocks = [...(selected.blocks || [])];
    blocks[blockIndex] = { ...blocks[blockIndex], ...patch };
    updatePage(selectedIndex, { blocks });
  }

  function addBlock(type: LoreContentBlock["type"]) {
    if (!selected) return;
    updatePage(selectedIndex, { blocks: [...(selected.blocks || []), createBlock(type)] });
  }

  function removeBlock(blockIndex: number) {
    if (!selected) return;
    updatePage(selectedIndex, { blocks: (selected.blocks || []).filter((_, index) => index !== blockIndex) });
  }

  function moveBlock(blockIndex: number, direction: -1 | 1) {
    if (!selected) return;
    const target = blockIndex + direction;
    const blocks = [...(selected.blocks || [])];
    if (target < 0 || target >= blocks.length) return;
    const [item] = blocks.splice(blockIndex, 1);
    blocks.splice(target, 0, item);
    updatePage(selectedIndex, { blocks });
  }

  function addPage() {
    const category = categories[0]?.name || "Historia";
    setPages((current) => {
      const next = [...current, createLorePage(current, category)];
      setSelectedIndex(next.length - 1);
      return next;
    });
  }

  function duplicatePage(index: number) {
    setPages((current) => {
      const original = current[index];
      if (!original) return current;
      const copy = {
        ...original,
        id: `lore-${Date.now()}`,
        title: `${original.title} (copia)`,
        slug: `${original.slug}-copia`,
      };
      const next = [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
      setSelectedIndex(index + 1);
      return next;
    });
  }

  function removePage(index: number) {
    setPages((current) => {
      const next = current.filter((_, pageIndex) => pageIndex !== index);
      setSelectedIndex(Math.max(0, Math.min(index, next.length - 1)));
      return next;
    });
  }

  function movePage(index: number, direction: -1 | 1) {
    setPages((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      setSelectedIndex(target);
      return next;
    });
  }

  function addCategory() {
    setCategories((current) => [...current, createCategory(current)]);
  }

  function updateCategory(index: number, patch: Partial<LoreCategory>) {
    setCategories((current) =>
      current.map((category, categoryIndex) =>
        categoryIndex === index ? { ...category, ...patch } : category
      )
    );
  }

  function removeCategory(index: number) {
    const category = categories[index];
    if (!category || pages.some((page) => page.category === category.name)) {
      setMensagem("Mova as paginas dessa categoria antes de excluir.");
      return;
    }
    setCategories((current) => current.filter((_, categoryIndex) => categoryIndex !== index));
  }

  async function savePages() {
    setMensagem("");
    setSaving(true);

    const invalid = pages.find((page) => !page.title.trim() || !page.slug.trim() || !page.category.trim());
    if (invalid) {
      setMensagem("Toda pagina precisa ter titulo, slug e categoria.");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/admin/lore", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pages, categories }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMensagem(payload.error || "Erro ao salvar wiki.");
      setSaving(false);
      return;
    }

    setPages(payload.pages || pages);
    setCategories(payload.categories || categories);
    setSaving(false);
    setMensagem("Wiki salva com sucesso.");
  }

  if (loading) {
    return (
      <AdminShell active="lore" title="Lore Iconics">
        <div className="admin-lore-loading"><Spinner texto="Carregando wiki..." /></div>
      </AdminShell>
    );
  }

  if (!permitido) {
    return (
      <AdminShell active="lore" title="Lore Iconics">
        <section className="admin-denied">Acesso negado.</section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="lore"
      title="Editor da Wiki"
      description="Crie lore, casos, personagens e registros com categorias, imagens e ficha lateral."
    >
      <section className="lore-admin-toolbar">
        <div>
          <strong>{pages.length}</strong>
          <span> paginas / </span>
          <strong>{categories.length}</strong>
          <span> categorias</span>
        </div>
        <div className="lore-admin-actions">
          <a href="/lore" target="_blank" rel="noreferrer">Ver wiki</a>
          <button onClick={addPage}>Nova pagina</button>
          <button onClick={savePages} disabled={saving}>{saving ? "Salvando..." : "Salvar wiki"}</button>
        </div>
      </section>

      <section className="lore-category-panel">
        <div className="lore-category-head">
          <h2>Categorias</h2>
          <button onClick={addCategory}>Nova categoria</button>
        </div>
        <div className="lore-category-list">
          {categories.map((category, index) => (
            <div key={category.id} className="lore-category-card">
              <input
                value={category.name}
                onChange={(event) => updateCategory(index, { name: event.target.value })}
                placeholder="Nome da categoria"
              />
              <input
                value={category.description || ""}
                onChange={(event) => updateCategory(index, { description: event.target.value })}
                placeholder="Descricao"
              />
              <button onClick={() => removeCategory(index)}>Excluir</button>
            </div>
          ))}
        </div>
      </section>

      <section className="lore-admin-grid wiki-builder-grid">
        <aside className="lore-admin-list">
          {categories.map((category) => (
            <div key={category.id} className="lore-admin-group">
              <h3>{category.name}</h3>
              {category.description ? <p>{category.description}</p> : null}
              {pages.map((page, index) => page.category === category.name ? (
                <button
                  key={page.id}
                  className={`lore-admin-item ${selectedIndex === index ? "active" : ""}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <strong>{page.title}</strong>
                  <span>{LORE_KIND_LABELS[page.kind || "lore"]} / {page.published ? "Publicado" : "Rascunho"}</span>
                </button>
              ) : null)}
            </div>
          ))}
        </aside>

        {selected ? (
          <article className="lore-admin-editor">
            <div className="lore-admin-editor-head">
              <h2>{selected.title || "Pagina sem titulo"}</h2>
              <div>
                <button onClick={() => movePage(selectedIndex, -1)}>Subir</button>
                <button onClick={() => movePage(selectedIndex, 1)}>Descer</button>
                <button onClick={() => duplicatePage(selectedIndex)}>Copiar</button>
                <button className="danger" onClick={() => removePage(selectedIndex)}>Excluir</button>
              </div>
            </div>

            <div className="lore-admin-form">
              <label>
                Titulo
                <input value={selected.title} onChange={(event) => updatePage(selectedIndex, { title: event.target.value })} />
              </label>
              <label>
                Slug
                <input value={selected.slug} onChange={(event) => updatePage(selectedIndex, { slug: normalizeLoreSlug(event.target.value) })} />
              </label>
              <label>
                Categoria
                <select value={selected.category} onChange={(event) => updatePage(selectedIndex, { category: event.target.value })}>
                  {categoryNames.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label>
                Tipo
                <select value={selected.kind || "lore"} onChange={(event) => updatePage(selectedIndex, { kind: event.target.value as LorePageKind })}>
                  {Object.entries(LORE_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label className="wide">
                Resumo
                <textarea value={selected.summary} onChange={(event) => updatePage(selectedIndex, { summary: event.target.value })} />
              </label>
              <label>
                Data
                <input value={selected.date || ""} onChange={(event) => updatePage(selectedIndex, { date: event.target.value })} placeholder="Ex: 2026 / Era I / 05-06-2026" />
              </label>
              <label>
                Idade
                <input value={selected.age || ""} onChange={(event) => updatePage(selectedIndex, { age: event.target.value })} placeholder="Ex: 19 anos / Desconhecida" />
              </label>
              <label>
                Relacionamentos
                <input value={selected.relationships || ""} onChange={(event) => updatePage(selectedIndex, { relationships: event.target.value })} />
              </label>
              <label>
                Local
                <input value={selected.location || ""} onChange={(event) => updatePage(selectedIndex, { location: event.target.value })} />
              </label>
              <label>
                Status
                <input value={selected.status || ""} onChange={(event) => updatePage(selectedIndex, { status: event.target.value })} />
              </label>
              <label>
                Tags
                <input value={(selected.tags || []).join(", ")} onChange={(event) => updatePage(selectedIndex, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
              </label>
              <label className="wide">
                Imagem da ficha
                <input value={selected.image_url || ""} onChange={(event) => updatePage(selectedIndex, { image_url: event.target.value })} placeholder="/images/arquivo.png ou URL" />
              </label>
              <label className="lore-check">
                <input type="checkbox" checked={selected.published !== false} onChange={(event) => updatePage(selectedIndex, { published: event.target.checked })} />
                Publicar na wiki
              </label>
            </div>

            <div className="lore-block-toolbar">
              <strong>Conteudo do artigo</strong>
              {Object.entries(blockLabels).map(([type, label]) => (
                <button key={type} onClick={() => addBlock(type as LoreContentBlock["type"])}>{label}</button>
              ))}
            </div>

            <div className="lore-block-list">
              {(selected.blocks || []).map((block, blockIndex) => (
                <section key={block.id} className="lore-block-card">
                  <header>
                    <strong>{blockLabels[block.type]}</strong>
                    <div>
                      <button onClick={() => moveBlock(blockIndex, -1)}>Up</button>
                      <button onClick={() => moveBlock(blockIndex, 1)}>Down</button>
                      <button className="danger" onClick={() => removeBlock(blockIndex)}>X</button>
                    </div>
                  </header>
                  <label>
                    Tipo
                    <select value={block.type} onChange={(event) => updateBlock(blockIndex, { type: event.target.value as LoreContentBlock["type"] })}>
                      {Object.entries(blockLabels).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
                    </select>
                  </label>
                  {block.type === "heading" || block.type === "media" ? (
                    <label>
                      {block.type === "media" ? "Titulo do bloco" : "Titulo da secao"}
                      <input value={block.title || ""} onChange={(event) => updateBlock(blockIndex, { title: event.target.value })} />
                    </label>
                  ) : null}
                  {block.type !== "heading" && block.type !== "image" ? (
                    <label>
                      Texto
                      <textarea value={block.body || ""} onChange={(event) => updateBlock(blockIndex, { body: event.target.value })} placeholder={block.type === "list" ? "Uma linha por item" : ""} />
                    </label>
                  ) : null}
                  {block.type === "image" || block.type === "media" ? (
                    <>
                      <label>
                        URL da imagem
                        <input value={block.image_url || ""} onChange={(event) => updateBlock(blockIndex, { image_url: event.target.value })} />
                      </label>
                      <label>
                        Legenda
                        <input value={block.caption || ""} onChange={(event) => updateBlock(blockIndex, { caption: event.target.value })} />
                      </label>
                      <label>
                        Posicao
                        <select value={block.align || "full"} onChange={(event) => updateBlock(blockIndex, { align: event.target.value as LoreContentBlock["align"] })}>
                          {block.type === "image" ? <option value="full">Largura total</option> : null}
                          <option value="left">Imagem na esquerda</option>
                          <option value="right">Imagem na direita</option>
                        </select>
                      </label>
                    </>
                  ) : null}
                </section>
              ))}
            </div>
          </article>
        ) : (
          <article className="lore-admin-editor empty">Crie uma pagina da wiki para comecar.</article>
        )}

        {selected ? (
          <aside className="lore-admin-preview">
            <span>{selected.published !== false ? "Publicado" : "Rascunho"}</span>
            <h2>{selected.title}</h2>
            <p>{selected.summary}</p>
            {selected.image_url ? <img src={selected.image_url} alt={selected.title} /> : null}
            <dl>
              <div><dt>Tipo</dt><dd>{LORE_KIND_LABELS[selected.kind || "lore"]}</dd></div>
              <div><dt>Categoria</dt><dd>{selected.category}</dd></div>
              {selected.date ? <div><dt>Data</dt><dd>{selected.date}</dd></div> : null}
              {selected.age ? <div><dt>Idade</dt><dd>{selected.age}</dd></div> : null}
              {selected.relationships ? <div><dt>Relacionamentos</dt><dd>{selected.relationships}</dd></div> : null}
              {selected.location ? <div><dt>Local</dt><dd>{selected.location}</dd></div> : null}
              {selected.status ? <div><dt>Status</dt><dd>{selected.status}</dd></div> : null}
            </dl>
            <div className="lore-preview-content">
              {(selected.blocks || []).map(renderPreviewBlock)}
            </div>
          </aside>
        ) : null}
      </section>

      {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}
    </AdminShell>
  );
}
