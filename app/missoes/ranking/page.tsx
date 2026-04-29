"use client";

import TopBar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import "../missoes.css";

type RankProfile = {
  id: string;
  nome: string | null;
  cargo: string | null;
  avatar_url?: string | null;
  level: number;
  xp: number;
  rankLabel: string;
};

export default function MissionRankingPage() {
  const [ranking, setRanking] = useState<RankProfile[]>([]);
  const [message, setMessage] = useState("Carregando ranking...");

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
        setMessage(payload?.error || "Nao foi possivel carregar o ranking.");
        return;
      }

      setRanking(payload.ranking || []);
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
            <div className="missions-brand">
              <img src="/images/iconics-logo.png" alt="ICONICS" className="missions-logo" />
              <span>Ranking de membros</span>
            </div>
            <div className="missions-title-block">
              <p className="missions-kicker">Nivel, XP e influencia</p>
              <h1>Rank Iconics</h1>
            </div>
            <div className="missions-hero-art" aria-hidden="true" />
          </header>

          <div className="missions-layout two-col">
            <MissionMenu active="/missoes/ranking" />
            <section className="missions-board mission-page-panel">
              {message ? <div className="mission-empty">{message}</div> : null}
              {ranking.map((profile, index) => (
                <article className="rank-row" key={profile.id}>
                  <strong>#{index + 1}</strong>
                  <img src={profile.avatar_url || "/images/iconics_emblem_main.png"} alt={profile.nome || "Membro"} />
                  <div>
                    <h2>{profile.nome || "Membro Iconics"}</h2>
                    <p>{profile.rankLabel} - {profile.cargo || "sem cargo"}</p>
                  </div>
                  <span>Nivel {profile.level}</span>
                  <span>{profile.xp} XP</span>
                </article>
              ))}
            </section>
          </div>
        </section>
      </main>
    </>
  );
}

function MissionMenu({ active }: { active: string }) {
  const navItems = [
    ["Missoes", "/missoes"],
    ["Meu painel", "/missoes/painel"],
    ["Rankings", "/missoes/ranking"],
    ["Eventos", "/missoes/eventos"],
    ["Meu card", "/missoes/meu-card"],
  ];

  return (
    <aside className="missions-left">
      <nav className="missions-menu">
        {navItems.map(([label, href]) => (
          <a key={href} href={href} className={active === href ? "active" : ""}>{label}</a>
        ))}
      </nav>
    </aside>
  );
}
