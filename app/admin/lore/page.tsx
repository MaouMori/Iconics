"use client";

import AdminShell from "@/components/AdminShell";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import { LorePageItem, normalizeLoreSlug } from "@/lib/lore";
import { hasAdminAccess, normalizeRole } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

function createLorePage(existing: LorePageItem[]): LorePageItem {
  const next = existing.length + 1;
  return {
    id: `lore-${Date.now()}`,
    slug: `nova-pagina-${next}`,
    title: "Nova pagina de lore",
    category: "Historia",
    summary: "Resumo curto para aparecer na wiki.",
    content: "## Titulo da secao\n\nEscreva a lore aqui.\n\n> Use citacoes para profecias, regras ou registros antigos.",
    image_url: "",
    tags: ["Iconics"],
    order: existing.length,
    published: true,
  };
}

export default function AdminLorePage() {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [token, setToken] = useState("");
  const [pages, setPages] = useState<LorePageItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const selected = pages[selectedIndex] || null;

  const categories = useMemo(() => {
    return Array.from(new Set(pages.map((page) => page.category || "Historia")));
  }, [pages]);

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
      setPages(loadedPages.length > 0 ? loadedPages : [createLorePage([])]);
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
        if (patch.tags !== undefined) {
          next.tags = patch.tags;
        }
        return next;
      })
    );
  }

  function addPage() {
    setPages((current) => {
      const next = [...current, createLorePage(current)];
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

  async function savePages() {
    setMensagem("");
    setSaving(true);

    const invalid = pages.find((page) => !page.title.trim() || !page.slug.trim());
    if (invalid) {
      setMensagem("Toda pagina precisa ter titulo e slug.");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/admin/lore", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pages }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMensagem(payload.error || "Erro ao salvar lore.");
      setSaving(false);
      return;
    }

    setPages(payload.pages || pages);
    setSaving(false);
    setMensagem("Lore salva com sucesso.");
  }

  if (loading) {
    return (
      <AdminShell active="lore" title="Lore Iconics">
        <div className="admin-lore-loading"><Spinner texto="Carregando lore..." /></div>
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
      title="Editor de Lore"
      description="Crie paginas, organize capitulos e publique a wiki da fraternidade."
    >
      <section className="lore-admin-toolbar">
        <div>
          <strong>{pages.length}</strong>
          <span> paginas cadastradas</span>
        </div>
        <div className="lore-admin-actions">
          <a href="/lore" target="_blank" rel="noreferrer">Ver wiki</a>
          <button onClick={addPage}>Nova pagina</button>
          <button onClick={savePages} disabled={saving}>{saving ? "Salvando..." : "Salvar lore"}</button>
        </div>
      </section>

      <section className="lore-admin-grid">
        <aside className="lore-admin-list">
          {categories.map((category) => (
            <div key={category} className="lore-admin-group">
              <h3>{category}</h3>
              {pages.map((page, index) => page.category === category ? (
                <button
                  key={page.id}
                  className={`lore-admin-item ${selectedIndex === index ? "active" : ""}`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <strong>{page.title}</strong>
                  <span>{page.published ? "Publicado" : "Rascunho"} / {page.slug}</span>
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
                <button onClick={() => duplicatePage(selectedIndex)}>Duplicar</button>
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
                <input value={selected.category} onChange={(event) => updatePage(selectedIndex, { category: event.target.value })} />
              </label>
              <label>
                Tags
                <input value={(selected.tags || []).join(", ")} onChange={(event) => updatePage(selectedIndex, { tags: event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
              </label>
              <label className="wide">
                Resumo
                <textarea value={selected.summary} onChange={(event) => updatePage(selectedIndex, { summary: event.target.value })} />
              </label>
              <label className="wide">
                Imagem de capa
                <input value={selected.image_url || ""} onChange={(event) => updatePage(selectedIndex, { image_url: event.target.value })} placeholder="/images/mansao.png ou URL" />
              </label>
              <label className="wide">
                Conteudo
                <textarea className="lore-content-editor" value={selected.content} onChange={(event) => updatePage(selectedIndex, { content: event.target.value })} />
              </label>
              <label className="lore-check">
                <input type="checkbox" checked={selected.published !== false} onChange={(event) => updatePage(selectedIndex, { published: event.target.checked })} />
                Publicar na wiki
              </label>
            </div>
          </article>
        ) : (
          <article className="lore-admin-editor empty">Crie uma pagina de lore para comecar.</article>
        )}
      </section>

      {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}
    </AdminShell>
  );
}
