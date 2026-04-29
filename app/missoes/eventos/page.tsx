"use client";

import TopBar from "@/components/Topbar";
import { useEffect, useState } from "react";
import "../missoes.css";

type EventItem = {
  id: number;
  titulo: string;
  descricao?: string | null;
  data_evento?: string | null;
  horario?: string | null;
  local?: string | null;
  imagem_url?: string | null;
};

export default function MissionEventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [message, setMessage] = useState("Carregando eventos...");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/public-events", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.error || "Nao foi possivel carregar eventos.");
        return;
      }
      setEvents(payload || []);
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
            <div className="missions-brand"><img src="/images/iconics-logo.png" alt="ICONICS" className="missions-logo" /><span>Agenda Iconics</span></div>
            <div className="missions-title-block"><p className="missions-kicker">Encontros e oportunidades</p><h1>Eventos</h1></div>
            <div className="missions-hero-art" aria-hidden="true" />
          </header>
          <div className="missions-layout two-col">
            <MissionMenu active="/missoes/eventos" />
            <section className="missions-board missions-list">
              {message ? <div className="mission-empty">{message}</div> : null}
              {events.map((event) => (
                <article className="mission-card event-card" key={event.id}>
                  <div className="mission-image-wrap"><img src={event.imagem_url || "/images/mansao.png"} alt={event.titulo} /></div>
                  <div className="mission-body">
                    <div className="mission-heading"><div><h2>{event.titulo}</h2><p>{event.descricao || "Evento Iconics"}</p></div></div>
                    <div className="mission-meta">
                      <div><strong>{event.data_evento || "Data"}</strong><span>quando</span></div>
                      <div><strong>{event.horario || "--"}</strong><span>horario</span></div>
                      <div><strong>{event.local || "Iconics"}</strong><span>local</span></div>
                    </div>
                  </div>
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
  const navItems = [["Missoes", "/missoes"], ["Meu painel", "/missoes/painel"], ["Rankings", "/missoes/ranking"], ["Eventos", "/missoes/eventos"], ["Meu card", "/missoes/meu-card"]];
  return <aside className="missions-left"><nav className="missions-menu">{navItems.map(([label, href]) => <a key={href} href={href} className={active === href ? "active" : ""}>{label}</a>)}</nav></aside>;
}
