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
  canManage?: boolean;
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
  image_url?: string | null;
  reward_influence?: number;
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
          <section className="missions-board mission-card-showcase clean-card-showcase">
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
                    <MissionSummaryCard key={mission.id} mission={mission} />
                  ))}
                </article>
                <article className="activity-card">
                  <h2>Missoes finalizadas</h2>
                  {missions.filter((mission) => ["submitted", "completed", "rejected"].includes(mission.claim?.status || "")).length === 0 ? <p className="muted">Nenhuma missao finalizada.</p> : null}
                  {missions.filter((mission) => ["submitted", "completed", "rejected"].includes(mission.claim?.status || "")).map((mission) => (
                    <MissionSummaryCard key={mission.id} mission={mission} />
                  ))}
                </article>
              </section>
            </section>
        </section>
      </main>
    </>
  );
}

function MissionSummaryCard({ mission }: { mission: Mission }) {
  return (
    <div className="mission-summary-card">
      <img src={mission.image_url || "/images/portal_scene_secondary.png"} alt={mission.title} />
      <div>
        <span>{mission.title}</span>
        <p>{mission.summary}</p>
        <small>{formatStatus(mission.claim?.status)} - +{mission.reward_influence || 0} XP</small>
      </div>
    </div>
  );
}

function formatStatus(status?: string) {
  const labels: Record<string, string> = {
    accepted: "Aceita",
    submitted: "Em revisao",
    completed: "Concluida",
    rejected: "Recusada",
  };
  return labels[String(status || "")] || "Registrada";
}
