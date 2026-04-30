"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import "./missoes.css";

type MissionClaim = {
  id: number;
  mission_id: number;
  profile_id?: string;
  status: string;
  proof_text?: string | null;
  proof_links?: string[] | null;
  proof_files?: { name?: string; url?: string; type?: string }[] | null;
  mission_title?: string;
  mission_reward?: number;
  profile_name?: string;
  profile_avatar_url?: string | null;
  profile_cargo?: string | null;
  accepted_at: string;
  submitted_at?: string | null;
  completed_at?: string | null;
};

type Mission = {
  id: number;
  title: string;
  summary: string;
  details?: string | null;
  category: string;
  difficulty: string;
  required_level: number;
  visible_level: number;
  reward_influence: number;
  time_limit_hours: number;
  image_url?: string | null;
  status: string;
  tags?: string[];
  claim?: MissionClaim | null;
  isAccepted: boolean;
  isCompleted: boolean;
  isSubmitted: boolean;
  isLocked: boolean;
  lockedReason: string;
};

type MissionProfile = {
  id: string;
  nome: string | null;
  cargo: string | null;
  avatar_url?: string | null;
  level: number;
  xp: number;
  nextInfluence: number;
  rankLabel: string;
  canManage: boolean;
};

type Payload = {
  profile: MissionProfile;
  missions: Mission[];
  claims: MissionClaim[];
  adminClaims: MissionClaim[];
  activity: { id: number; title: string; description?: string | null; influence_delta: number }[];
  levels?: { level: number; required_xp: number; label?: string | null }[];
  usingFallback?: boolean;
};

