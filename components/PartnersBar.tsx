"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Partner = {
  id: number;
  nome: string;
  logo_url: string | null;
  cor_destaque: string | null;
};

export default function PartnersBar() {
  const [partners, setPartners] = useState<Partner[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/partners", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setPartners(data || []);
        }
      } catch {
        /* silently fail */
      }
    }

    load();
  }, []);

  if (partners.length === 0) return null;

  return (
    <div style={barStyle}>
      <span style={labelStyle}>Parceiros oficiais</span>

      <div style={trackStyle}>
        {partners.map((p) => (
          <Link key={p.id} href={`/parceria/${p.id}`} style={itemStyle}>
            {p.logo_url ? (
              <img
                src={p.logo_url}
                alt={p.nome}
                style={logoStyle}
              />
            ) : (
              <div
                style={{
                  ...placeholderStyle,
                  borderColor: p.cor_destaque || "#7c3aed",
                }}
              >
                {p.nome.charAt(0)}
              </div>
            )}
            <span style={nameStyle}>{p.nome}</span>
          </Link>
        ))}
      </div>

      <Link href="/parcerias" style={verTodosStyle}>
        Ver todos →
      </Link>
    </div>
  );
}

const barStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 90,
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: "10px 20px",
  background: "rgba(5,2,12,0.92)",
  borderTop: "1px solid rgba(168,85,247,0.18)",
  backdropFilter: "blur(16px)",
};

const labelStyle: React.CSSProperties = {
  color: "#c99cff",
  fontSize: "0.72rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  whiteSpace: "nowrap",
};

const trackStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  flex: 1,
  overflowX: "auto",
  scrollbarWidth: "none",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  textDecoration: "none",
  padding: "6px 12px",
  borderRadius: 999,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  transition: "0.2s",
  whiteSpace: "nowrap",
  flexShrink: 0,
};

const logoStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  objectFit: "cover",
};

const placeholderStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  fontSize: "0.7rem",
  fontWeight: 900,
  color: "#d8b4fe",
  background: "rgba(168,85,247,0.15)",
  border: "1px solid",
};

const nameStyle: React.CSSProperties = {
  color: "#e9d5ff",
  fontSize: "0.85rem",
  fontWeight: 600,
};

const verTodosStyle: React.CSSProperties = {
  color: "#a855f7",
  fontSize: "0.82rem",
  fontWeight: 700,
  textDecoration: "none",
  whiteSpace: "nowrap",
  flexShrink: 0,
};
