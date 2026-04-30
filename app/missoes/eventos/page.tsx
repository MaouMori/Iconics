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
          <section className="missions-board missions-list clean-page-panel">
              {message ? <div className="mission-empty">{message}</div> : null}
              {!message && events.length === 0 ? <div className="mission-empty">Nenhum evento cadastrado no momento.</div> : null}
              {events.map((event) => (
                <article className="mission-card event-card" key={event.id}>
                  <div className="mission-image-wrap"><img src={event.imagem_url || "/images/mansao.png"} alt={event.titulo} /></div>
                  <div className="mission-body">
                    <div className="mission-heading"><div><h2>{event.titulo}</h2><p>{event.descricao || "Evento Iconics"}</p></div></div>
                    <div className="mission-meta">
                      <div><strong>{formatEventDate(event.data_evento)}</strong><span>quando</span></div>
                      <div><strong>{formatEventTime(event.horario)}</strong><span>horario</span></div>
                      <div><strong>{event.local || "Iconics"}</strong><span>local</span></div>
                    </div>
                  </div>
                </article>
              ))}
            </section>
        </section>
      </main>
    </>
  );
}

function formatEventDate(value?: string | null) {
  if (!value) return "Data";
  const [year, month, day] = value.split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return value;
}

function formatEventTime(value?: string | null) {
  if (!value) return "--";
  return value.slice(0, 5);
}
