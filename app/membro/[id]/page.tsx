"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useParams } from "next/navigation";
import "../wiki-membro.css";

type MemberCardRow = {
  id: number;
  nome: string;
  idade: number | null;
  cargo: string | null;
  meta: string | null;
  personalidade: string | null;
  habitos: string | null;
  gostos: string | null;
  hobbies: string | null;
  tags: string | null;
  stats: string | null;
  sigil: string | null;
  imagem_url: string | null;
  accent_color: string | null;
  galeria?: string[] | null;
};

type GalleryItem = {
  id: number;
  src: string;
  alt: string;
};

type ParsedStat = {
  label: string;
  value: string;
};

export default function WikiMembroPage() {
  const params = useParams<{ id: string }>();
  const rawId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [member, setMember] = useState<MemberCardRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    async function loadMember() {
      if (!rawId) return;

      try {
        const memberId = Number(rawId);

        if (Number.isNaN(memberId) || memberId <= 0) {
          setErro("Membro inválido.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("member_cards")
          .select("*")
          .eq("id", memberId)
          .single();

        if (error || !data) {
          setErro("Membro não encontrado.");
          setLoading(false);
          return;
        }

        setMember(data as MemberCardRow);
      } catch {
        setErro("Erro ao carregar membro.");
      } finally {
        setLoading(false);
      }
    }

    loadMember();
  }, [rawId]);

  const tags = useMemo(() => splitPipe(member?.tags), [member?.tags]);
  const hobbies = useMemo(() => splitPipe(member?.hobbies), [member?.hobbies]);
  const stats = useMemo(() => parseStats(member?.stats), [member?.stats]);

const gallery = useMemo<GalleryItem[]>(() => {
  const galeriaReal = Array.isArray(member?.galeria) ? member.galeria : [];
  const limpas = galeriaReal
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 16);

  const fallback = member?.imagem_url || "/images/logo.png";
  const base = limpas.length ? limpas : [fallback];

  return base.map((src, index) => ({
    id: index + 1,
    src,
    alt: `${member?.nome || "Membro"} ${index + 1}`,
  }));
}, [member?.galeria, member?.imagem_url, member?.nome]);

  const visiblePhotos = useMemo(() => {
    if (gallery.length <= 4) return gallery;
    const ordered = [...gallery.slice(photoIndex), ...gallery.slice(0, photoIndex)];
    return ordered.slice(0, 4);
  }, [gallery, photoIndex]);

  function prevPhoto() {
    setPhotoIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
  }

  function nextPhoto() {
    setPhotoIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
  }
  function openLightbox(index: number) {
  setLightboxIndex(index);
  setLightboxOpen(true);
}

function closeLightbox() {
  setLightboxOpen(false);
}

function prevLightbox() {
  setLightboxIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));
}

