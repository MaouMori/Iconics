"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { NewsItem } from "@/lib/newsData";

const PAGE_SIZE = 4;

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getSearchText(item: NewsItem) {
  return normalizeSearch([
    item.title,
    item.category,
    item.subtitle,
    item.author,
    item.location,
    ...(item.summary || []),
    ...(item.contentBlocks || []).flatMap((block) => [
      block.title || "",
      block.body || "",
      block.caption || "",
    ]),
  ].join(" "));
}

export default function NewsFeedClient({ items }: { items: NewsItem[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const normalizedQuery = normalizeSearch(query);

  const filteredItems = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) => getSearchText(item).includes(normalizedQuery));
  }, [items, normalizedQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleItems = filteredItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function updateQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  return (
    <div style={feedWrapStyle}>
      <div style={searchPanelStyle}>
        <label style={searchLabelStyle}>
          Buscar noticias
          <input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Digite titulo, palavra-chave, categoria..."
            style={searchInputStyle}
          />
        </label>
        <span style={resultCountStyle}>
          {filteredItems.length} resultado{filteredItems.length === 1 ? "" : "s"}
        </span>
      </div>

      <div style={feedStyle}>
        {visibleItems.length > 0 ? visibleItems.map((item) => (
          <Link key={item.slug} href={`/noticias/${item.slug}`} style={feedItemStyle}>
            <img src={item.image} alt={item.imageAlt} style={feedImageStyle} />
            <div>
              <span style={feedKickerStyle}>{item.category}</span>
              <h2 style={feedTitleStyle}>{item.title}</h2>
              <p style={feedTextStyle}>{item.subtitle}</p>
              <small style={feedMetaStyle}>{item.time} - {item.location}</small>
            </div>
          </Link>
        )) : (
          <div style={emptyStyle}>Nenhuma noticia encontrada.</div>
        )}
      </div>

      {totalPages > 1 ? (
        <nav style={paginationStyle} aria-label="Paginas de noticias">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => setPage(pageNumber)}
              style={pageNumber === safePage ? pageButtonActiveStyle : pageButtonStyle}
            >
              {pageNumber}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

const feedWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const searchPanelStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "end",
  gap: 14,
  padding: "0 0 18px",
  borderBottom: "1px solid rgba(255,255,255,.14)",
};

const searchLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  color: "#f5d0fe",
  fontWeight: 900,
};

const searchInputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 48,
  borderRadius: 8,
  border: "1px solid rgba(216,180,254,.28)",
  background: "rgba(255,255,255,.06)",
  color: "#fff",
  padding: "0 16px",
  outline: "none",
};

const resultCountStyle: React.CSSProperties = {
  minHeight: 48,
  display: "grid",
  placeItems: "center",
  padding: "0 14px",
  borderRadius: 8,
  background: "rgba(147,51,234,.16)",
  color: "#c4b5fd",
  fontWeight: 900,
  whiteSpace: "nowrap",
};

const feedStyle: React.CSSProperties = {
  display: "grid",
  gap: 0,
};

const feedItemStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px minmax(0, 1fr)",
  gap: 22,
  padding: "26px 0",
  borderTop: "1px solid rgba(255,255,255,.14)",
  color: "#fff",
  textDecoration: "none",
};

const feedImageStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "16 / 9",
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid rgba(192,132,252,.22)",
};

const feedKickerStyle: React.CSSProperties = {
  color: "#c4b5fd",
  fontWeight: 900,
};

const feedTitleStyle: React.CSSProperties = {
  margin: "8px 0",
  color: "#d946ef",
  fontSize: 30,
  lineHeight: 1.04,
};

const feedTextStyle: React.CSSProperties = {
  color: "#d8cceb",
  fontSize: 16,
};

const feedMetaStyle: React.CSSProperties = {
  color: "#a78bfa",
};

const emptyStyle: React.CSSProperties = {
  padding: "28px 0",
  color: "#d8cceb",
};

const paginationStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 8,
  flexWrap: "wrap",
  paddingTop: 12,
};

const pageButtonStyle: React.CSSProperties = {
  minWidth: 42,
  height: 42,
  borderRadius: 8,
  border: "1px solid rgba(216,180,254,.24)",
  background: "rgba(255,255,255,.05)",
  color: "#f5d0fe",
  fontWeight: 900,
  cursor: "pointer",
};

const pageButtonActiveStyle: React.CSSProperties = {
  ...pageButtonStyle,
  borderColor: "rgba(217,70,239,.72)",
  background: "linear-gradient(135deg, rgba(147,51,234,.65), rgba(217,70,239,.4))",
  color: "#fff",
};
