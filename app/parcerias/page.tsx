"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";

type Partner = {
  id: number;
  nome: string;
  logo_url: string | null;
  descricao: string | null;
  beneficios: string | null;
  discord_link: string | null;
  cor_destaque: string | null;
};

export default function ParceriasPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/partners", { cache: "no-store" });
        if (res.ok) setPartners(await res.json());
      } catch {
        /* */
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <div style={glowTop} />
        <div style={glowBottom} />

        <section style={heroStyle}>
          <p style={kickerStyle}>Fraternidade Iconics</p>
          <h1 style={titleStyle}>Nossas Parcerias</h1>
          <p style={subtitleStyle}>
            Empresas e comunidades que caminham ao lado da Iconics.
            Conheça cada uma e aproveite os benefícios exclusivos.
          </p>
        </section>

        <section style={shellStyle}>
          {loading ? (
            <Spinner />
          ) : partners.length === 0 ? (
            <p style={emptyStyle}>Nenhuma parceria ativa no momento.</p>
          ) : (
            <div style={gridStyle}>
              {partners.map((p) => (
                <Link
                  key={p.id}
                  href={`/parceria/${p.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div style={cardStyle}>
                    <div
                      style={{
                        ...cardGlow,
                        background: `radial-gradient(circle at center, ${p.cor_destaque || "#7c3aed"}33, transparent 70%)`,
                      }}
                    />

                    <div style={cardLogoWrap}>
                      {p.logo_url ? (
                        <img
                          src={p.logo_url}
                          alt={p.nome}
                          style={cardLogo}
                        />
                      ) : (
                        <div
                          style={{
                            ...cardLogoPlaceholder,
                            borderColor: p.cor_destaque || "#7c3aed",
                          }}
                        >
                          {p.nome.charAt(0)}
                        </div>
                      )}
                    </div>

                    <h3 style={cardTitle}>{p.nome}</h3>

                    <p style={cardDesc}>
                      {p.descricao
                        ? p.descricao.length > 120
                          ? p.descricao.slice(0, 120) + "..."
                          : p.descricao
                        : "Parceiro oficial da Iconics."}
                    </p>

                    <div style={cardFooter}>
                      {p.discord_link && <span style={chipStyle}>Discord</span>}
                      <span style={chipStyle}>Parceiro</span>
                    </div>

                    <span style={cardArrow}>Ver detalhes →</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div style={ctaWrap}>
            <p style={ctaText}>Quer ser parceiro da Iconics?</p>
            <a href="/recrutamento" style={ctaBtn}>
              Quero ser parceiro
            </a>
          </div>
        </section>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "110px 24px 80px",
  color: "white",
};

const glowTop: React.CSSProperties = {
  position: "absolute",
  top: -180,
  left: "50%",
  transform: "translateX(-50%)",
  width: 900,
  height: 420,
  borderRadius: "50%",
  background: "rgba(167,92,255,0.16)",
  filter: "blur(120px)",
  pointerEvents: "none",
};

const glowBottom: React.CSSProperties = {
  position: "absolute",
  right: -120,
  bottom: -120,
  width: 520,
  height: 520,
  borderRadius: "50%",
  background: "rgba(96,36,255,0.16)",
  filter: "blur(120px)",
  pointerEvents: "none",
};

const heroStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "900px",
  margin: "0 auto 36px",
  textAlign: "center",
};

const kickerStyle: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontSize: "0.78rem",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: "12px 0 14px",
  fontSize: "clamp(2.4rem, 5vw, 4rem)",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontWeight: 900,
};

const subtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#d8cceb",
  lineHeight: 1.8,
  maxWidth: "680px",
  marginLeft: "auto",
  marginRight: "auto",
};

const shellStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1200px",
  margin: "0 auto",
};

const emptyStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#d8b4fe",
  fontSize: "1.1rem",
  padding: "40px 0",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 24,
};

const cardStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: 24,
  border: "1px solid rgba(201,156,255,0.14)",
  background: "rgba(18,7,30,0.92)",
  padding: "28px 24px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
  overflow: "hidden",
  cursor: "pointer",
  transition: "transform 0.2s, box-shadow 0.2s",
};

const cardGlow: React.CSSProperties = {
  position: "absolute",
  top: -40,
  left: "50%",
  transform: "translateX(-50%)",
  width: 200,
  height: 120,
  borderRadius: "50%",
  filter: "blur(60px)",
  pointerEvents: "none",
};

const cardLogoWrap: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
};

const cardLogo: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid rgba(168,85,247,0.3)",
  boxShadow: "0 0 20px rgba(168,85,247,0.2)",
};

const cardLogoPlaceholder: React.CSSProperties = {
  width: 72,
  height: 72,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  fontSize: "1.8rem",
  fontWeight: 900,
  color: "#d8b4fe",
  background: "rgba(168,85,247,0.12)",
  border: "2px solid",
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.3rem",
  fontWeight: 800,
  textAlign: "center",
};

const cardDesc: React.CSSProperties = {
  margin: 0,
  color: "#d8cceb",
  lineHeight: 1.7,
  fontSize: "0.92rem",
  textAlign: "center",
};

const cardFooter: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: 8,
  flexWrap: "wrap",
};

const chipStyle: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: 999,
  fontSize: "0.78rem",
  fontWeight: 700,
  background: "rgba(168,85,247,0.14)",
  border: "1px solid rgba(201,156,255,0.2)",
  color: "#e9d5ff",
};

const cardArrow: React.CSSProperties = {
  textAlign: "center",
  color: "#a855f7",
  fontSize: "0.88rem",
  fontWeight: 700,
};

const ctaWrap: React.CSSProperties = {
  textAlign: "center",
  marginTop: 48,
  padding: "32px 24px",
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
};

const ctaText: React.CSSProperties = {
  margin: "0 0 16px",
  fontSize: "1.2rem",
  fontWeight: 700,
};

const ctaBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: 48,
  padding: "0 28px",
  borderRadius: 999,
  background: "linear-gradient(90deg, #5b21b6, #a855f7, #7c3aed)",
  color: "white",
  fontWeight: 700,
  textDecoration: "none",
};
