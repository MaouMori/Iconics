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
  canManage: boolean;
};

export default function MissionPanelPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ranking, setRanking] = useState<Profile[]>([]);
  const [selected, setSelected] = useState("");
  const [level, setLevel] = useState("");
  const [xpDelta, setXpDelta] = useState("");
  const [message, setMessage] = useState("Carregando painel...");

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
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error || "Nao foi possivel carregar.");
      return;
    }
    setProfile(payload.profile);
    setRanking(payload.ranking || []);
    setSelected(payload.profile?.id || "");
    setMessage("");
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function adjustProfile() {
    const token = await getToken();
    const response = await fetch(`/api/missions/profiles/${selected}/adjust`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ level, xp_delta: xpDelta }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error || "Nao foi possivel ajustar.");
      return;
    }
    setMessage("Perfil atualizado.");
    await load();
  }

  return (
    <>
      <TopBar />
      <main className="missions-page">
        <section className="missions-shell">
          <header className="missions-hero compact-hero">
            <div className="missions-brand">
              <img src="/images/iconics-logo.png" alt="ICONICS" className="missions-logo" />
              <span>Controle pessoal</span>
            </div>
            <div className="missions-title-block">
              <p className="missions-kicker">Seu progresso e comandos</p>
              <h1>Meu Painel</h1>
            </div>
            <div className="missions-hero-art" aria-hidden="true" />
          </header>

          {message ? <div className="missions-alert">{message}</div> : null}
          <div className="missions-layout two-col">
            <MissionMenu active="/missoes/painel" />
            <section className="missions-board mission-page-grid">
              <article className="agent-card">
                <div className="agent-top">
                  <img src={profile?.avatar_url || "/images/iconics_emblem_main.png"} alt={profile?.nome || "Membro"} />
                  <div>
                    <h2>{profile?.nome || "Membro Iconics"}</h2>
                    <p>{profile?.rankLabel || "Recem-chegado"}</p>
                  </div>
                </div>
                <div className="agent-stat"><span>Nivel</span><strong>{profile?.level || 0}</strong></div>
                <div className="agent-stat"><span>XP</span><strong>{profile?.xp || 0}</strong></div>
              </article>

              {profile?.canManage ? (
                <article className="activity-card">
                  <h2>Gestao de nivel</h2>
                  <div className="mission-form">
                    <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                      {ranking.map((item) => <option key={item.id} value={item.id}>{item.nome || item.id} - nivel {item.level}</option>)}
                    </select>
                    <input placeholder="Setar nivel" value={level} onChange={(e) => setLevel(e.target.value)} />
                    <input placeholder="Adicionar/remover XP" value={xpDelta} onChange={(e) => setXpDelta(e.target.value)} />
                    <button type="button" onClick={adjustProfile}>Salvar ajuste</button>
                  </div>
                </article>
              ) : (
                <article className="activity-card">
                  <h2>Acesso comum</h2>
                  <p className="muted">Voce pode aceitar missoes, enviar comprovantes e acompanhar seu progresso. Ajustes de XP e nivel ficam com lideres, vice-lideres e conselheiros.</p>
                </article>
              )}
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