function nextLightbox() {
  setLightboxIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));
}

  if (loading) {
    return (
      <main className="member-wiki-page">
        <div className="member-wiki-bg" />
        <div className="member-wiki-noise" />
        <div className="member-wiki-shell">
          <div className="member-wiki-card">Carregando membro...</div>
        </div>
      </main>
    );
  }

  if (erro || !member) {
    return (
      <main className="member-wiki-page">
        <div className="member-wiki-bg" />
        <div className="member-wiki-noise" />
        <div className="member-wiki-shell">
          <div className="member-wiki-card">
            <h2>Erro</h2>
            <p>{erro || "Não foi possível carregar o membro."}</p>
            <Link href="/" className="member-wiki-back">
              ← Voltar ao site
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="member-wiki-page">
      <div className="member-wiki-bg" />
      <div className="member-wiki-noise" />

      <div className="member-wiki-shell">
        <header className="member-wiki-topbar">
          <div className="member-wiki-brand">
            <img src="/images/logo.png" alt="Iconics" className="member-wiki-brand-logo" />
            <div>
              <h1>ICONICS</h1>
              <p>Arquivo de Membro</p>
            </div>
          </div>

          <Link href="/" className="member-wiki-back">
            ← Voltar ao site
          </Link>
        </header>

        <section className="member-wiki-hero">
          <div className="member-wiki-hero-copy">
            <p className="member-wiki-kicker">Membro das Iconics</p>
            <h2>{member.nome || "Sem nome"}</h2>
            <p className="member-wiki-role">{formatCargo(member.cargo)}</p>

            <div className="member-wiki-meta">
              <span>{member.idade ? `${member.idade} anos` : "Idade não informada"}</span>
              <span>{member.meta || "Presença marcante"}</span>
            </div>

            <p className="member-wiki-description">
              {member.personalidade || "Sem descrição cadastrada para este membro."}
            </p>

            <div className="member-wiki-tags">
              {tags.length ? (
                tags.map((tag) => (
                  <span key={tag} className="member-wiki-tag">
                    {tag}
                  </span>
                ))
              ) : (
                <span className="member-wiki-tag">Sem tags</span>
              )}
            </div>
          </div>

          <div className="member-wiki-image-wrap">
            <img
              src={member.imagem_url || "/images/logo.png"}
              alt={member.nome || "Membro"}
              className="member-wiki-image"
            />
            <div className="member-wiki-image-glow" />
          </div>
        </section>

        <section className="member-wiki-grid">
          <article className="member-wiki-card">
            <h3>Personalidade</h3>
            <p>{member.personalidade || "Não informado."}</p>
          </article>

          <article className="member-wiki-card">
            <h3>Hábitos</h3>
            <p>{member.habitos || "Não informado."}</p>
          </article>

          <article className="member-wiki-card">
            <h3>Gostos</h3>
            <p>{member.gostos || "Não informado."}</p>
          </article>

          <article className="member-wiki-card">
            <h3>Hobbies</h3>
            {hobbies.length ? (
              <div className="member-wiki-tag-list">
                {hobbies.map((item) => (
                  <span key={item} className="member-wiki-chip">
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p>Não informado.</p>
            )}
          </article>

          <article className="member-wiki-card member-wiki-card-wide">
            <h3>Lore Pessoal</h3>
            <p>{member.meta || "Sem lore cadastrada."}</p>
          </article>

          <article className="member-wiki-card member-wiki-card-wide">
            <div className="member-wiki-gallery-head">
              <h3>Galeria de Memórias</h3>

              <div className="member-wiki-gallery-controls">
                <button type="button" onClick={prevPhoto}>←</button>
                <button type="button" onClick={nextPhoto}>→</button>
              </div>
            </div>

          <div className="member-wiki-gallery-grid">
            {visiblePhotos.map((photo) => {
              const realIndex = gallery.findIndex((item) => item.id === photo.id);

              return (
                <button
                  key={photo.id}
                  type="button"
                  className="member-wiki-gallery-item"
                  onClick={() => openLightbox(realIndex)}
                >
                  <img src={photo.src} alt={photo.alt} />
                </button>
              );
            })}
          </div>

            <div className="member-wiki-gallery-dots">
              {gallery.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  className={`member-wiki-gallery-dot ${index === photoIndex ? "active" : ""}`}
                  onClick={() => setPhotoIndex(index)}
                  aria-label={`Ir para foto ${index + 1}`}
                />
              ))}
            </div>
          </article>

          <article className="member-wiki-card member-wiki-card-wide">
            <h3>Estatísticas</h3>
            {stats.length ? (
              <div className="member-wiki-stats">
                {stats.map((stat) => (
                  <div key={stat.label} className="member-wiki-stat">
                    <span className="member-wiki-stat-value">{stat.value}</span>
                    <span className="member-wiki-stat-label">{stat.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>Sem estatísticas cadastradas.</p>
            )}
          </article>
        </section>
        {lightboxOpen && (
  <div className="member-lightbox" onClick={closeLightbox}>
    <button
      type="button"
      className="member-lightbox-close"
      onClick={closeLightbox}
    >
      ×
    </button>

    {gallery.length > 1 && (
      <>
        <button
          type="button"
          className="member-lightbox-nav member-lightbox-prev"
          onClick={(e) => {
            e.stopPropagation();
            prevLightbox();
          }}
        >
          ←
        </button>

        <button
          type="button"
          className="member-lightbox-nav member-lightbox-next"
          onClick={(e) => {
            e.stopPropagation();
            nextLightbox();
          }}
        >
          →
        </button>
      </>
    )}

    <div
      className="member-lightbox-content"
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={gallery[lightboxIndex]?.src}
        alt={gallery[lightboxIndex]?.alt || "Imagem ampliada"}
        className="member-lightbox-image"
      />
    </div>
  </div>
)}
      </div>
      
    </main>
  );
}


function splitPipe(value?: string | null) {
  if (!value) return [];
  return String(value)
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseStats(value?: string | null): ParsedStat[] {
  if (!value) return [];

  return String(value)
    .split("|")
    .map((item) => {
      const [label, rawValue] = item.split(":");
      return {
        label: (label || "").trim() || "Atributo",
        value: (rawValue || "").trim() || "0",
      };
    })
    .filter((item) => item.label);
}


function formatCargo(cargo?: string | null) {
  const map: Record<string, string> = {
    lider: "Líder da Iconics",
    vice_lider: "Vice-líder",
    veterano: "Veterano",
    membro: "Membro",
  };
  

  return map[String(cargo || "membro").trim().toLowerCase()] || "Membro";
}