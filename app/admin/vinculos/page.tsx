"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type PendingRequest = {
  id: number;
  member_card_id: number;
  member_name: string;
  requested_by_profile_id: string | null;
  requested_by_discord_id: number | null;
  requester_profile_name: string | null;
  requested_by_name: string | null;
  request_source: string;
  requested_at: string;
};

export default function AdminVinculosPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [items, setItems] = useState<PendingRequest[]>([]);
  const [processingId, setProcessingId] = useState<number | null>(null);

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("cargo")
        .eq("id", userId)
        .maybeSingle();

      const cargo = String(profile?.cargo || "").trim().toLowerCase();
      const isAllowed = cargo === "lider" || cargo === "vice_lider" || cargo === "admin" || cargo === "staff";
      setAllowed(isAllowed);
      setToken(accessToken);

      if (isAllowed) {
        const response = await fetch("/api/member-links/pending", {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: "no-store",
        });

        const payload = await response.json();
        if (response.ok) {
          setItems(payload.requests || []);
          setError("");
        } else {
          setError(payload.error || "Erro ao carregar pendências.");
        }
      }

      setLoading(false);
    }

    init();
  }, []);

  async function loadPending(accessToken = token) {
    const response = await fetch("/api/member-links/pending", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Erro ao carregar pendências.");
      return;
    }

    setItems(payload.requests || []);
    setError("");
  }

  async function processRequest(requestId: number, action: "approve" | "reject") {
    setProcessingId(requestId);
    setError("");
    setMessage("");

    const response = await fetch("/api/member-links/approve", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        requestId,
        action,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Erro ao processar solicitação.");
      setProcessingId(null);
      return;
    }

    setMessage(action === "approve" ? "Solicitação aprovada." : "Solicitação rejeitada.");
    await loadPending();
    setProcessingId(null);
  }

  if (loading) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <Spinner texto="Carregando aprovações..." />
        </main>
      </>
    );
  }

  if (!allowed) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <section style={panelStyle}>
            <h1 style={titleStyle}>Acesso negado</h1>
            <p style={muted}>Somente liderança/staff pode aprovar vínculos.</p>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <section style={panelStyle}>
          <div style={headerStyle}>
            <div>
              <p style={kicker}>Aprovação de Vínculos</p>
              <h1 style={titleStyle}>Solicitações Pendentes</h1>
              <p style={muted}>
                Aprove ou rejeite vinculações de card. Aprovado libera edição apenas do card vinculado.
              </p>
            </div>
            <button style={secondaryBtn} onClick={() => (window.location.href = "/admin")}>
              Voltar
            </button>
          </div>

          {message && <Toast mensagem={message} onClose={() => setMessage("")} />}
          {error && <Toast mensagem={error} onClose={() => setError("")} />}

          {items.length === 0 && <p style={muted}>Nenhuma solicitação pendente.</p>}

          <div style={{ display: "grid", gap: 10 }}>
            {items.map((item) => (
              <div key={item.id} style={itemCard}>
                <div>
                  <p style={line}><strong>Pedido:</strong> #{item.id}</p>
                  <p style={line}><strong>Card:</strong> {item.member_name} (ID {item.member_card_id})</p>
                  <p style={line}>
                    <strong>Solicitante:</strong>{" "}
                    {item.requester_profile_name || item.requested_by_name || "Desconhecido"}
                    {item.requested_by_discord_id ? ` | Discord ID: ${item.requested_by_discord_id}` : ""}
                  </p>
                  <p style={line}>
                    <strong>Origem:</strong> {item.request_source} |{" "}
                    {new Date(item.requested_at).toLocaleString("pt-BR")}
                  </p>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    style={primaryBtn}
                    onClick={() => processRequest(item.id, "approve")}
                    disabled={processingId === item.id}
                  >
                    Aprovar
                  </button>
                  <button
                    style={dangerBtn}
                    onClick={() => processRequest(item.id, "reject")}
                    disabled={processingId === item.id}
                  >
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "110px 20px 40px",
  color: "#fff",
};

const panelStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  borderRadius: 22,
  border: "1px solid rgba(201,156,255,.16)",
  background: "rgba(11,3,20,.88)",
  padding: 22,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 16,
};

const kicker: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: ".78rem",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
};

const muted: React.CSSProperties = { margin: 0, color: "#d8cceb", lineHeight: 1.6 };
const line: React.CSSProperties = { margin: "4px 0", color: "#f0e6ff" };
const itemCard: React.CSSProperties = {
  border: "1px solid rgba(201,156,255,.2)",
  borderRadius: 12,
  padding: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};
const primaryBtn: React.CSSProperties = { borderRadius: 10, border: "1px solid rgba(114,247,159,.4)", background: "rgba(43,124,78,.45)", color: "#fff", padding: "8px 12px", fontWeight: 700 };
const dangerBtn: React.CSSProperties = { borderRadius: 10, border: "1px solid rgba(255,122,122,.45)", background: "rgba(130,32,32,.45)", color: "#fff", padding: "8px 12px", fontWeight: 700 };
const secondaryBtn: React.CSSProperties = { borderRadius: 10, border: "1px solid rgba(201,156,255,.35)", background: "rgba(255,255,255,.05)", color: "#fff", padding: "8px 12px" };
