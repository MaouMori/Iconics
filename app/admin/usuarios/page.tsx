"use client";

import TopBar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type ProfileRow = {
  id: string;
  nome: string | null;
  email: string | null;
  cargo: string;
};

export default function AdminUsuariosPage() {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [usuarios, setUsuarios] = useState<ProfileRow[]>([]);

  useEffect(() => {
    async function init() {
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

      if (profile?.cargo === "lider") {
        setPermitido(true);
        await carregarUsuarios();
      }

      setLoading(false);
    }

    init();
  }, []);

  async function carregarUsuarios() {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, email, cargo")
      .order("created_at", { ascending: false });

    if (error) {
      setMensagem(error.message);
      return;
    }

    setUsuarios(data || []);
  }

  async function alterarCargo(id: string, novoCargo: string) {
    setMensagem("");

    const { error } = await supabase
      .from("profiles")
      .update({ cargo: novoCargo })
      .eq("id", id);

    if (error) {
      setMensagem(error.message);
      return;
    }

    setMensagem("Cargo atualizado com sucesso.");
    await carregarUsuarios();
  }

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
            <p style={mutedText}>Somente líderes podem alterar cargos.</p>
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
              <h1 style={titleStyle}>Usuários e Hierarquia</h1>
              <p style={mutedText}>
                Gerencie nome, e-mail e cargo de todos os usuários cadastrados.
              </p>
            </div>

            <button
              style={primaryButton}
              onClick={() => (window.location.href = "/admin")}
            >
              Voltar
            </button>
          </div>

          {mensagem && <p style={messageStyle}>{mensagem}</p>}

          <div style={tableWrap}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Nome</th>
                  <th style={thStyle}>E-mail</th>
                  <th style={thStyle}>Cargo atual</th>
                  <th style={thStyle}>Alterar cargo</th>
                </tr>
              </thead>

              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id}>
                    <td style={tdStyle}>{user.nome || "Sem nome"}</td>
                    <td style={tdStyle}>{user.email || "Sem e-mail"}</td>
                    <td style={tdStyle}>
                      <span style={badgeStyle(user.cargo)}>{user.cargo}</span>
                    </td>
                    <td style={tdStyle}>
                      <select
                        style={selectStyle}
                        value={user.cargo}
                        onChange={(e) => alterarCargo(user.id, e.target.value)}
                      >
                        <option value="membro">membro</option>
                        <option value="veterano">veterano</option>
                        <option value="vice_lider">vice_lider</option>
                        <option value="lider">lider</option>
                      </select>
                    </td>
                  </tr>
                ))}

                {usuarios.length === 0 && (
                  <tr>
                    <td colSpan={4} style={emptyStyle}>
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
  marginBottom: "24px",
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

const messageStyle: React.CSSProperties = {
  marginBottom: "18px",
  color: "#e9d5ff",
};

const primaryButton: React.CSSProperties = {
  height: "46px",
  padding: "0 18px",
  borderRadius: "999px",
  border: "none",
  background: "#8b5cf6",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const tableWrap: React.CSSProperties = {
  overflowX: "auto",
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.03)",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "860px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "16px",
  color: "#d8b4fe",
  borderBottom: "1px solid rgba(255,255,255,.08)",
  fontSize: "0.95rem",
};

const tdStyle: React.CSSProperties = {
  padding: "16px",
  borderBottom: "1px solid rgba(255,255,255,.06)",
  color: "white",
  verticalAlign: "middle",
};

const selectStyle: React.CSSProperties = {
  height: "42px",
  minWidth: "180px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.05)",
  color: "white",
  padding: "0 12px",
  outline: "none",
};

const emptyStyle: React.CSSProperties = {
  padding: "22px",
  textAlign: "center",
  color: "#d8cceb",
};

function badgeStyle(cargo: string): React.CSSProperties {
  const map: Record<string, string> = {
    lider: "#f4c542",
    vice_lider: "#a855f7",
    veterano: "#38bdf8",
    membro: "#cbd5e1",
  };

  const color = map[cargo] || "#cbd5e1";

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "110px",
    padding: "8px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,.05)",
    border: `1px solid ${color}55`,
    color,
    fontWeight: 700,
    textTransform: "capitalize",
  };
}