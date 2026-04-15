"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Submission = {
  id: number;
  status: string;
  created_at: string;
  respostas: Record<string, string>;
};

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [novasCandidaturas, setNovasCandidaturas] = useState(0);
  const [ultimasCandidaturas, setUltimasCandidaturas] = useState<Submission[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, cargo")
        .eq("id", userData.user.id)
        .single();

      const cargoNormalizado = String(profile?.cargo || "").trim().toLowerCase();

      if (cargoNormalizado !== "lider" && cargoNormalizado !== "vice_lider") {
        setLoading(false);
        return;
      }

      setPermitido(true);
      setNome(profile?.nome || "Admin");
      setCargo(cargoNormalizado);

      const { data: submissions } = await supabase
        .from("recruitment_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      const lista = (submissions as Submission[]) || [];
      setUltimasCandidaturas(lista.slice(0, 5));
      setNovasCandidaturas(lista.filter((item) => item.status === "novo").length);

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <main style={pageStyle}><Spinner /></main>;
  }

  if (!permitido) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <div style={shellStyle}>
            <div style={heroCardStyle}>
              <h1 style={titleStyle}>Acesso negado</h1>
              <p style={mutedStyle}>Somente líder ou vice-líder podem acessar o painel admin.</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <div style={bgGlowTop} />
        <div style={bgGlowBottom} />

        <div style={shellStyle}>
          <div style={heroCardStyle}>
            <p style={kickerStyle}>Painel Administrativo</p>
            <h1 style={titleStyle}>Bem-vindo, {nome}</h1>
            <p style={mutedStyle}>
              Cargo atual: <strong>{cargo === "lider" ? "Líder" : "Vice-líder"}</strong>
            </p>
          </div>

          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Novas candidaturas</p>
              <p style={statValueStyle}>{novasCandidaturas}</p>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>Gerenciar formulário</p>
              <button
                style={actionButtonStyle}
                onClick={() => (window.location.href = "/admin/formulario")}
              >
                Abrir editor
              </button>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>Ver candidaturas</p>
              <button
                style={actionButtonStyle}
                onClick={() => (window.location.href = "/admin/candidaturas")}
              >
                Abrir lista
              </button>
            </div>

            <div style={statCardStyle}>
              <p style={statLabelStyle}>Outras áreas</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  style={smallButtonStyle}
                  onClick={() => (window.location.href = "/admin/eventos")}
                >
                  Eventos
                </button>
                <button
                  style={smallButtonStyle}
                  onClick={() => (window.location.href = "/admin/membros")}
                >
                  Membros
                </button>
                <button
                  style={smallButtonStyle}
                  onClick={() => (window.location.href = "/admin/usuarios")}
                >
                  Usuários
                </button>
                <button
                  style={smallButtonStyle}
                  onClick={() => (window.location.href = "/admin/parcerias")}
                >
                  Parcerias
                </button>
                <button
                  style={smallButtonStyle}
                  onClick={() => (window.location.href = "/admin/vinculos")}
                >
                  Vinculos
                </button>
              </div>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={panelHeaderStyle}>
              <h2 style={panelTitleStyle}>Últimas candidaturas</h2>
              <button
                style={ghostButtonStyle}
                onClick={() => (window.location.href = "/admin/candidaturas")}
              >
                Ver todas
              </button>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {ultimasCandidaturas.length === 0 && (
                <p style={mutedStyle}>Nenhuma candidatura recebida ainda.</p>
              )}

              {ultimasCandidaturas.map((item) => {
                const nomeCandidato =
                  item.respostas?.nome ||
                  item.respostas?.Nome ||
                  item.respostas?.instagram ||
                  "Sem identificação";

                return (
                  <div key={item.id} style={submissionCardStyle}>
                    <div>
                      <p style={submissionNameStyle}>{String(nomeCandidato)}</p>
                      <p style={submissionMetaStyle}>
                        {new Date(item.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>

                    <div
                      style={{
                        ...badgeStyle,
                        ...(item.status === "novo" ? badgeNovoStyle : badgeLidoStyle),
                      }}
                    >
                      {item.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(180deg, #07030f 0%, #120021 100%)",
  padding: "110px 24px 40px",
  color: "white",
};

const bgGlowTop: React.CSSProperties = {
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

const bgGlowBottom: React.CSSProperties = {
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

const shellStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1200px",
  margin: "0 auto",
  display: "grid",
  gap: 22,
};

const heroCardStyle: React.CSSProperties = {
  borderRadius: "28px",
  border: "1px solid rgba(201,156,255,.14)",
  background: "rgba(18,7,30,.92)",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
  padding: "28px",
};

const kickerStyle: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: ".14em",
  fontSize: ".78rem",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: "10px 0 8px",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "clamp(2rem, 4vw, 3rem)",
};

const mutedStyle: React.CSSProperties = {
  color: "#d8cceb",
  lineHeight: 1.7,
  margin: 0,
};

const statsGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const statCardStyle: React.CSSProperties = {
  borderRadius: "22px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const statLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: ".12em",
  fontSize: ".78rem",
  fontWeight: 700,
};

const statValueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "2rem",
  fontWeight: 900,
  color: "white",
};

const actionButtonStyle: React.CSSProperties = {
  height: "46px",
  borderRadius: "999px",
  border: "none",
  background: "#8b5cf6",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  padding: "0 20px",
};

const smallButtonStyle: React.CSSProperties = {
  height: "40px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  padding: "0 16px",
};

const panelStyle: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "24px",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 18,
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "1.8rem",
};

const ghostButtonStyle: React.CSSProperties = {
  height: "42px",
  padding: "0 16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  cursor: "pointer",
};

const submissionCardStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  padding: "16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
};

const submissionNameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.05rem",
  fontWeight: 700,
};

const submissionMetaStyle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#d8cceb",
  fontSize: ".92rem",
};

const badgeStyle: React.CSSProperties = {
  minWidth: 90,
  textAlign: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  fontSize: ".85rem",
  fontWeight: 700,
  textTransform: "capitalize",
};

const badgeNovoStyle: React.CSSProperties = {
  background: "rgba(168,85,247,.18)",
  border: "1px solid rgba(201,156,255,.28)",
  color: "#f3e8ff",
};

const badgeLidoStyle: React.CSSProperties = {
  background: "rgba(255,255,255,.06)",
  border: "1px solid rgba(255,255,255,.10)",
  color: "#ddd0f2",
};
