import Link from "next/link";

export default function PaginaIndisponivelPage() {
  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <p style={kickerStyle}>ICONICS</p>
        <h1 style={titleStyle}>Pagina indisponivel</h1>
        <p style={textStyle}>
          Esta area foi temporariamente desativada pela administracao.
        </p>
        <Link href="/" style={linkStyle}>Voltar ao site</Link>
      </section>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  padding: 24,
  background: "radial-gradient(circle at top, rgba(168,85,247,.24), transparent 34%), #05020a",
  color: "#fff",
};

const cardStyle: React.CSSProperties = {
  width: "min(92vw, 620px)",
  border: "1px solid rgba(168,85,247,.45)",
  background: "rgba(8,2,16,.86)",
  boxShadow: "0 0 48px rgba(168,85,247,.18)",
  padding: 32,
  textAlign: "center",
};

const kickerStyle: React.CSSProperties = {
  margin: 0,
  color: "#c084fc",
  letterSpacing: ".16em",
  textTransform: "uppercase",
};

const titleStyle: React.CSSProperties = {
  margin: "10px 0",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "clamp(2.2rem, 6vw, 4rem)",
};

const textStyle: React.CSSProperties = {
  color: "#d8cceb",
  lineHeight: 1.7,
};

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  marginTop: 14,
  color: "#fff",
  background: "linear-gradient(90deg, #581c87, #9333ea)",
  padding: "12px 18px",
  textDecoration: "none",
};
