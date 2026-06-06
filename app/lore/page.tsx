"use client";

import Link from "next/link";
import TopBar from "@/components/Topbar";
import { LORE_KIND_LABELS, LoreCategory, LoreContentBlock, LorePageItem } from "@/lib/lore";
import { useEffect, useMemo, useState } from "react";
import "./lore.css";

function renderLegacyContent(content: string) {
  return String(content || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, index) => {
      if (block.startsWith("## ")) return <h2 key={index}>{block.replace(/^##\s+/, "")}</h2>;
      if (block.startsWith("### ")) return <h3 key={index}>{block.replace(/^###\s+/, "")}</h3>;
      if (block.startsWith(">")) return <blockquote key={index}>{block.replace(/^>\s?/, "")}</blockquote>;
      if (block.startsWith("- ")) {
        const items = block.split("\n").map((line) => line.replace(/^-\s*/, "").trim()).filter(Boolean);
        return <ul key={index}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
      }
      return <p key={index}>{block}</p>;
    });
}

function renderLoreBlock(block: LoreContentBlock) {
  if (block.type === "heading") return <h2 key={block.id}>{block.title || "Secao"}</h2>;
  if (block.type === "quote") return <blockquote key={block.id}>{block.body}</blockquote>;
  if (block.type === "list") {
    const items = String(block.body || "").split("\n").map((item) => item.trim()).filter(Boolean);
    return <ul key={block.id}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
  }
  if (block.type === "image") {
    return (
      <figure key={block.id} className={`wiki-block-image ${block.align || "full"}`}>
        {block.image_url ? <img src={block.image_url} alt={block.caption || "Imagem da wiki"} /> : null}
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }
  if (block.type === "media") {
    return (
      <section key={block.id} className={`wiki-block-media ${block.align === "right" ? "right" : "left"}`}>
        <figure>
          {block.image_url ? <img src={block.image_url} alt={block.caption || block.title || "Imagem da wiki"} /> : null}
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
        <div>
          {block.title ? <h2>{block.title}</h2> : null}
          <p>{block.body}</p>
        </div>
      </section>
    );
  }
  return <p key={block.id}>{block.body}</p>;
}

export default function LorePage() {
  const [pages, setPages] = useState<LorePageItem[]>([]);
  const [categories, setCategories] = useState<LoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState("");

  useEffect(() => {
    async function loadLore() {
      const response = await fetch("/api/lore", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      const loadedPages = Array.isArray(payload.pages) ? payload.pages : [];
      setPages(loadedPages);
      setCategories(Array.isArray(payload.categories) ? payload.categories : []);
      setSelectedSlug(loadedPages[0]?.slug || "");
      setLoading(false);
    }

    loadLore();
  }, []);

  const selected = pages.find((page) => page.slug === selectedSlug) || pages[0] || null;

  const groupedCategories = useMemo(() => {
    const byName = new Map<string, { category: LoreCategory; pages: LorePageItem[] }>();
    categories.forEach((category) => byName.set(category.name, { category, pages: [] }));
    pages.forEach((page) => {
      const categoryName = page.category || "Historia";
      const group = byName.get(categoryName) || {
        category: { id: categoryName, name: categoryName },
        pages: [],
      };
      group.pages.push(page);
      byName.set(categoryName, group);
    });
    return Array.from(byName.values()).filter((group) => group.pages.length > 0);
  }, [categories, pages]);

  return (
    <>
      <TopBar />

      <div className="page-bg" />
      <div className="noise" />

      <main className="wiki-page-shell">
        <header className="wiki-hero">
          <p>Arquivo da Fraternidade</p>
          <h1>Wiki ICONICS</h1>
          <span>Lore, casos, personagens, datas, relacoes e registros internos em formato de enciclopedia.</span>
        </header>

        {loading ? (
          <section className="wiki-empty">Carregando arquivos...</section>
        ) : pages.length === 0 ? (
          <section className="wiki-empty">
            <h2>Nenhuma pagina publicada ainda.</h2>
            <Link href="/admin/lore">Abrir editor admin</Link>
          </section>
        ) : (
          <section className="wiki-layout">
            <aside className="wiki-sidebar">
              <h2>Indice</h2>
              {groupedCategories.map(({ category, pages: categoryPages }) => (
                <div key={category.id || category.name} className="wiki-nav-group">
                  <h3>{category.name}</h3>
                  {category.description ? <p>{category.description}</p> : null}
                  {categoryPages.map((page) => (
                    <button
                      key={page.slug}
                      className={page.slug === selected?.slug ? "active" : ""}
                      onClick={() => setSelectedSlug(page.slug)}
                    >
                      <span>{page.title}</span>
                      <small>{LORE_KIND_LABELS[page.kind || "lore"]}</small>
                    </button>
                  ))}
                </div>
              ))}
            </aside>

            {selected ? (
              <article className="wiki-article">
                <div className="wiki-article-main">
                  <p className="wiki-category">
                    {selected.category} / {LORE_KIND_LABELS[selected.kind || "lore"]}
                  </p>
                  <h2>{selected.title}</h2>
                  <p className="wiki-summary">{selected.summary}</p>
                  <div className="wiki-content">
                    {selected.blocks?.length ? selected.blocks.map(renderLoreBlock) : renderLegacyContent(selected.content)}
                  </div>
                </div>

                <aside className="wiki-infobox">
                  {selected.image_url ? (
                    <img src={selected.image_url} alt={selected.title} />
                  ) : (
                    <div className="wiki-emblem">IO</div>
                  )}
                  <dl>
                    <div><dt>Tipo</dt><dd>{LORE_KIND_LABELS[selected.kind || "lore"]}</dd></div>
                    <div><dt>Categoria</dt><dd>{selected.category}</dd></div>
                    {selected.date ? <div><dt>Data</dt><dd>{selected.date}</dd></div> : null}
                    {selected.age ? <div><dt>Idade</dt><dd>{selected.age}</dd></div> : null}
                    {selected.relationships ? <div><dt>Relacionamentos</dt><dd>{selected.relationships}</dd></div> : null}
                    {selected.location ? <div><dt>Local</dt><dd>{selected.location}</dd></div> : null}
                    {selected.status ? <div><dt>Status</dt><dd>{selected.status}</dd></div> : null}
                    <div><dt>Identificador</dt><dd>{selected.slug}</dd></div>
                    <div><dt>Tags</dt><dd>{(selected.tags || []).join(", ") || "Sem tags"}</dd></div>
                  </dl>
                </aside>
              </article>
            ) : null}
          </section>
        )}
      </main>
    </>
  );
}
