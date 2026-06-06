"use client";

import Link from "next/link";
import TopBar from "@/components/Topbar";
import { LorePageItem } from "@/lib/lore";
import { useEffect, useMemo, useState } from "react";
import "./lore.css";

function renderLoreContent(content: string) {
  const blocks = String(content || "").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);

  return blocks.map((block, index) => {
    if (block.startsWith("## ")) {
      return <h2 key={index}>{block.replace(/^##\s+/, "")}</h2>;
    }

    if (block.startsWith("### ")) {
      return <h3 key={index}>{block.replace(/^###\s+/, "")}</h3>;
    }

    if (block.startsWith(">")) {
      return <blockquote key={index}>{block.replace(/^>\s?/, "")}</blockquote>;
    }

    if (block.startsWith("- ")) {
      const items = block.split("\n").map((line) => line.replace(/^-\s*/, "").trim()).filter(Boolean);
      return (
        <ul key={index}>
          {items.map((item) => <li key={item}>{item}</li>)}
        </ul>
      );
    }

    return <p key={index}>{block}</p>;
  });
}

export default function LorePage() {
  const [pages, setPages] = useState<LorePageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState("");

  useEffect(() => {
    async function loadLore() {
      const response = await fetch("/api/lore", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      const loadedPages = Array.isArray(payload.pages) ? payload.pages : [];
      setPages(loadedPages);
      setSelectedSlug(loadedPages[0]?.slug || "");
      setLoading(false);
    }

    loadLore();
  }, []);

  const selected = pages.find((page) => page.slug === selectedSlug) || pages[0] || null;

  const categories = useMemo(() => {
    const map = new Map<string, LorePageItem[]>();
    pages.forEach((page) => {
      const category = page.category || "Historia";
      map.set(category, [...(map.get(category) || []), page]);
    });
    return Array.from(map.entries());
  }, [pages]);

  return (
    <>
      <TopBar />

      <div className="page-bg" />
      <div className="noise" />

      <main className="wiki-page-shell">
        <header className="wiki-hero">
          <p>Arquivo da Fraternidade</p>
          <h1>Lore ICONICS</h1>
          <span>Uma wiki viva para historias, entidades, regras internas e registros da mansao.</span>
        </header>

        {loading ? (
          <section className="wiki-empty">Carregando arquivos...</section>
        ) : pages.length === 0 ? (
          <section className="wiki-empty">
            <h2>Nenhuma lore publicada ainda.</h2>
            <Link href="/admin/lore">Abrir editor admin</Link>
          </section>
        ) : (
          <section className="wiki-layout">
            <aside className="wiki-sidebar">
              <h2>Conteudo</h2>
              {categories.map(([category, items]) => (
                <div key={category} className="wiki-nav-group">
                  <h3>{category}</h3>
                  {items.map((page) => (
                    <button
                      key={page.slug}
                      className={page.slug === selected?.slug ? "active" : ""}
                      onClick={() => setSelectedSlug(page.slug)}
                    >
                      {page.title}
                    </button>
                  ))}
                </div>
              ))}
            </aside>

            {selected ? (
              <article className="wiki-article">
                <div className="wiki-article-main">
                  <p className="wiki-category">{selected.category}</p>
                  <h2>{selected.title}</h2>
                  <p className="wiki-summary">{selected.summary}</p>
                  <div className="wiki-content">
                    {renderLoreContent(selected.content)}
                  </div>
                </div>

                <aside className="wiki-infobox">
                  {selected.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected.image_url} alt={selected.title} />
                  ) : (
                    <div className="wiki-emblem">IO</div>
                  )}
                  <dl>
                    <div>
                      <dt>Categoria</dt>
                      <dd>{selected.category}</dd>
                    </div>
                    <div>
                      <dt>Identificador</dt>
                      <dd>{selected.slug}</dd>
                    </div>
                    <div>
                      <dt>Tags</dt>
                      <dd>{(selected.tags || []).join(", ") || "Sem tags"}</dd>
                    </div>
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
