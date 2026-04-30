"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import TopBar from "@/components/Topbar";
import PartnersBar from "@/components/PartnersBar";
import Spinner from "@/components/Spinner";

type Partner = {
  id: number;
  nome: string;
  logo_url: string | null;
  descricao: string | null;
  beneficios: string | null;
  discord_link: string | null;
  codigo_desconto: string | null;
  cor_destaque: string | null;
  galeria?: string[] | null;
};

export default function ParceriaPage() {
  const params = useParams<{ id: string }>();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/partners/${params?.id}`, { cache: "no-store" });
        if (!res.ok) {
          setErro("Parceria não encontrada.");
          setLoading(false);
          return;
        }
        setPartner(await res.json());
      } catch {
        setErro("Erro ao carregar parceria.");
      } finally {
        setLoading(false);
      }
    }

    if (params?.id) load();
  }, [params?.id]);

  function copiarCodigo() {
    if (!partner?.codigo_desconto) return;
    navigator.clipboard.writeText(partner.codigo_desconto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  const galeria = partner?.galeria?.filter(Boolean) || [];

  function openLightbox(index: number) {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
  }

  function prevLightbox() {
    setLightboxIndex((prev) => (prev === 0 ? galeria.length - 1 : prev - 1));
  }

  function nextLightbox() {
    setLightboxIndex((prev) => (prev === galeria.length - 1 ? 0 : prev + 1));
  }

  if (loading) {
    return (
      <>
        <TopBar />
        <PartnersBar />
        <main style={pageStyle}><Spinner /></main>
      </>
    );
  }

  if (erro || !partner) {
    return (
      <>
        <TopBar />
        <PartnersBar />
        <main style={pageStyle}>
          <div style={shellStyle}>
            <div style={errorCard}>
              <h2>Parceria não encontrada</h2>
              <p>{erro}</p>
              <Link href="/parcerias" style={backLink}>← Voltar às parcerias</Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  const cor = partner.cor_destaque || "#7c3aed";
  const beneficiosList = partner.beneficios
    ? partner.beneficios.split("\n").filter(Boolean)
    : [];

  return (
    <>
      <TopBar />
      <PartnersBar />
      <main style={pageStyle}>
        <div
          style={{
            ...heroGlow,
            background: `radial-gradient(circle at 50% 20%, ${cor}33, transparent 50%)`,
          }}
        />

        <div style={shellStyle}>
          <Link href="/parcerias" style={backLink}>← Voltar às parcerias</Link>

          <div style={heroSection}>
            <div style={logoWrap}>
              {partner.logo_url ? (
                <img src={partner.logo_url} alt={partner.nome} style={logoImg} />
              ) : (
                <div style={{ ...logoPlaceholder, borderColor: cor }}>
                  {partner.nome.charAt(0)}
                </div>
              )}
            </div>

            <div>
              <p style={kickerStyle}>Parceiro Oficial</p>
              <h1 style={titleStyle}>{partner.nome}</h1>
            </div>
          </div>

          <div style={contentGrid}>
            {/* Coluna Esquerda - Informações */}
            <div style={leftCol}>
              <div style={cardStyle}>
                <h3 style={sectionTitle}>Sobre a empresa</h3>
                <p style={textStyle}>
                  {partner.descricao || "Sem descrição cadastrada."}
                </p>
              </div>

              {beneficiosList.length > 0 && (
                <div style={cardStyle}>
                  <h3 style={sectionTitle}>Benefícios da parceria</h3>
                  <ul style={listStyle}>
                    {beneficiosList.map((b, i) => (
                      <li key={i} style={listItemStyle}>{b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Coluna Central - Galeria */}
            {galeria.length > 0 && (
              <div style={centerCol}>
                <div style={galleryCard}>
                  <h3 style={galleryTitle}>📸 Galeria</h3>
                  <div style={galleryGrid}>
                    {galeria.map((src, index) => (
                      <button
                        key={index}
                        type="button"
                        style={galleryItem}
                        onClick={() => openLightbox(index)}
                      >
                        <img src={src} alt={`Foto ${index + 1}`} style={galleryImg} />
                        <div style={galleryOverlay}>
                          <span style={galleryZoomIcon}>🔍</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Coluna Direita - Ações */}
            <aside style={rightCol}>
              {partner.codigo_desconto && (
                <div style={cardStyle}>
                  <h3 style={sectionTitle}>Código exclusivo</h3>
                  <div style={codeBox}>
                    <span style={codeText}>{partner.codigo_desconto}</span>
                    <button
                      type="button"
                      onClick={copiarCodigo}
                      style={copyBtn}
                    >
                      {copiado ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
              )}

              {partner.discord_link && (
                <div style={cardStyle}>
                  <h3 style={sectionTitle}>Discord</h3>
                  <a
                    href={partner.discord_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={discordBtn}
                  >
                    Entrar no Discord
                  </a>
                </div>
              )}

              <div style={cardStyle}>
                <h3 style={sectionTitle}>Quer ser parceiro?</h3>
                <p style={{ ...textStyle, fontSize: "0.92rem" }}>
                  Sua empresa ou comunidade pode se tornar parceira da Iconics.
                </p>
                <a href="/recrutamento" style={partnerBtn}>
                  Quero ser parceiro
                </a>
              </div>
            </aside>
          </div>
        </div>

        {lightboxOpen && galeria.length > 0 && (
          <div style={lightboxOverlay} onClick={closeLightbox}>
            <button type="button" style={lightboxClose} onClick={closeLightbox}>×</button>

            {galeria.length > 1 && (
              <>
                <button
                  type="button"
                  style={{ ...lightboxNav, left: 20 }}
                  onClick={(e) => { e.stopPropagation(); prevLightbox(); }}
                >
                  ←
                </button>
                <button
                  type="button"
                  style={{ ...lightboxNav, right: 20 }}
                  onClick={(e) => { e.stopPropagation(); nextLightbox(); }}
                >
                  →
                </button>
              </>
            )}

            <div style={lightboxContent} onClick={(e) => e.stopPropagation()}>
              <img
                src={galeria[lightboxIndex]}
                alt={`Foto ${lightboxIndex + 1}`}
                style={lightboxImage}
              />
            </div>
          </div>
        )}
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

const heroGlow: React.CSSProperties = {
  position: "absolute",
  top: -100,
  left: 0,
  right: 0,
  height: 500,
  pointerEvents: "none",
};

const shellStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1400px",
  margin: "0 auto",
};

const backLink: React.CSSProperties = {
  color: "#c99cff",
  textDecoration: "none",
  fontSize: "0.92rem",
  fontWeight: 600,
  display: "inline-block",
  marginBottom: 24,
};

const heroSection: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 24,
  marginBottom: 32,
  flexWrap: "wrap",
};

const logoWrap: React.CSSProperties = {};

const logoImg: React.CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: "50%",
  objectFit: "cover",
  border: "2px solid rgba(168,85,247,0.3)",
  boxShadow: "0 0 30px rgba(168,85,247,0.25)",
};

const logoPlaceholder: React.CSSProperties = {
  width: 96,
  height: 96,
  borderRadius: "50%",
  display: "grid",
  placeItems: "center",
  fontSize: "2.4rem",
  fontWeight: 900,
  color: "#d8b4fe",
  background: "rgba(168,85,247,0.12)",
  border: "2px solid",
};

const kickerStyle: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: "0.78rem",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: "6px 0 0",
  fontSize: "clamp(2rem, 4vw, 3rem)",
  fontFamily: 'Georgia, "Times New Roman", serif',
};

// Grid de 3 colunas: esquerda (info), centro (galeria), direita (ações)
const contentGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px 1fr 280px",
  gap: 24,
  alignItems: "start",
};

const leftCol: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const centerCol: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const rightCol: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 20,
};

const cardStyle: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "22px",
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 12px",
  fontSize: "1.15rem",
  fontWeight: 800,
  fontFamily: 'Georgia, "Times New Roman", serif',
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: "#d8cceb",
  lineHeight: 1.8,
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const listItemStyle: React.CSSProperties = {
  color: "#e9d5ff",
  lineHeight: 1.6,
};

const codeBox: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "12px 16px",
  borderRadius: 14,
  background: "rgba(168,85,247,0.1)",
  border: "1px dashed rgba(168,85,247,0.3)",
};

const codeText: React.CSSProperties = {
  flex: 1,
  fontFamily: "monospace",
  fontSize: "1.1rem",
  fontWeight: 700,
  color: "#f3e8ff",
  letterSpacing: "0.06em",
};

const copyBtn: React.CSSProperties = {
  height: 36,
  padding: "0 16px",
  borderRadius: 999,
  border: "none",
  background: "#8b5cf6",
  color: "white",
  fontWeight: 700,
  fontSize: "0.85rem",
  cursor: "pointer",
};

const discordBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 46,
  borderRadius: 999,
  background: "#5865F2",
  color: "white",
  fontWeight: 700,
  textDecoration: "none",
};

const partnerBtn: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: 46,
  borderRadius: 999,
  background: "linear-gradient(90deg, #5b21b6, #a855f7)",
  color: "white",
  fontWeight: 700,
  textDecoration: "none",
  marginTop: 8,
};

const errorCard: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "32px",
  textAlign: "center",
};

// Galeria estilizada - card maior e central
const galleryCard: React.CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(91,33,182,0.08) 100%)",
  padding: "28px",
};

const galleryTitle: React.CSSProperties = {
  margin: "0 0 20px",
  fontSize: "1.25rem",
  fontWeight: 800,
  fontFamily: 'Georgia, "Times New Roman", serif',
  textAlign: "center",
  color: "#e9d5ff",
};

const galleryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 16,
};

const galleryItem: React.CSSProperties = {
  aspectRatio: "1",
  borderRadius: 16,
  overflow: "hidden",
  border: "none",
  padding: 0,
  cursor: "pointer",
  background: "transparent",
  position: "relative",
};

const galleryImg: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  transition: "transform 0.3s ease, filter 0.3s ease",
};

const galleryOverlay: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  opacity: 0,
  transition: "opacity 0.3s ease",
};

const galleryZoomIcon: React.CSSProperties = {
  fontSize: "2rem",
  filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
};

const lightboxOverlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.92)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  cursor: "zoom-out",
};

const lightboxClose: React.CSSProperties = {
  position: "absolute",
  top: 20,
  right: 20,
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "none",
  background: "rgba(255,255,255,0.1)",
  color: "white",
  fontSize: "2rem",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

const lightboxNav: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 48,
  height: 48,
  borderRadius: "50%",
  border: "none",
  background: "rgba(255,255,255,0.1)",
  color: "white",
  fontSize: "1.5rem",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
};

const lightboxContent: React.CSSProperties = {
  maxWidth: "90%",
  maxHeight: "90%",
};

const lightboxImage: React.CSSProperties = {
  maxWidth: "100%",
  maxHeight: "90vh",
  borderRadius: 16,
  boxShadow: "0 0 60px rgba(168,85,247,0.3)",
};
