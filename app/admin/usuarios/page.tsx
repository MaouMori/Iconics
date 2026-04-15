"use client";

import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import "../admin-dashboard.css";

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

  const carregarUsuarios = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, nome, email, cargo")
      .order("created_at", { ascending: false });

    if (error) {
      setMensagem(error.message);
      return;
    }

    setUsuarios(data || []);
  };

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
    return (
      <main className="admin-page-loader">
        <Spinner />
      </main>
    );
  }

  if (!permitido) {
    return (
      <AdminShell
        active="usuarios"
        title="Usuarios e Hierarquia"
        description="Gerencie nome, email e cargo de todos os usuarios cadastrados."
      >
        <section className="admin-denied">
          <h2>Acesso negado</h2>
          <p>Somente lideres podem alterar cargos.</p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="usuarios"
      title="Usuarios e Hierarquia"
      description="Gerencie nome, email e cargo de todos os usuarios cadastrados."
    >
      <div style={panelStyle}>
          {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}

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
    </AdminShell>
  );
}

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
