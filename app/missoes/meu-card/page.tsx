"use client";

import TopBar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import "../missoes.css";

type Profile = {
  id: string;
  nome: string | null;
  cargo: string | null;
  avatar_url?: string | null;
  level: number;
  xp: number;
  rankLabel: string;
  nextInfluence: number;
};

type Claim = {
  id: number;
  mission_id: number;
  status: string;
  accepted_at: string;
  submitted_at?: string | null;
  completed_at?: string | null;
};

type Mission = {
  id: number;
  title: string;
  summary: string;
  claim?: Claim | null;
};

export default function MissionCardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [message, setMessage] = useState("Carregando card...");

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const response = await fetch("/api/missions", { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.error || "Nao foi possivel carregar o card.");
        return;
      }
      setProfile(payload.profile);
      setMissions(payload.missions || []);
      setMessage("");
    }
    load();
  }, []);

  return (
    <>
      <TopBar />
      <main className="missions-page">
        <section className="missions-shell">
          <header className="missions-hero compact-hero">
            <div className="missions-brand"><img src="/images/iconics-logo.png" alt="ICONICS" className="missions-logo" /><span>Identidade de membro</span></div>
            <div className="missions-title-block">
              <p className="missions-kicker">Seu registro de influencia</p>
              <h1>Meu Card</h1>
              {profile ? (
                <div className="hero-level">
                  <span>Nivel {profile.level}</span>
                  <div><i style={{ width: `${Math.min(100, Math.round((profile.xp / Math.max(profile.nextInfluence, 1)) * 100))}%` }} /></div>
                  <small>{profile.xp} / {profile.nextInfluence} XP</small>
                </div>
              ) : null}
            </div>
            <div className="missions-hero-art" aria-hidden="true" />
          </header>
          <div className="missions-layout two-col">
            <MissionMenu active="/missoes/meu-card" />
            <section className="missions-board mission-card-showcase">
              {message ? <div className="mission-empty">{message}</div> : null}
              {profile ? (
                <article className="member-mission-card">
                  <img src={profile.avatar_url || "/images/iconics_emblem_main.png"} alt={profile.nome || "Membro"} />
                  <div>
                    <p>ICONICS MEMBER</p>
                    <h2>{profile.nome || "Membro Iconics"}</h2>
                    <span>{profile.rankLabel}</span>
                  </div>
                  <footer>
                    <strong>Nivel {profile.level}</strong>
                    <strong>{profile.xp} XP</strong>
                    <strong>{profile.cargo || "calouro"}</strong>
                  </footer>
                </article>
              ) : null}
              <section className="card-mission-lists">
                <article className="activity-card">
                  <h2>Missoes aceitas</h2>
                  {missions.filter((mission) => mission.claim?.status === "accepted").length === 0 ? <p className="muted">Nenhuma missao aceita.</p> : null}
                  {missions.filter((mission) => mission.claim?.status === "accepted").map((mission) => (
                    <div className="activity-item" key={mission.id}><span>{mission.title}</span><p>{mission.summary}</p><strong>Aberta</strong></div>
                  ))}
                </article>
                <article className="activity-card">
                  <h2>Missoes finalizadas</h2>
                  {missions.filter((mission) => ["submitted", "completed", "rejected"].includes(mission.claim?.status || "")).length === 0 ? <p className="muted">Nenhuma missao finalizada.</p> : null}
                  {missions.filter((mission) => ["submitted", "completed", "rejected"].includes(mission.claim?.status || "")).map((mission) => (
                    <div className="activity-item" key={mission.id}><span>{mission.title}</span><p>{mission.summary}</p><strong>{mission.claim?.status}</strong></div>
                  ))}
                </article>
              </section>
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

function MissionMenu({ active }: { active: string }) {
  const navItems = [["Missoes", "/missoes"], ["Meu painel", "/missoes/painel"], ["Rankings", "/missoes/ranking"], ["Eventos", "/missoes/eventos"], ["Meu card", "/missoes/meu-card"]];
  return <aside className="missions-left"><nav className="missions-menu">{navItems.map(([label, href]) => <a key={href} href={href} className={active === href ? "active" : ""}>{label}</a>)}</nav></aside>;
}
