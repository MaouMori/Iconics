import Link from "next/link";
import TopBar from "@/components/Topbar";
import PartnersBar from "@/components/PartnersBar";
import { getPublishedNews } from "@/lib/newsData";
import { loadNewsItems } from "@/lib/newsStore";

export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const news = getPublishedNews(await loadNewsItems());
  const mainNews = news.find((item) => item.featured) || news[0];
  const sideNews = news.filter((item) => item.slug !== mainNews?.slug).slice(0, 2);
  const listNews = news.filter((item) => item.slug !== mainNews?.slug);

  if (!mainNews) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <section style={leadCardStyle}>
            <h1 style={leadTitleStyle}>Nenhuma noticia publicada</h1>
            <p style={leadTextStyle}>Crie a primeira noticia no painel administrativo.</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <PartnersBar />

      <main style={pageStyle}>
        <header style={brandBarStyle}>
          <Link href="/" style={menuLinkStyle}>ICONICS</Link>
          <Link href="/noticias" style={brandStyle}>iNews</Link>
          <div style={searchStyle}>Buscar no arquivo</div>
        </header>

        <section style={adStyle}>
          <span>Arquivo da fraternidade</span>
          <strong>Noticias, casos e comunicados oficiais da ICONICS</strong>
        </section>

        <section style={leadGridStyle}>
          <Link href={`/noticias/${mainNews.slug}`} style={leadCardStyle}>
            <span style={categoryStyle}>{mainNews.category}</span>
            <h1 style={leadTitleStyle}>{mainNews.title}</h1>
            <p style={leadTextStyle}>{mainNews.subtitle}</p>
            <ul style={leadListStyle}>
              {mainNews.summary.slice(0, 2).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </Link>

          <div style={sideGridStyle}>
            {sideNews.map((item) => (
              <Link key={item.slug} href={`/noticias/${item.slug}`} style={{ ...imageCardStyle, backgroundImage: `linear-gradient(180deg, rgba(5,2,12,.2), rgba(5,2,12,.86)), url(${item.image})` }}>
                <span style={imageBadgeStyle}>{item.category}</span>
                <h2 style={imageTitleStyle}>{item.title}</h2>
              </Link>
            ))}
          </div>
        </section>

        <section style={contentGridStyle}>
          <div style={feedStyle}>
            {listNews.map((item) => (
              <Link key={item.slug} href={`/noticias/${item.slug}`} style={feedItemStyle}>
                <img src={item.image} alt={item.imageAlt} style={feedImageStyle} />
                <div>
                  <span style={feedKickerStyle}>{item.category}</span>
                  <h2 style={feedTitleStyle}>{item.title}</h2>
                  <p style={feedTextStyle}>{item.subtitle}</p>
                  <small style={feedMetaStyle}>{item.time} - {item.location}</small>
                </div>
              </Link>
            ))}
          </div>

          <aside style={asideStyle}>
            <h2 style={asideTitleStyle}>Viu isso?</h2>
            {news.slice(0, 4).map((item) => (
              <Link key={item.slug} href={`/noticias/${item.slug}`} style={asideItemStyle}>
                <span>{item.title}</span>
                <img src={item.image} alt="" style={asideImageStyle} />
              </Link>
            ))}
          </aside>
        </section>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  padding: "118px 22px 80px",
  color: "#f8f1ff",
  background: "radial-gradient(circle at top, rgba(126,34,206,.32), transparent 36%), linear-gradient(180deg, #07030f, #11001e 48%, #07030f)",
};

const brandBarStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto 34px",
  minHeight: 62,
  display: "grid",
  gridTemplateColumns: "1fr auto 1fr",
  alignItems: "center",
  gap: 18,
  padding: "0 22px",
  borderRadius: 8,
  background: "linear-gradient(90deg, rgba(88,28,135,.95), rgba(147,51,234,.92), rgba(49,11,86,.95))",
  boxShadow: "0 0 35px rgba(168,85,247,.28)",
};

const menuLinkStyle: React.CSSProperties = {
  color: "#fff",
  fontWeight: 900,
  textDecoration: "none",
  letterSpacing: ".1em",
};

const brandStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 42,
  fontWeight: 950,
  textDecoration: "none",
  letterSpacing: "-.03em",
};

const searchStyle: React.CSSProperties = {
  justifySelf: "end",
  padding: "10px 18px",
  borderRadius: 8,
  background: "rgba(0,0,0,.28)",
  color: "#f5d0fe",
  fontWeight: 800,
};

const adStyle: React.CSSProperties = {
  maxWidth: 860,
  minHeight: 160,
  margin: "0 auto 38px",
  display: "grid",
  placeItems: "center",
  gap: 8,
  textAlign: "center",
  border: "1px solid rgba(192,132,252,.35)",
  background: "linear-gradient(135deg, rgba(12,5,22,.94), rgba(88,28,135,.34)), url('/images/portal_scene_main.png') center/cover",
};

const leadGridStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto 44px",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.25fr) minmax(320px, .95fr)",
  gap: 18,
};

const leadCardStyle: React.CSSProperties = {
  minHeight: 420,
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  padding: 28,
  borderRadius: 8,
  border: "1px solid rgba(216,180,254,.22)",
  background: "rgba(255,255,255,.05)",
  color: "#fff",
  textDecoration: "none",
};

const categoryStyle: React.CSSProperties = {
  color: "#c084fc",
  textTransform: "uppercase",
  letterSpacing: ".12em",
  fontWeight: 900,
};

const leadTitleStyle: React.CSSProperties = {
  margin: "18px 0 12px",
  color: "#d946ef",
  fontSize: "clamp(2.2rem, 5vw, 4.4rem)",
  lineHeight: .95,
};

const leadTextStyle: React.CSSProperties = {
  maxWidth: 720,
  color: "#eadcff",
  fontSize: 18,
};

const leadListStyle: React.CSSProperties = {
  margin: "14px 0 0",
  paddingLeft: 20,
  color: "#f0abfc",
};

const sideGridStyle: React.CSSProperties = {
  display: "grid",
  gap: 14,
};

const imageCardStyle: React.CSSProperties = {
  minHeight: 203,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  padding: 20,
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,.1)",
  color: "#fff",
  textDecoration: "none",
  backgroundSize: "cover",
  backgroundPosition: "center",
};

const imageBadgeStyle: React.CSSProperties = {
  width: "fit-content",
  padding: "5px 9px",
  borderRadius: 999,
  background: "rgba(147,51,234,.75)",
  fontWeight: 900,
};

const imageTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 27,
  lineHeight: 1.05,
};

const contentGridStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 340px",
  gap: 28,
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

const asideStyle: React.CSSProperties = {
  alignSelf: "start",
  borderRadius: 8,
  border: "1px solid rgba(216,180,254,.2)",
  background: "rgba(255,255,255,.05)",
  overflow: "hidden",
};

const asideTitleStyle: React.CSSProperties = {
  margin: 0,
  padding: 18,
  borderBottom: "1px solid rgba(255,255,255,.12)",
};

const asideItemStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 78px",
  gap: 12,
  padding: 18,
  borderBottom: "1px solid rgba(255,255,255,.1)",
  color: "#f5d0fe",
  textDecoration: "none",
  fontWeight: 900,
};

const asideImageStyle: React.CSSProperties = {
  width: 78,
  height: 62,
  objectFit: "cover",
  borderRadius: 8,
};
