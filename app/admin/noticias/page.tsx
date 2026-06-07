"use client";

import AdminShell from "@/components/AdminShell";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import { NewsItem, normalizeNewsSlug } from "@/lib/newsData";
import { hasAdminAccess, normalizeRole } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

function createNews(existing: NewsItem[]): NewsItem {
  const next = existing.length + 1;
  return {
    id: `news-${Date.now()}`,
    slug: `nova-noticia-${next}`,
    category: "Fraternidade",
    title: "Nova noticia da Iconics",
    subtitle: "Escreva uma chamada curta para aparecer abaixo do titulo.",
    summary: ["Primeiro paragrafo ou resumo da noticia."],
    author: "Redacao Iconics",
    location: "Arquivo da Fraternidade",
    time: "Agora",
    image: "/images/iconics_emblem_main.png",
    imageAlt: "Imagem da noticia",
    caption: "Legenda da imagem.",
    featured: existing.length === 0,
    urgent: false,
    published: true,
    order: existing.length,
  };
}

export default function AdminNoticiasPage() {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [token, setToken] = useState("");
  const [items, setItems] = useState<NewsItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const selected = items[selectedIndex] || null;

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
      const response = await fetch("/api/admin/news", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      const loadedItems = Array.isArray(payload.items) ? payload.items : [];
      setItems(loadedItems.length > 0 ? loadedItems : [createNews([])]);
      setLoading(false);
    }

    load();
  }, []);

  function updateNews(index: number, patch: Partial<NewsItem>) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const next = { ...item, ...patch };
        if (patch.title !== undefined && (!item.slug || item.slug.startsWith("nova-noticia"))) {
          next.slug = normalizeNewsSlug(patch.title) || item.slug;
        }
        return next;
      })
    );
  }

  function addNews() {
    setItems((current) => {
      const next = [...current, createNews(current)];
      setSelectedIndex(next.length - 1);
      return next;
    });
  }

  function duplicateNews(index: number) {
    setItems((current) => {
      const original = current[index];
      if (!original) return current;
      const copy = {
        ...original,
        id: `news-${Date.now()}`,
        title: `${original.title} (copia)`,
        slug: `${original.slug}-copia`,
        featured: false,
      };
      const next = [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
      setSelectedIndex(index + 1);
      return next;
    });
  }

  function removeNews(index: number) {
    setItems((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      setSelectedIndex(Math.max(0, Math.min(index, next.length - 1)));
      return next;
    });
  }

  function moveNews(index: number, direction: -1 | 1) {
    setItems((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      setSelectedIndex(target);
      return next;
    });
  }

  function setFeatured(index: number, checked: boolean) {
    setItems((current) =>
      current.map((item, itemIndex) => ({
        ...item,
        featured: itemIndex === index ? checked : checked ? false : item.featured,
      }))
    );
  }

  async function saveNews() {
    setMensagem("");
    setSaving(true);

    const invalid = items.find((item) => !item.title.trim() || !item.slug.trim());
    if (invalid) {
      setMensagem("Toda noticia precisa ter titulo e slug.");
      setSaving(false);
      return;
    }

    const response = await fetch("/api/admin/news", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMensagem(payload.error || "Erro ao salvar noticias.");
      setSaving(false);
      return;
    }

    setItems(payload.items || items);
    setSaving(false);
    setMensagem("Noticias salvas com sucesso.");
  }

  if (loading) {
    return (
      <AdminShell active="noticias" title="Noticias Iconics">
        <div className="admin-lore-loading"><Spinner texto="Carregando noticias..." /></div>
      </AdminShell>
    );
  }

  if (!permitido) {
    return (
      <AdminShell active="noticias" title="Noticias Iconics">
        <section className="admin-denied">Acesso negado.</section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="noticias"
      title="Editor de Noticias"
      description="Crie manchetes, artigos, imagens e chamadas do portal iNews."
    >
      <section className="lore-admin-toolbar">
        <div>
          <strong>{items.length}</strong>
          <span> noticias cadastradas</span>
        </div>
        <div className="lore-admin-actions">
          <a href="/noticias" target="_blank" rel="noreferrer">Ver noticias</a>
          <button onClick={addNews}>Nova noticia</button>
          <button onClick={saveNews} disabled={saving}>{saving ? "Salvando..." : "Salvar noticias"}</button>
        </div>
      </section>

      <section className="lore-admin-grid wiki-builder-grid">
        <aside className="lore-admin-list">
          <div className="lore-admin-group">
            <h3>Publicadas</h3>
            {items.map((item, index) => (
              <button
                key={item.id || item.slug}
                className={`lore-admin-item ${selectedIndex === index ? "active" : ""}`}
                onClick={() => setSelectedIndex(index)}
              >
                <strong>{item.title}</strong>
                <span>{item.category} / {item.published !== false ? "Publicado" : "Rascunho"}</span>
              </button>
            ))}
          </div>
        </aside>

        {selected ? (
          <article className="lore-admin-editor">
            <div className="lore-admin-editor-head">
              <h2>{selected.title || "Noticia sem titulo"}</h2>
              <div>
                <button onClick={() => moveNews(selectedIndex, -1)}>Subir</button>
                <button onClick={() => moveNews(selectedIndex, 1)}>Descer</button>
                <button onClick={() => duplicateNews(selectedIndex)}>Copiar</button>
                <button className="danger" onClick={() => removeNews(selectedIndex)}>Excluir</button>
              </div>
            </div>

            <div className="lore-admin-form">
              <label>
                Titulo
                <input value={selected.title} onChange={(event) => updateNews(selectedIndex, { title: event.target.value })} />
              </label>
              <label>
                Slug
                <input value={selected.slug} onChange={(event) => updateNews(selectedIndex, { slug: normalizeNewsSlug(event.target.value) })} />
              </label>
              <label>
                Categoria
                <input value={selected.category} onChange={(event) => updateNews(selectedIndex, { category: event.target.value })} />
              </label>
              <label>
                Autor
                <input value={selected.author} onChange={(event) => updateNews(selectedIndex, { author: event.target.value })} />
              </label>
              <label>
                Local
                <input value={selected.location} onChange={(event) => updateNews(selectedIndex, { location: event.target.value })} />
              </label>
              <label>
                Tempo/data
                <input value={selected.time} onChange={(event) => updateNews(selectedIndex, { time: event.target.value })} placeholder="Ex: Ha 2 horas / 06-06-2026" />
              </label>
              <label className="wide">
                Chamada
                <textarea value={selected.subtitle} onChange={(event) => updateNews(selectedIndex, { subtitle: event.target.value })} />
              </label>
              <label className="wide">
                Resumo e corpo da materia
                <textarea
                  value={(selected.summary || []).join("\n")}
                  onChange={(event) => updateNews(selectedIndex, {
                    summary: event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                  })}
                  placeholder="Uma linha por paragrafo/resumo"
                />
              </label>
              <label className="wide">
                Imagem principal
                <input value={selected.image} onChange={(event) => updateNews(selectedIndex, { image: event.target.value })} placeholder="/images/arquivo.png ou URL" />
              </label>
              <label>
                Texto alternativo
                <input value={selected.imageAlt} onChange={(event) => updateNews(selectedIndex, { imageAlt: event.target.value })} />
              </label>
              <label>
                Legenda
                <input value={selected.caption} onChange={(event) => updateNews(selectedIndex, { caption: event.target.value })} />
              </label>
              <label className="lore-check">
                <input type="checkbox" checked={selected.published !== false} onChange={(event) => updateNews(selectedIndex, { published: event.target.checked })} />
                Publicar
              </label>
              <label className="lore-check">
                <input type="checkbox" checked={Boolean(selected.featured)} onChange={(event) => setFeatured(selectedIndex, event.target.checked)} />
                Manchete principal
              </label>
              <label className="lore-check">
                <input type="checkbox" checked={Boolean(selected.urgent)} onChange={(event) => updateNews(selectedIndex, { urgent: event.target.checked })} />
                Destaque urgente
              </label>
            </div>
          </article>
        ) : (
          <article className="lore-admin-editor empty">Crie uma noticia para comecar.</article>
        )}

        {selected ? (
          <aside className="lore-admin-preview">
            <span>{selected.published !== false ? "Publicado" : "Rascunho"}</span>
            <h2>{selected.title}</h2>
            <p>{selected.subtitle}</p>
            {selected.image ? <img src={selected.image} alt={selected.imageAlt || selected.title} /> : null}
            <dl>
              <div><dt>Categoria</dt><dd>{selected.category}</dd></div>
              <div><dt>Autor</dt><dd>{selected.author}</dd></div>
              <div><dt>Local</dt><dd>{selected.location}</dd></div>
              <div><dt>Tempo</dt><dd>{selected.time}</dd></div>
              <div><dt>Slug</dt><dd>{selected.slug}</dd></div>
            </dl>
            <div className="lore-preview-content">
              {(selected.summary || []).map((line) => <p key={line}>{line}</p>)}
            </div>
          </aside>
        ) : null}
      </section>

      {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}
    </AdminShell>
  );
}
