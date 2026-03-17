"use client";

import TopBar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [cargo, setCargo] = useState("");

  useEffect(() => {
    async function verificar() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("cargo")
        .eq("id", userData.user.id)
        .single();

      if (profile?.cargo === "lider" || profile?.cargo === "vice_lider") {
        setPermitido(true);
        setCargo(profile.cargo);
      }

      setLoading(false);
    }

    verificar();
  }, []);

  if (loading) {
    return <main style={pageStyle}>Carregando...</main>;
  }

  if (!permitido) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <div style={panelStyle}>
            <h1 style={titleStyle}>Acesso negado</h1>
            <p style={mutedText}>
              Somente vice-líder ou líder podem acessar esta área.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <div style={panelStyle}>
          <div style={headerRow}>
            <div>
              <p style={eyebrowStyle}>Administração da Fraternidade</p>
              <h1 style={titleStyle}>Painel Iconics</h1>
              <p style={mutedText}>
                Gerencie eventos, membros e hierarquia do sistema.
              </p>
            </div>

            <div style={badgeStyle(cargo)}>
              {cargo === "lider" ? "Líder" : "Vice-líder"}
            </div>
          </div>

          <div style={gridStyle}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Eventos</h3>
              <p style={cardText}>
                Crie e organize os eventos que aparecem no calendário do site.
              </p>
              <button
                style={buttonStyle}
                onClick={() => (window.location.href = "/admin/eventos")}
              >
                Gerenciar eventos
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={cardTitle}>Membros</h3>
              <p style={cardText}>
                Cadastre, edite e exclua cards de membros exibidos na home.
              </p>
              <button
                style={buttonStyle}
                onClick={() => (window.location.href = "/admin/membros")}
              >
                Gerenciar membros
              </button>
            </div>

            <div style={cardStyle}>
              <h3 style={cardTitle}>Usuários</h3>
              <p style={cardText}>
                Veja todos os usuários cadastrados e altere os cargos da hierarquia.
              </p>
              <button
                style={buttonStyle}
                onClick={() => (window.location.href = "/admin/usuarios")}
              >
                Gerenciar usuários
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "28px",
  color: "white",
};

const panelStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  marginTop: "26px",
  borderRadius: "26px",
  border: "1px solid rgba(201,156,255,.12)",
  background: "linear-gradient(180deg, rgba(18,7,30,.92), rgba(10,3,20,.92))",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
  padding: "28px",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: "28px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: "0.78rem",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0 8px",
  fontFamily: 'Georgia,"Times New Roman",serif',
  fontSize: "clamp(2rem, 4vw, 3rem)",
};

const mutedText: React.CSSProperties = {
  margin: 0,
  color: "#d8cceb",
  lineHeight: 1.7,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: "18px",
};

const cardStyle: React.CSSProperties = {
  borderRadius: "22px",
  padding: "22px",
  background: "rgba(255,255,255,.03)",
  border: "1px solid rgba(255,255,255,.08)",
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.35rem",
};

const cardText: React.CSSProperties = {
  marginTop: "10px",
  color: "#d8cceb",
  lineHeight: 1.7,
};

const buttonStyle: React.CSSProperties = {
  marginTop: "18px",
  height: "46px",
  padding: "0 20px",
  borderRadius: "999px",
  border: "none",
  background: "#8b5cf6",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

function badgeStyle(cargo: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "130px",
    padding: "10px 16px",
    borderRadius: "999px",
    background: "rgba(255,255,255,.05)",
    border: `1px solid ${cargo === "lider" ? "#f4c54255" : "#a855f755"}`,
    color: cargo === "lider" ? "#f4c542" : "#a855f7",
    fontWeight: 700,
  };
}