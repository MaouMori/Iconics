"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import "./missoes.css";

type MissionClaim = {
  id: number;
  mission_id: number;
  status: string;
  proof_text?: string | null;
  proof_files?: { name?: string; url?: string; type?: string }[] | null;
  accepted_at: string;
};

type Mission = {
  id: number;
  title: string;
  summary: string;
  details?: string | null;
  category: string;
  difficulty: string;
  required_level: number;
  reward_influence: number;
  time_limit_hours: number;
  status: string;
  tags?: string[];
  claim?: MissionClaim | null;
  isLocked: boolean;
  lockedReason: string;
};

type MissionProfile = {
  level: number;
  canManage: boolean;
};

type Payload = {
  profile: MissionProfile;
  missions: Mission[];
  claims: MissionClaim[];
  usingFallback?: boolean;
};

const tabs = [
  { id: "available", label: "Disponiveis" },
  { id: "active", label: "Em andamento" },
  { id: "submitted", label: "Finalizadas" },
  { id: "secret", label: "Secretas" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function MissoesPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [tab, setTab] = useState<TabId>("available");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [proofClaim, setProofClaim] = useState<MissionClaim | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofFiles, setProofFiles] = useState<{ name?: string; url?: string; type?: string }[]>([]);
  const [uploadingProof, setUploadingProof] = useState(false);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function loadMissions() {
    const token = await getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch("/api/missions", { headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.error || "Nao foi possivel carregar o mural de missoes.");
      setLoading(false);
      return;
    }

    setPayload(data);
    setLoading(false);
  }

  useEffect(() => {
    loadMissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function apiAction(url: string, options: RequestInit = {}) {
    const token = await getToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Operacao nao concluida.");
    return data;
  }

  async function uploadMissionFile(file: File) {
    const token = await getToken();
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", "proof");
    const response = await fetch("/api/missions/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Falha no upload.");
    return data.file as { name: string; url: string; type: string };
  }

  async function acceptMission(mission: Mission) {
    setActionId(mission.id);
    setMessage("");
    try {
      await apiAction(`/api/missions/${mission.id}/accept`, { method: "POST" });
      setMessage("Missao aceita. O pergaminho saiu do mural disponivel.");
      setSelectedMission(null);
      await loadMissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel aceitar esta missao.");
    }
    setActionId(null);
  }

  async function submitProof() {
    if (!proofClaim) return;
    setActionId(proofClaim.id);
    setMessage("");
    try {
      await apiAction(`/api/missions/claims/${proofClaim.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ proof_text: proofText, proof_links: [], proof_files: proofFiles }),
      });
      setProofClaim(null);
      setProofText("");
      setProofFiles([]);
      setSelectedMission(null);
      setTab("submitted");
      setMessage("Comprovantes enviados para a revisao da lideranca.");
      await loadMissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel finalizar a missao.");
    }
    setActionId(null);
  }

  const missions = useMemo(() => payload?.missions || [], [payload?.missions]);
  const claims = useMemo(() => payload?.claims || [], [payload?.claims]);
  const activeClaims = claims.filter((claim) => claim.status === "accepted");
  const submittedClaims = claims.filter((claim) => claim.status === "submitted" || claim.status === "completed" || claim.status === "rejected");

  const visibleMissions = useMemo(() => {
    if (tab === "active") {
      const ids = new Set(activeClaims.map((claim) => Number(claim.mission_id)));
      return missions.filter((mission) => ids.has(Number(mission.id)));
    }
    if (tab === "submitted") {
      const ids = new Set(submittedClaims.map((claim) => Number(claim.mission_id)));
      return missions.filter((mission) => ids.has(Number(mission.id)));
    }
    if (tab === "secret") return missions.filter((mission) => mission.status === "secret");
    const claimedMissionIds = new Set(
      claims
        .filter((claim) => claim.status === "accepted" || claim.status === "submitted" || claim.status === "completed")
        .map((claim) => Number(claim.mission_id))
    );
    return missions.filter((mission) => mission.status !== "secret" && !claimedMissionIds.has(Number(mission.id)));
  }, [activeClaims, claims, missions, submittedClaims, tab]);

  const detailsMission = selectedMission || visibleMissions[0] || null;
  const selectedClaim = detailsMission?.claim || claims.find((claim) => Number(claim.mission_id) === Number(detailsMission?.id)) || null;

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="missions-page missions-loading">
          <Spinner texto="Carregando mural de missoes..." />
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="missions-page medieval-missions-page">
        <section className="medieval-board-shell">
          <div className="mission-side-banner" aria-hidden="true">
            <span>ICONICS</span>
          </div>
          <header className="medieval-sign">
            <span>A influencia comeca aqui</span>
            <h1>Painel de Missoes</h1>
          </header>

          {message ? <div className="missions-alert">{message}</div> : null}
          {payload?.usingFallback ? <div className="missions-alert">Aplique a migracao de missoes no Supabase para liberar todas as acoes.</div> : null}

          <section className="medieval-mural-layout">
            <div className="quest-board">
              <div className="quest-board-rail left" />
              <div className="quest-board-rail right" />
              <span className="quest-red-thread thread-one" aria-hidden="true" />
              <span className="quest-red-thread thread-two" aria-hidden="true" />
              <span className="quest-red-thread thread-three" aria-hidden="true" />
              <div className="quest-scroll-grid">
                {visibleMissions.length === 0 ? (
                  <div className="quest-empty">Nenhum pergaminho neste mural.</div>
                ) : (
                  visibleMissions.map((mission, index) => (
                    <button
                      key={mission.id}
                      type="button"
                      className={`quest-paper ${selectedMission?.id === mission.id ? "selected" : ""} ${mission.isLocked ? "locked" : ""}`}
                      onClick={() => setSelectedMission(mission)}
                      style={{ transform: `rotate(${[-2, 1.5, -1, 2, -1.5, 1][index % 6]}deg) ${selectedMission?.id === mission.id ? "scale(1.08)" : ""}` }}
                    >
                      <span className="quest-pin" />
                      <span className="quest-icon">{mission.status === "secret" || mission.isLocked ? "?" : getQuestIcon(mission.category)}</span>
                      <strong>{mission.status === "secret" && mission.isLocked ? "???" : mission.title}</strong>
                      <small>{mission.isLocked ? mission.lockedReason : mission.summary}</small>
                      <b>+{mission.reward_influence} XP</b>
                      <em>{mission.difficulty}</em>
                    </button>
                  ))
                )}
              </div>
            </div>

            <aside className={`quest-detail ${detailsMission ? "open" : ""}`}>
              {detailsMission ? (
                <>
                  <span className="wax-seal">ICONICS</span>
                  <div className="quest-eye">◉</div>
                  <h2>{detailsMission.title}</h2>
                  <span className="quest-rarity">Missao {detailsMission.difficulty}</span>
                  <p>{detailsMission.isLocked ? detailsMission.lockedReason : detailsMission.details || detailsMission.summary}</p>
                  <div className="quest-objectives">
                    <h3>Objetivos</h3>
                    {(detailsMission.tags?.length ? detailsMission.tags : [detailsMission.category, "comprovante", "influencia"]).map((item) => (
                      <span key={item}>{item}</span>
                    ))}
                  </div>
                  <div className="quest-reward">
                    <span>Recompensa</span>
                    <strong>+{detailsMission.reward_influence} XP</strong>
                  </div>
                  <div className="quest-detail-row"><span>Tempo limite</span><b>{detailsMission.time_limit_hours} horas</b></div>
                  <div className="quest-detail-row"><span>Nivel</span><b>{detailsMission.required_level}</b></div>
                  <div className="quest-detail-row"><span>Dificuldade</span><b>{detailsMission.difficulty}</b></div>

                  {detailsMission.isLocked ? (
                    <button type="button" disabled>Bloqueada</button>
                  ) : selectedClaim?.status === "accepted" ? (
                    <button type="button" onClick={() => setProofClaim(selectedClaim)}>Finalizar missao</button>
                  ) : selectedClaim?.status === "submitted" ? (
                    <button type="button" disabled>Em revisao</button>
                  ) : selectedClaim?.status === "completed" ? (
                    <button type="button" disabled>Concluida</button>
                  ) : (
                    <button type="button" onClick={() => acceptMission(detailsMission)} disabled={actionId === detailsMission.id || payload?.usingFallback}>
                      {actionId === detailsMission.id ? "Aceitando..." : "Aceitar missao"}
                    </button>
                  )}
                </>
              ) : null}
            </aside>
          </section>

          <nav className="medieval-tabs">
            {tabs.map((item) => (
              <button key={item.id} type="button" className={tab === item.id ? "active" : ""} onClick={() => { setTab(item.id); setSelectedMission(null); }}>
                {item.label}
                {item.id === "active" && activeClaims.length ? <span>{activeClaims.length}</span> : null}
                {item.id === "submitted" && submittedClaims.length ? <span>{submittedClaims.length}</span> : null}
              </button>
            ))}
          </nav>
        </section>
      </main>

      {proofClaim ? (
        <div className="mission-modal">
          <section className="mission-modal-panel parchment-modal">
            <h2>Finalizar missao</h2>
            <p>Envie uma descricao e anexe imagens ou videos como comprovante.</p>
            <textarea placeholder="Descreva o que foi feito" value={proofText} onChange={(e) => setProofText(e.target.value)} />
            <label className="mission-file-input">
              {uploadingProof ? "Enviando arquivo..." : "Anexar imagem ou video"}
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  setUploadingProof(true);
                  try {
                    const uploaded: { name?: string; url?: string; type?: string }[] = [];
                    for (const file of files) uploaded.push(await uploadMissionFile(file));
                    setProofFiles((prev) => [...prev, ...uploaded]);
                  } catch (error) {
                    setMessage(error instanceof Error ? error.message : "Falha no upload do comprovante.");
                  }
                  setUploadingProof(false);
                }}
              />
            </label>
            {proofFiles.length ? (
              <div className="proof-preview-grid">
                {proofFiles.map((file) => (
                  <a key={file.url} href={file.url} target="_blank" rel="noreferrer">{file.name || "Comprovante"}</a>
                ))}
              </div>
            ) : null}
            <div className="mission-modal-actions">
              <button type="button" onClick={() => setProofClaim(null)}>Cancelar</button>
              <button type="button" onClick={submitProof} disabled={actionId === proofClaim.id || uploadingProof}>Enviar para revisao</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function getQuestIcon(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes("social")) return "✦";
  if (normalized.includes("recrut")) return "⚑";
  if (normalized.includes("evento")) return "◆";
  if (normalized.includes("misterio") || normalized.includes("enigma")) return "◉";
  return "✧";
}