const tabs = [
  { id: "available", label: "Disponiveis" },
  { id: "active", label: "Aceitas" },
  { id: "submitted", label: "Finalizadas" },
  { id: "review", label: "Para aprovar" },
  { id: "secret", label: "Secretas" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const navItems = [
  ["Missoes", "/missoes"],
  ["Meu painel", "/missoes/painel"],
  ["Rankings", "/missoes/ranking"],
  ["Eventos", "/missoes/eventos"],
  ["Meu card", "/missoes/meu-card"],
];

export default function MissoesPage() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [tab, setTab] = useState<TabId>("available");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [proofClaim, setProofClaim] = useState<MissionClaim | null>(null);
  const [reviewClaimDetails, setReviewClaimDetails] = useState<MissionClaim | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofFiles, setProofFiles] = useState<{ name?: string; url?: string; type?: string }[]>([]);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadingMissionImage, setUploadingMissionImage] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [createForm, setCreateForm] = useState({
    title: "",
    summary: "",
    details: "",
    reward_influence: "100",
    required_level: "0",
    visible_level: "0",
    time_limit_hours: "24",
    difficulty: "media",
    category: "geral",
    status: "active",
    image_url: "",
  });

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
      setMessage(data?.error || "Nao foi possivel carregar o painel de missoes.");
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

  async function uploadMissionFile(file: File, purpose: "proof" | "mission-image") {
    const token = await getToken();
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", purpose);
    const response = await fetch("/api/missions/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Falha no upload.");
    return data.file as { name: string; url: string; type: string };
  }

  async function acceptMission(missionId: number) {
    setActionId(missionId);
    setMessage("");
    try {
      await apiAction(`/api/missions/${missionId}/accept`, { method: "POST" });
      setMessage("Missao aceita. Ela apareceu na aba Aceitas.");
      setTab("active");
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
        body: JSON.stringify({
          proof_text: proofText,
          proof_links: [],
          proof_files: proofFiles,
        }),
      });
      setProofClaim(null);
      setProofText("");
      setProofFiles([]);
      setTab("submitted");
      setMessage("Comprovantes enviados. A lideranca vai revisar sua missao.");
      await loadMissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel finalizar a missao.");
    }
    setActionId(null);
  }

  async function createMission() {
    setMessage("");
    try {
      await apiAction("/api/missions", { method: "POST", body: JSON.stringify(createForm) });
      setCreateForm({ ...createForm, title: "", summary: "", details: "", image_url: "" });
      setMessage("Missao criada e publicada no painel.");
      await loadMissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel criar a missao.");
    }
  }

  async function updateMission() {
    if (!editingMission) return;
    setMessage("");
    try {
      await apiAction(`/api/missions/${editingMission.id}`, {
        method: "PATCH",
        body: JSON.stringify(editingMission),
      });
      setEditingMission(null);
      setMessage("Missao atualizada.");
      await loadMissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel editar a missao.");
    }
  }

  async function reviewClaim(claimId: number, action: "approve" | "reject") {
    setActionId(claimId);
    try {
      await apiAction(`/api/missions/claims/${claimId}/review`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      setMessage(action === "approve" ? "Missao aprovada e XP entregue." : "Missao recusada.");
      await loadMissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel revisar.");
    }
    setActionId(null);
  }

  const missions = payload?.missions || [];
  const claims = payload?.claims || [];
  const activeClaims = claims.filter((claim) => claim.status === "accepted");
  const submittedClaims = claims.filter((claim) => claim.status === "submitted" || claim.status === "completed" || claim.status === "rejected");
  const pendingReviewClaims = (payload?.adminClaims || []).filter((claim) => claim.status === "submitted");
  const profile = payload?.profile;
  const xpPercent = profile ? Math.min(100, Math.round((profile.xp / Math.max(profile.nextInfluence, 1)) * 100)) : 0;

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
    return missions.filter((mission) => mission.status !== "secret");
  }, [activeClaims, missions, submittedClaims, tab]);

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="missions-page missions-loading">
          <Spinner texto="Carregando painel de missoes..." />
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="missions-page">
        <section className="missions-shell">
          <MissionHero />
          {message ? <div className="missions-alert">{message}</div> : null}
          {payload?.usingFallback ? <div className="missions-alert">Aplique a migracao de missoes no Supabase para liberar todas as acoes.</div> : null}

          <div className="missions-layout">
            <MissionMenu active="/missoes" />

            <section className="missions-board">
              <div className="missions-tabs" role="tablist" aria-label="Filtros de missao">
                {tabs.filter((item) => item.id !== "review" || profile?.canManage).map((item) => (
                  <button key={item.id} type="button" className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>
                    {item.label}
                    {item.id === "active" && activeClaims.length ? <span>{activeClaims.length}</span> : null}
                    {item.id === "submitted" && submittedClaims.length ? <span>{submittedClaims.length}</span> : null}
                    {item.id === "review" && pendingReviewClaims.length ? <span>{pendingReviewClaims.length}</span> : null}
                  </button>
                ))}
              </div>

              <div className="missions-list">
                {tab === "review" && profile?.canManage ? (
                  pendingReviewClaims.length === 0 ? (
                    <div className="mission-empty">Nenhuma missao aguardando aprovacao.</div>
                  ) : (
                    pendingReviewClaims.map((claim) => (
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
                          <button type="button" onClick={() => setReviewClaimDetails(claim)}>Ver detalhes</button>
                          <button type="button" onClick={() => reviewClaim(claim.id, "approve")} disabled={actionId === claim.id}>Aprovar</button>
                          <button type="button" onClick={() => reviewClaim(claim.id, "reject")} disabled={actionId === claim.id}>Recusar</button>
                        </div>
                      </article>
                    ))
                  )
                ) : visibleMissions.length === 0 ? (
                  <div className="mission-empty">Nenhuma missao nesta aba.</div>
                ) : (
                  visibleMissions.map((mission) => {
                    const claim = mission.claim;
                    return (
                      <article key={mission.id} className={`mission-card ${mission.isLocked ? "locked" : ""}`}>
                        <div className="mission-image-wrap">
                          <img src={mission.image_url || "/images/portal_scene_secondary.png"} alt={mission.title} />
                        </div>
                        <div className="mission-body">
                          <div className="mission-heading">
                            <div>
                              <h2>Missao: {mission.title}</h2>
                              <p>{mission.summary}</p>
                            </div>
                            <span className={`difficulty ${mission.difficulty}`}>{mission.difficulty}</span>
                          </div>
                          <div className="mission-tags">
                            {(mission.tags || [mission.category]).map((tag) => <span key={tag}>{tag}</span>)}
                          </div>
                          <div className="mission-meta">
                            <div><strong>+{mission.reward_influence}</strong><span>XP</span></div>
                            <div><strong>{mission.time_limit_hours}h</strong><span>tempo</span></div>
                            <div><strong>Nivel {mission.required_level}</strong><span>aceitar</span></div>
                          </div>
                        </div>
                        <div className="mission-actions">
                          {profile?.canManage ? (
                            <button type="button" onClick={() => setEditingMission(mission)}>Editar</button>
                          ) : null}
                          {mission.isLocked ? (
                            <button type="button" disabled>Bloqueada</button>
                          ) : claim?.status === "accepted" ? (
                            <button type="button" onClick={() => setProofClaim(claim)}>Finalizar</button>
                          ) : claim?.status === "submitted" ? (
                            <button type="button" disabled>Em revisao</button>
                          ) : claim?.status === "completed" ? (
                            <button type="button" disabled>Aprovada</button>
                          ) : (
                            <button type="button" onClick={() => acceptMission(mission.id)} disabled={actionId === mission.id || payload?.usingFallback}>
                              {actionId === mission.id ? "Aceitando..." : "Aceitar"}
                            </button>
                          )}
                          <details>
                            <summary>Ver detalhes</summary>
                            <p>{mission.isLocked ? mission.lockedReason : mission.details || "Sem detalhes extras."}</p>
                          </details>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </section>

            <aside className="missions-right">
              <AgentCard profile={profile} percent={xpPercent} />
              {profile?.canManage ? (
                <section className="activity-card">
                  <h2>Criar missao</h2>
                  <div className="mission-form">
                    <input placeholder="Titulo" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
                    <textarea placeholder="Resumo" value={createForm.summary} onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })} />
                    <textarea placeholder="Detalhes" value={createForm.details} onChange={(e) => setCreateForm({ ...createForm, details: e.target.value })} />
                    <label className="mission-file-input">
                      {uploadingMissionImage ? "Enviando imagem..." : "Enviar imagem da missao"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingMissionImage(true);
                          try {
                            const uploaded = await uploadMissionFile(file, "mission-image");
                            setCreateForm({ ...createForm, image_url: uploaded.url });
                          } catch (error) {
                            setMessage(error instanceof Error ? error.message : "Falha no upload da imagem.");
                          }
                          setUploadingMissionImage(false);
                        }}
                      />
                    </label>
                    {createForm.image_url ? <img className="mission-upload-preview" src={createForm.image_url} alt="Preview da missao" /> : null}
                    <div className="mission-form-grid">
                      <input placeholder="XP" value={createForm.reward_influence} onChange={(e) => setCreateForm({ ...createForm, reward_influence: e.target.value })} />
                      <input placeholder="Nivel para aceitar" value={createForm.required_level} onChange={(e) => setCreateForm({ ...createForm, required_level: e.target.value })} />
                      <input placeholder="Nivel para ver" value={createForm.visible_level} onChange={(e) => setCreateForm({ ...createForm, visible_level: e.target.value })} />
                      <input placeholder="Horas" value={createForm.time_limit_hours} onChange={(e) => setCreateForm({ ...createForm, time_limit_hours: e.target.value })} />
                    </div>
                    <button type="button" onClick={createMission}>Criar missao</button>
                  </div>
                </section>
              ) : null}
              {profile?.canManage ? (
                <section className="activity-card">
                  <h2>Revisao da lideranca</h2>
                  {(payload?.adminClaims || []).filter((claim) => claim.status === "submitted").length === 0 ? <p className="muted">Nenhuma missao enviada.</p> : null}
                  {(payload?.adminClaims || []).filter((claim) => claim.status === "submitted").map((claim) => (
                    <div className="activity-item mission-review" key={claim.id}>
                      <span>Envio #{claim.id}</span>
                      <p>{claim.proof_text || "Comprovantes enviados sem texto."}</p>
                      <div>
                        <button type="button" onClick={() => setReviewClaimDetails(claim)}>Detalhes</button>
                        <button type="button" onClick={() => reviewClaim(claim.id, "approve")} disabled={actionId === claim.id}>Aprovar</button>
                        <button type="button" onClick={() => reviewClaim(claim.id, "reject")} disabled={actionId === claim.id}>Recusar</button>
                      </div>
                    </div>
                  ))}
                </section>
              ) : (
                <ActivityCard activity={payload?.activity || []} />
              )}
            </aside>
          </div>
          <footer className="missions-footer">Somos Iconics. Somos cultura. Somos influencia.</footer>
        </section>
      </main>

      {proofClaim ? (
        <div className="mission-modal">
          <section className="mission-modal-panel">
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
                    for (const file of files) {
                      uploaded.push(await uploadMissionFile(file, "proof"));
                    }
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

      {reviewClaimDetails ? (
        <div className="mission-modal">
          <section className="mission-modal-panel">
            <h2>{reviewClaimDetails.mission_title || `Envio #${reviewClaimDetails.id}`}</h2>
            <p><strong>Enviado por:</strong> {reviewClaimDetails.profile_name || "Membro Iconics"}</p>
            <p><strong>Texto enviado:</strong> {reviewClaimDetails.proof_text || "Sem texto."}</p>
            <div className="proof-preview-grid">
              {(reviewClaimDetails.proof_files || []).map((file) => (
                <a key={file.url} href={file.url} target="_blank" rel="noreferrer">
                  {file.type?.startsWith("image/") ? <img src={file.url} alt={file.name || "Comprovante"} /> : null}
                  <span>{file.name || "Abrir comprovante"}</span>
                </a>
              ))}
            </div>
            <div className="mission-modal-actions">
              <button type="button" onClick={() => setReviewClaimDetails(null)}>Fechar</button>
              <button type="button" onClick={() => reviewClaim(reviewClaimDetails.id, "approve")}>Aprovar</button>
              <button type="button" onClick={() => reviewClaim(reviewClaimDetails.id, "reject")}>Recusar</button>
            </div>
          </section>
        </div>
      ) : null}

      {editingMission ? (
        <div className="mission-modal">
          <section className="mission-modal-panel">
            <h2>Editar missao</h2>
            <div className="mission-form">
              <input value={editingMission.title} onChange={(e) => setEditingMission({ ...editingMission, title: e.target.value })} />
              <textarea value={editingMission.summary} onChange={(e) => setEditingMission({ ...editingMission, summary: e.target.value })} />
              <textarea value={editingMission.details || ""} onChange={(e) => setEditingMission({ ...editingMission, details: e.target.value })} />
              <div className="mission-form-grid">
                <input placeholder="XP" value={editingMission.reward_influence} onChange={(e) => setEditingMission({ ...editingMission, reward_influence: Number(e.target.value) })} />
                <input placeholder="Nivel para aceitar" value={editingMission.required_level} onChange={(e) => setEditingMission({ ...editingMission, required_level: Number(e.target.value) })} />
                <input placeholder="Nivel para ver" value={editingMission.visible_level} onChange={(e) => setEditingMission({ ...editingMission, visible_level: Number(e.target.value) })} />
                <input placeholder="Horas" value={editingMission.time_limit_hours} onChange={(e) => setEditingMission({ ...editingMission, time_limit_hours: Number(e.target.value) })} />
              </div>
              <input placeholder="Categoria" value={editingMission.category} onChange={(e) => setEditingMission({ ...editingMission, category: e.target.value })} />
              <input placeholder="Dificuldade" value={editingMission.difficulty} onChange={(e) => setEditingMission({ ...editingMission, difficulty: e.target.value })} />
              <label className="mission-file-input">
                Trocar imagem da missao
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const uploaded = await uploadMissionFile(file, "mission-image");
                      setEditingMission({ ...editingMission, image_url: uploaded.url });
                    } catch (error) {
                      setMessage(error instanceof Error ? error.message : "Falha no upload da imagem.");
                    }
                  }}
                />
              </label>
              {editingMission.image_url ? <img className="mission-upload-preview" src={editingMission.image_url} alt="Preview da missao" /> : null}
              <select value={editingMission.status} onChange={(e) => setEditingMission({ ...editingMission, status: e.target.value })}>
                <option value="active">Ativa</option>
                <option value="secret">Secreta</option>
              </select>
            </div>
            <div className="mission-modal-actions">
              <button type="button" onClick={() => setEditingMission(null)}>Cancelar</button>
              <button type="button" onClick={updateMission}>Salvar edicao</button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}

function MissionHero() {
  return (
    <header className="missions-hero">
      <div className="missions-brand">
        <img src="/images/iconics-logo.png" alt="ICONICS" className="missions-logo" />
        <span>Fraternidade de influencia</span>
      </div>
      <div className="missions-title-block">
        <p className="missions-kicker">A influencia comeca aqui.</p>
        <h1>Painel de Missao</h1>
      </div>
      <div className="missions-hero-art" aria-hidden="true" />
    </header>
  );
}

function MissionMenu({ active }: { active: string }) {
  return (
    <aside className="missions-left">
      <nav className="missions-menu">
        {navItems.map(([label, href]) => (
          <a key={href} href={href} className={active === href ? "active" : ""}>{label}</a>
        ))}
      </nav>
      <section className="missions-status">
        <p>Iconics status</p>
        <strong>A ordem conecta.</strong>
        <span>O impacto permanece.</span>
      </section>
    </aside>
  );
}

function AgentCard({ profile, percent }: { profile?: MissionProfile; percent: number }) {
  return (
    <section className="agent-card">
      <div className="agent-top">
        <img src={profile?.avatar_url || "/images/iconics_emblem_main.png"} alt={profile?.nome || "Membro Iconics"} />
        <div>
          <h2>{profile?.nome || "Membro Iconics"}</h2>
          <p>{profile?.rankLabel || "Recem-chegado"}</p>
        </div>
      </div>
      <div className="agent-stat">
        <span>XP</span>
        <strong>{profile?.xp || 0}</strong>
      </div>
      <div className="mission-progress"><div style={{ width: `${percent}%` }} /></div>
      <small>Nivel {profile?.level || 0} - {percent}% para o proximo nivel</small>
    </section>
  );
}

function ActivityCard({ activity }: { activity: Payload["activity"] }) {
  return (
    <section className="activity-card">
      <h2>Atividade recente</h2>
      {activity.length === 0 ? <p className="muted">Sem atividade recente.</p> : null}
      {activity.map((item) => (
        <div key={item.id} className="activity-item">
          <span>{item.title}</span>
          <p>{item.description || "Movimento registrado no painel."}</p>
          <strong>{item.influence_delta > 0 ? `+${item.influence_delta}` : item.influence_delta}</strong>
        </div>
      ))}
    </section>
  );
}
