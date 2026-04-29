"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import "./missoes.css";

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
  image_url?: string | null;
  status: string;
  tags?: string[];
  claim?: MissionClaim | null;
  isAccepted: boolean;
  isCompleted: boolean;
  isLocked: boolean;
  lockedReason: string;
};

type MissionClaim = {
  id: number;
  mission_id: number;
  status: string;
  progress: number;
  accepted_at: string;
  expires_at?: string | null;
  completed_at?: string | null;
};

type MissionProfile = {
  nome: string | null;
  cargo: string | null;
  avatar_url?: string | null;
  level: number;
  influence: number;
  nextInfluence: number;
  rankLabel: string;
};

type ActivityItem = {
  id: number;
  title: string;
  description?: string | null;
  influence_delta: number;
  created_at: string;
};

type MissionPayload = {
  profile: MissionProfile;
  missions: Mission[];
  claims: MissionClaim[];
  activity: ActivityItem[];
  usingFallback?: boolean;
};

const tabs = [
  { id: "available", label: "Missoes disponiveis" },
  { id: "active", label: "Em andamento" },
  { id: "secret", label: "Missoes secretas" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function MissoesPage() {
  const [payload, setPayload] = useState<MissionPayload | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("available");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState("");

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

    const response = await fetch("/api/missions", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      setMessage("Nao foi possivel carregar o painel de missoes.");
      setLoading(false);
      return;
    }

    const data = await response.json();
    setPayload(data);
    setLoading(false);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadMissions();
    }, 0);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acceptMission(missionId: number) {
    setActionLoading(missionId);
    setMessage("");

    const token = await getToken();
    const response = await fetch(`/api/missions/${missionId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(data?.error || "Nao foi possivel aceitar esta missao.");
      setActionLoading(null);
      return;
    }

    setMessage("Missao aceita. Ela apareceu em Em andamento.");
    await loadMissions();
    setActiveTab("active");
    setActionLoading(null);
  }

  const missions = useMemo(() => payload?.missions || [], [payload?.missions]);
  const activeClaims = useMemo(
    () => payload?.claims.filter((claim) => claim.status === "accepted" || claim.status === "submitted") || [],
    [payload?.claims]
  );

  const visibleMissions = useMemo(() => {
    if (activeTab === "active") {
      const activeIds = new Set(activeClaims.map((claim) => Number(claim.mission_id)));
      return missions.filter((mission) => activeIds.has(Number(mission.id)));
    }

    if (activeTab === "secret") {
      return missions.filter((mission) => mission.status === "secret");
    }

    return missions.filter((mission) => mission.status !== "secret");
  }, [activeTab, activeClaims, missions]);

  const profile = payload?.profile;
  const influencePercent = profile
    ? Math.min(100, Math.round((profile.influence / Math.max(profile.nextInfluence, 1)) * 100))
    : 0;

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

          {message && <div className="missions-alert">{message}</div>}
          {payload?.usingFallback && (
            <div className="missions-alert">
              Preview ativo: aplique a migracao de missoes no Supabase para aceitar missoes.
            </div>
          )}

          <div className="missions-layout">
            <aside className="missions-left">
              <nav className="missions-menu">
                <button className="active" type="button">Missoes</button>
                <a href="/painel">Meu painel</a>
                <a href="/rankings">Rankings</a>
                <a href="/calendario">Eventos</a>
                <a href="/rede">Rede Iconics</a>
                <a href="/painel/vinculo">Meu card</a>
              </nav>

              <section className="missions-status">
                <p>Iconics status</p>
                <strong>A ordem conecta.</strong>
                <span>O impacto permanece.</span>
              </section>
            </aside>

            <section className="missions-board">
              <div className="missions-tabs" role="tablist" aria-label="Filtros de missao">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={activeTab === tab.id ? "active" : ""}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    {tab.label}
                    {tab.id === "active" && activeClaims.length > 0 ? <span>{activeClaims.length}</span> : null}
                  </button>
                ))}
              </div>

              <div className="missions-list">
                {visibleMissions.length === 0 ? (
                  <div className="mission-empty">Nenhuma missao nesta aba.</div>
                ) : (
                  visibleMissions.map((mission) => (
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
                          {(mission.tags || [mission.category]).map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>

                        <div className="mission-meta">
                          <div>
                            <strong>+{mission.reward_influence}</strong>
                            <span>influencia</span>
                          </div>
                          <div>
                            <strong>{mission.time_limit_hours}h</strong>
                            <span>tempo limite</span>
                          </div>
                          <div>
                            <strong>Nivel {mission.required_level}</strong>
                            <span>necessario</span>
                          </div>
                        </div>
                      </div>

                      <div className="mission-actions">
                        {mission.isLocked ? (
                          <button type="button" disabled>
                            Bloqueada
                          </button>
                        ) : mission.isAccepted ? (
                          <button type="button" disabled>
                            Em andamento
                          </button>
                        ) : mission.isCompleted ? (
                          <button type="button" disabled>
                            Completa
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => acceptMission(mission.id)}
                            disabled={actionLoading === mission.id || payload?.usingFallback}
                          >
                            {actionLoading === mission.id ? "Aceitando..." : "Aceitar"}
                          </button>
                        )}

                        <details>
                          <summary>Ver detalhes</summary>
                          <p>{mission.isLocked ? mission.lockedReason : mission.details || "Sem detalhes extras."}</p>
                        </details>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <aside className="missions-right">
              <section className="agent-card">
                <div className="agent-top">
                  <img
                    src={profile?.avatar_url || "/images/iconics_emblem_main.png"}
                    alt={profile?.nome || "Membro Iconics"}
                  />
                  <div>
                    <h2>{profile?.nome || "Membro Iconics"}</h2>
                    <p>{profile?.rankLabel || "Iniciado"}</p>
                  </div>
                </div>
                <div className="agent-stat">
                  <span>Influencia</span>
                  <strong>{profile?.influence || 0}</strong>
                </div>
                <div className="mission-progress">
                  <div style={{ width: `${influencePercent}%` }} />
                </div>
                <small>{influencePercent}% para o proximo nivel</small>
              </section>

              <section className="level-card">
                <span>Nivel</span>
                <strong>{profile?.level || 1}</strong>
                <p>{profile?.influence || 0} / {profile?.nextInfluence || 500} influencia</p>
              </section>

              <section className="reward-card">
                <h2>Recompensas em destaque</h2>
                <div>
                  <img src="/images/emblema.png" alt="Emblema Iconics" />
                  <p>Emblema Nyx</p>
                  <strong>4.000 influencia</strong>
                </div>
              </section>

              <section className="activity-card">
                <h2>Atividade recente</h2>
                {(payload?.activity || []).length === 0 ? (
                  <p className="muted">Sem atividade recente.</p>
                ) : (
                  payload?.activity.map((item) => (
                    <div key={item.id} className="activity-item">
                      <span>{item.title}</span>
                      <p>{item.description || "Movimento registrado no painel."}</p>
                      <strong>{item.influence_delta > 0 ? `+${item.influence_delta}` : item.influence_delta}</strong>
                    </div>
                  ))
                )}
              </section>
            </aside>
          </div>

          <footer className="missions-footer">Somos Iconics. Somos cultura. Somos influencia.</footer>
        </section>
      </main>
    </>
  );
}
