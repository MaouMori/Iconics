import Link from "next/link";
import { notFound } from "next/navigation";
import TopBar from "@/components/Topbar";
import PartnersBar from "@/components/PartnersBar";
import { getNewsBySlug } from "@/lib/newsData";
import { loadNewsItems } from "@/lib/newsStore";

export default async function NoticiaDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const news = getNewsBySlug(await loadNewsItems(), slug);

  if (!news) notFound();

  return (
    <>
      <TopBar />
      <PartnersBar />

      <main style={pageStyle}>
        <div style={adStyle}>ICONICS NEWS</div>

        <article style={articleStyle}>
          <Link href="/noticias" style={backStyle}>Voltar para noticias</Link>
          <p style={categoryStyle}>{news.category}</p>
          <h1 style={titleStyle}>{news.title}</h1>
          <p style={subtitleStyle}>{news.subtitle}</p>

          <div style={metaStyle}>
            Por <strong>{news.author}</strong> - {news.location}<br />
            {news.time}
          </div>

          <div style={shareRowStyle}>
            <span>f</span>
            <span>w</span>
            <span>compartilhar</span>
          </div>

          <details style={summaryBoxStyle}>
            <summary>Ver resumo</summary>
            <ul>
              {news.summary.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </details>

          <figure style={figureStyle}>
            <img src={news.image} alt={news.imageAlt} style={heroImageStyle} />
            <figcaption style={captionStyle}>{news.caption}</figcaption>
          </figure>

          {news.summary.map((paragraph) => (
            <p key={paragraph} style={paragraphStyle}>{paragraph}</p>
          ))}

          <p style={paragraphStyle}>
            A cobertura segue em atualizacao conforme novos registros chegam ao arquivo da fraternidade.
            O conteudo faz parte do projeto de transformar acontecimentos, comunicados e casos internos
            em uma memoria publica organizada.
          </p>
        </article>
      </main>
    </>
  );
}

export const dynamic = "force-dynamic";

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "116px 22px 80px",
  background: "linear-gradient(180deg, #07030f, #12001f 42%, #07030f)",
  color: "#f8f1ff",
};

const adStyle: React.CSSProperties = {
  maxWidth: 960,
  minHeight: 150,
  margin: "0 auto 34px",
  display: "grid",
  placeItems: "center",
  color: "#f5d0fe",
  fontWeight: 950,
  letterSpacing: ".22em",
  border: "1px solid rgba(192,132,252,.32)",
  background: "linear-gradient(135deg, rgba(88,28,135,.45), rgba(5,2,12,.9)), url('/images/portal_scene_secondary.png') center/cover",
};

const articleStyle: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
};

const backStyle: React.CSSProperties = {
  color: "#c084fc",
  textDecoration: "none",
  fontWeight: 900,
};

const categoryStyle: React.CSSProperties = {
  margin: "30px 0 8px",
  color: "#d946ef",
  textTransform: "uppercase",
  letterSpacing: ".12em",
  fontWeight: 950,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#fff",
  fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
  lineHeight: 1.02,
};

const subtitleStyle: React.CSSProperties = {
  color: "#d8cceb",
  fontSize: 20,
  lineHeight: 1.45,
};

const metaStyle: React.CSSProperties = {
  marginTop: 24,
  color: "#bba7d8",
  lineHeight: 1.7,
};

const shareRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
  margin: "28px 0",
};

const summaryBoxStyle: React.CSSProperties = {
  padding: "18px 22px",
  borderRadius: 8,
  border: "1px solid rgba(216,180,254,.26)",
  background: "rgba(255,255,255,.05)",
};

const figureStyle: React.CSSProperties = {
  margin: "40px 0 26px",
};

const heroImageStyle: React.CSSProperties = {
  width: "100%",
  maxHeight: 520,
  objectFit: "cover",
  borderRadius: 8,
  border: "1px solid rgba(192,132,252,.28)",
};

const captionStyle: React.CSSProperties = {
  color: "#a78bfa",
  marginTop: 8,
};

const paragraphStyle: React.CSSProperties = {
  color: "#f3e8ff",
  fontSize: 19,
  lineHeight: 1.75,
};
