"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";

type EventItem = {
  id: number;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  horario: string | null;
  local: string | null;
  imagem_url: string | null;
};

type EventDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default function EventDetailPage({ params }: EventDetailPageProps) {
  const [eventId, setEventId] = useState<number | null>(null);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      const { id } = await params;
      const parsedId = Number(id);

      if (!Number.isFinite(parsedId) || parsedId <= 0) {
        if (mounted) {
          setError("ID de evento invalido.");
          setLoading(false);
        }
        return;
      }

      if (mounted) setEventId(parsedId);

      const response = await fetch(`/api/public-events/${parsedId}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null);

      if (!mounted) return;

      if (!response.ok) {
        setError(payload?.error || "Nao foi possivel carregar o evento.");
        setLoading(false);
        return;
      }

      setEvent(payload?.event || null);
      setLoading(false);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [params]);

  const formattedDate = event?.data_evento
    ? new Date(`${event.data_evento}T00:00:00`).toLocaleDateString("pt-BR")
    : "Sem data";

  if (loading) {
    return (
      <>
        <TopBar />
        <main style={loaderStyle}>
          <Spinner texto="Carregando evento..." />
        </main>
      </>
    );
  }

  if (error || !event) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <section style={errorCardStyle}>
            <h1 style={{ margin: 0 }}>Evento indisponivel</h1>
            <p style={{ margin: "10px 0 0", color: "#d8cceb" }}>
              {error || "Nao foi possivel localizar esse evento."}
            </p>
            <div style={ctaRowStyle}>
              <Link href="/calendario" style={pillBtnStyle}>Voltar ao calendario</Link>
              <Link href="/painel" style={pillBtnStyle}>Ir para o painel</Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <section style={shellStyle}>
          <header style={headerStyle}>
            <p style={kickerStyle}>Detalhes do Evento</p>
            <h1 style={titleStyle}>{event.titulo}</h1>
            <div style={metaRowStyle}>
              <span style={chipStyle}>{formattedDate}</span>
              <span style={chipStyle}>{event.horario || "Sem horario"}</span>
              <span style={chipStyle}>{event.local || "Sem local"}</span>
              {eventId ? <span style={chipStyle}>ID #{eventId}</span> : null}
            </div>
          </header>

          <div style={contentGridStyle}>
            <div style={imageWrapStyle}>
              <img
                src={event.imagem_url || "/images/emblema.png"}
                alt={event.titulo}
                style={heroImageStyle}
              />
            </div>

            <article style={infoCardStyle}>
              <h2 style={infoTitleStyle}>Informacoes do evento</h2>
              <p style={infoTextStyle}>
                {event.descricao || "Sem descricao cadastrada para este evento."}
              </p>

              <dl style={detailListStyle}>
                <div>
                  <dt style={detailLabelStyle}>Titulo</dt>
                  <dd style={detailValueStyle}>{event.titulo}</dd>
                </div>
                <div>
                  <dt style={detailLabelStyle}>Data</dt>
                  <dd style={detailValueStyle}>{formattedDate}</dd>
                </div>
                <div>
                  <dt style={detailLabelStyle}>Horario</dt>
                  <dd style={detailValueStyle}>{event.horario || "Sem horario"}</dd>
                </div>
                <div>
                  <dt style={detailLabelStyle}>Local</dt>
                  <dd style={detailValueStyle}>{event.local || "Sem local"}</dd>
                </div>
              </dl>

              <div style={ctaRowStyle}>
                <Link href="/calendario" style={pillBtnStyle}>Ver calendario</Link>
                <Link href="/painel" style={pillBtnStyle}>Voltar ao painel</Link>
              </div>
            </article>
          </div>
        </section>
      </main>
    </>
  );
}

const loaderStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
};

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "110px 20px 50px",
  color: "#f7edff",
};

const shellStyle: React.CSSProperties = {
  maxWidth: 1280,
  margin: "0 auto",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 24,
  background: "rgba(14, 6, 30, 0.88)",
  boxShadow: "0 20px 70px rgba(0,0,0,.35)",
  padding: 24,
};

const headerStyle: React.CSSProperties = {
  marginBottom: 20,
};

const kickerStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.8rem",
  letterSpacing: "0.2em",
  textTransform: "uppercase",
  color: "#d6b7fb",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: "10px 0 12px",
  fontSize: "clamp(2rem, 4vw, 3.2rem)",
  lineHeight: 1.1,
};

const metaRowStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const chipStyle: React.CSSProperties = {
  border: "1px solid rgba(203,161,255,.32)",
  borderRadius: 999,
  padding: "7px 12px",
  background: "rgba(255,255,255,.04)",
  fontSize: "0.9rem",
};

const contentGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: 18,
};

const imageWrapStyle: React.CSSProperties = {
  borderRadius: 18,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.03)",
  minHeight: 480,
};

const heroImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const infoCardStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 18,
  background: "rgba(255,255,255,0.03)",
  padding: 18,
  display: "flex",
  flexDirection: "column",
  gap: 12,
};

const infoTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.45rem",
};

const infoTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#e5d7f6",
  lineHeight: 1.75,
};

const detailListStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  margin: 0,
};

const detailLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.78rem",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "#c9a9ea",
};

const detailValueStyle: React.CSSProperties = {
  margin: "4px 0 0",
  fontSize: "1rem",
  color: "#f4ebff",
  fontWeight: 600,
};

const ctaRowStyle: React.CSSProperties = {
  marginTop: "auto",
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
};

const pillBtnStyle: React.CSSProperties = {
  border: "1px solid rgba(203,161,255,.34)",
  borderRadius: 999,
  padding: "10px 14px",
  background: "rgba(255,255,255,.05)",
  color: "#efe5ff",
  textDecoration: "none",
  fontWeight: 700,
};

const errorCardStyle: React.CSSProperties = {
  maxWidth: 800,
  margin: "0 auto",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 20,
  background: "rgba(14, 6, 30, 0.88)",
  boxShadow: "0 20px 70px rgba(0,0,0,.35)",
  padding: 24,
};
