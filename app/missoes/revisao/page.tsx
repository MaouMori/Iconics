"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import "../missoes.css";

type MissionClaim = {
  id: number;
  status: string;
  proof_text?: string | null;
  proof_files?: { name?: string; url?: string; type?: string }[] | null;
  mission_title?: string;
  mission_reward?: number;
  profile_name?: string;
  profile_avatar_url?: string | null;
  profile_cargo?: string | null;
};

type Payload = {
  profile: { canManage: boolean };
  adminClaims: MissionClaim[];
};

export default function RevisaoMissoesPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [details, setDetails] = useState<MissionClaim | null>(null);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function load() {
    const token = await getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const response = await fetch("/api/missions", { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.error || "Nao foi possivel carregar a revisao.");
      setLoading(false);
      return;
    }
    setPayload(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function reviewClaim(claimId: number, action: "approve" | "reject") {
    setActionId(claimId);
    setMessage("");
    try {
      const token = await getToken();
      const response = await fetch(`/api/missions/claims/${claimId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Nao foi possivel revisar.");
      setMessage(action === "approve" ? "Missao aprovada e XP entregue." : "Missao recusada.");
      setDetails(null);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel revisar.");
    }
    setActionId(null);
  }

  const pendingClaims = (payload?.adminClaims || []).filter((claim) => claim.status === "submitted");

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="missions-page missions-loading"><Spinner texto="Carregando revisao..." /></main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="missions-page">
        <section className="missions-shell">
          {message ? <div className="missions-alert">{message}</div> : null}
          <section className="missions-board missions-list clean-page-panel">
            {!payload?.profile?.canManage ? (
              <div className="mission-empty">Apenas lideranca pode revisar missoes.</div>
            ) : pendingClaims.length === 0 ? (
              <div className="mission-empty">Nenhuma missao aguardando aprovacao.</div>
            ) : (
              pendingClaims.map((claim) => (
                <article key={claim.id} className="review-card">
                  <div className="review-member">
                    <img src={claim.profile_avatar_url || "/images/iconics_emblem_main.png"} alt={claim.profile_name || "Membro"} />
                    <div>
                      <h2>{claim.mission_title}</h2>
                      <p>{claim.profile_name} enviou comprovantes para revisao.</p>
                      <span>{claim.profile_cargo || "membro"} - +{claim.mission_reward || 0} XP</span>
                    </div>
                  </div>
                  <div className="mission-modal-actions">
                    <button type="button" onClick={() => setDetails(claim)}>Ver detalhes</button>
                    <button type="button" onClick={() => reviewClaim(claim.id, "approve")} disabled={actionId === claim.id}>Aprovar</button>
                    <button type="button" onClick={() => reviewClaim(claim.id, "reject")} disabled={actionId === claim.id}>Recusar</button>
                  </div>
                </article>
              ))
            )}
          </section>
        </section>
      </main>

      {details ? (
        <div className="mission-modal">
          <section className="mission-modal-panel">
            <h2>{details.mission_title || `Envio #${details.id}`}</h2>
            <p><strong>Enviado por:</strong> {details.profile_name || "Membro Iconics"}</p>
            <p><strong>Texto enviado:</strong> {details.proof_text || "Sem texto."}</p>
            <div className="proof-preview-grid">
              {(details.proof_files || []).map((file) => (
                <a key={file.url} href={file.url} target="_blank" rel="noreferrer">
                  {file.type?.startsWith("image/") ? <img src={file.url} alt={file.name || "Comprovante"} /> : null}
                  <span>{file.name || "Abrir comprovante"}</span>
                </a>
              ))}
            </div>
            <div className="mission-modal-actions">
              <button type="button" onClick={() => setDetails(null)}>Fechar</button>
              <button type="button" onClick={() => reviewClaim(details.id, "approve")}>Aprovar</button>
              <button type="button" onClick={() => reviewClaim(details.id, "reject")}>Recusar</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
