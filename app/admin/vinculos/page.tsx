"use client";

import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { hasAdminAccess, normalizeRole } from "@/lib/roles";
import { useEffect, useState } from "react";
import "../admin-dashboard.css";

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

      const cargo = normalizeRole(profile?.cargo);
      const isAllowed = hasAdminAccess(cargo);
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
      <AdminShell
        active="vinculos"
        title="Solicitacoes Pendentes de Vinculos"
        description="Aprove ou rejeite vinculacoes de card. Aprovado libera edicao apenas do card vinculado."
      >
        <div style={contentLoadingStyle}>
          <Spinner texto="Carregando aprovacoes..." />
        </div>
      </AdminShell>
    );
  }

  if (!allowed) {
    return (
      <AdminShell
        active="vinculos"
        title="Solicitacoes Pendentes"
        description="Aprove ou rejeite vinculacoes de card para liberar edicao ao membro correto."
      >
        <section className="admin-denied">
          <h2>Acesso negado</h2>
          <p>Somente lideranca ou staff pode aprovar vinculos.</p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="vinculos"
      title="Solicitacoes Pendentes de Vinculos"
      description="Aprove ou rejeite vinculacoes de card. Aprovado libera edicao apenas do card vinculado."
    >
      <section style={panelStyle}>
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
    </AdminShell>
  );
}

const panelStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  borderRadius: 22,
  border: "1px solid rgba(201,156,255,.16)",
  background: "rgba(11,3,20,.88)",
  padding: 22,
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

const contentLoadingStyle: React.CSSProperties = {
  minHeight: "46vh",
  display: "grid",
  placeItems: "center",
};
