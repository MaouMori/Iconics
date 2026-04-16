"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import { hasAdminAccess, normalizeRole } from "@/lib/roles";

type Submission = {
  id: number;
  respostas: Record<string, string>;
  status: string;
  created_at: string;
};

export default function AdminCandidaturasPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function load() {
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

      const cargo = normalizeRole(profile?.cargo);
      if (!hasAdminAccess(cargo)) {
        setLoading(false);
        return;
      }

      setPermitido(true);

      const { data } = await supabase
        .from("recruitment_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      setItems((data as Submission[]) || []);
      setLoading(false);
    }

    load();
  }, []);

  async function marcarComoLida(id: number) {
    const { error } = await supabase
      .from("recruitment_submissions")
      .update({ status: "lido" })
      .eq("id", id);

    if (error) {
      setMensagem(`Erro ao atualizar: ${error.message}`);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: "lido" } : item))
    );
    setMensagem("Candidatura marcada como lida.");
  }

  async function marcarTodasComoLidas() {
    const novas = items.filter((item) => item.status === "novo");
    if (novas.length === 0) return;

    const { error } = await supabase
      .from("recruitment_submissions")
      .update({ status: "lido" })
      .eq("status", "novo");

    if (error) {
      setMensagem(`Erro ao atualizar: ${error.message}`);
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.status === "novo" ? { ...item, status: "lido" } : item))
    );
    setMensagem("Todas as candidaturas foram marcadas como lidas.");
  }

  const totalNovas = items.filter((item) => item.status === "novo").length;

  if (loading) {
    return <main style={pageStyle}><Spinner /></main>;
  }

  if (!permitido) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>Acesso negado.</main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <div style={shellStyle}>
          <div style={headerRowStyle}>
            <div>
              <h1 style={titleStyle}>Candidaturas recebidas</h1>
              {totalNovas > 0 && (
                <p style={{ margin: "4px 0 0", color: "#d8b4fe" }}>
                  {totalNovas} nova{totalNovas > 1 ? "s" : ""}
                </p>
              )}
            </div>

            {totalNovas > 0 && (
              <button style={bulkButtonStyle} onClick={marcarTodasComoLidas}>
                Marcar todas como lidas
              </button>
            )}
          </div>

          {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}

          <div style={{ display: "grid", gap: 16 }}>
            {items.map((item) => {
              const isNovo = item.status === "novo";

              return (
                <div
                  key={item.id}
                  style={{
                    ...cardStyle,
                    ...(isNovo ? cardNovoStyle : {}),
                  }}
                >
                  <div style={cardHeaderStyle}>
                    <p style={smallStyle}>
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </p>

                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={isNovo ? badgeNovoStyle : badgeLidoStyle}>
                        {isNovo ? "Nova" : "Lida"}
                      </span>

                      {isNovo && (
                        <button
                          style={markReadBtnStyle}
                          onClick={() => marcarComoLida(item.id)}
                        >
                          Marcar como lida
                        </button>
                      )}
                    </div>
                  </div>

                  {Object.entries(item.respostas || {}).map(([key, value]) => (
                    <p key={key} style={textStyle}>
                      <strong>{key}:</strong> {String(value)}
                    </p>
                  ))}
                </div>
              );
            })}

            {items.length === 0 && <p>Nenhuma candidatura recebida.</p>}
          </div>
        </div>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "110px 24px 40px",
  color: "white",
};

const shellStyle: React.CSSProperties = {
  maxWidth: "1100px",
  margin: "0 auto",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 20,
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "2.2rem",
};

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "20px",
};

const cardNovoStyle: React.CSSProperties = {
  borderLeft: "3px solid #a855f7",
  background: "rgba(168,85,247,0.06)",
};

const cardHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 8,
};

const smallStyle: React.CSSProperties = {
  color: "#c99cff",
  margin: 0,
};

const textStyle: React.CSSProperties = {
  color: "#e9d5ff",
  lineHeight: 1.7,
  margin: "6px 0",
};

const badgeNovoStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  fontSize: "0.85rem",
  fontWeight: 700,
  background: "rgba(168,85,247,0.18)",
  border: "1px solid rgba(201,156,255,0.28)",
  color: "#f3e8ff",
};

const badgeLidoStyle: React.CSSProperties = {
  padding: "6px 14px",
  borderRadius: 999,
  fontSize: "0.85rem",
  fontWeight: 700,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  color: "#ddd0f2",
};

const markReadBtnStyle: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid rgba(168,85,247,0.3)",
  background: "rgba(168,85,247,0.12)",
  color: "#e9d5ff",
  fontSize: "0.85rem",
  fontWeight: 700,
  cursor: "pointer",
};

const bulkButtonStyle: React.CSSProperties = {
  height: 42,
  padding: "0 18px",
  borderRadius: 999,
  border: "none",
  background: "#8b5cf6",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
