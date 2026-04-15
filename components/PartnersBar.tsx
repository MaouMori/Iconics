"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type Partner = {
  id: number;
  nome: string;
  logo_url: string | null;
  cor_destaque: string | null;
};

export default function PartnersBar() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();
  const isMansaoPage = pathname === "/mansao";
  const hiddenByRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/painel");

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

  useEffect(() => {
    const syncMobile = () => setIsMobile(window.innerWidth <= 980);
    syncMobile();
    window.addEventListener("resize", syncMobile);
    return () => window.removeEventListener("resize", syncMobile);
  }, []);

  if (partners.length === 0 || isMobile || hiddenByRoute) return null;

  return (
    <div
      style={{
        ...sidebarStyle,
        left: isMansaoPage ? undefined : 12,
        right: isMansaoPage ? 12 : undefined,
      }}
    >
      <div style={headerStyle}>
        <span style={labelStyle}>Parceiros</span>
      </div>

      <div style={trackStyle}>
        {partners.map((p) => (
          <Link key={p.id} href={`/parceria/${p.id}`} style={itemStyle}>
            {p.logo_url ? (
              <img
                src={p.logo_url}
                alt={p.nome}
                style={logoStyle}
                title={p.nome}
              />
            ) : (
              <div
                style={{
                  ...placeholderStyle,
                  borderColor: p.cor_destaque || "#7c3aed",
                }}
                title={p.nome}
              >
                {p.nome.charAt(0)}
              </div>
            )}
          </Link>
        ))}
      </div>

      <Link href="/parcerias" style={verTodosStyle}>
        Ver todos {"->"}
      </Link>
    </div>
  );
}

const sidebarStyle: React.CSSProperties = {
  position: "fixed",
  left: 12,
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 90,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  padding: "16px 10px",
  background: "rgba(5,2,12,0.85)",
  borderRadius: 20,
  border: "1px solid rgba(168,85,247,0.2)",
  backdropFilter: "blur(12px)",
  boxShadow: "0 0 30px rgba(168,85,247,0.15)",
  maxHeight: "80vh",
};

const headerStyle: React.CSSProperties = {
  writingMode: "vertical-rl",
  textOrientation: "mixed",
  transform: "rotate(180deg)",
};

const labelStyle: React.CSSProperties = {
  color: "#c99cff",
  fontSize: "0.7rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  whiteSpace: "nowrap",
};

const trackStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 14,
  overflowY: "auto",
  scrollbarWidth: "none",
  padding: "8px 0",
};

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  transition: "transform 0.2s",
};

const logoStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid rgba(168,85,247,0.3)",
  boxShadow: "0 0 15px rgba(168,85,247,0.2)",
  transition: "all 0.2s",
};

const placeholderStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  fontSize: "1.4rem",
  fontWeight: 900,
  color: "#d8b4fe",
  background: "rgba(168,85,247,0.15)",
  border: "2px solid",
  transition: "all 0.2s",
};

const verTodosStyle: React.CSSProperties = {
  color: "#a855f7",
  fontSize: "0.7rem",
  fontWeight: 700,
  textDecoration: "none",
  whiteSpace: "nowrap",
  writingMode: "vertical-rl",
  textOrientation: "mixed",
  transform: "rotate(180deg)",
  padding: "8px 0",
};

