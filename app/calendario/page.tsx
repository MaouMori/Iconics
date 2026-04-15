"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/Topbar";
import Link from "next/link";

type EventItem = {
  id: number;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  horario: string | null;
  local: string | null;
  imagem_url: string | null;
};

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CalendarioPage() {
  const hoje = new Date();
  const [currentDate, setCurrentDate] = useState(
    new Date(hoje.getFullYear(), hoje.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(formatDate(hoje));
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarEventos() {
      const { data } = await supabase
        .from("events")
        .select("*")
        .order("data_evento", { ascending: true });

      setEvents(data || []);
      setLoading(false);
    }

    carregarEventos();
  }, []);

  const selectedEvents = useMemo(() => {
    return events.filter((event) => event.data_evento === selectedDate);
  }, [events, selectedDate]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];

  for (let i = 0; i < 42; i++) {
    let cellDate: Date;
    let dayNumber: number;
    let otherMonth = false;

    if (i < firstDayOfMonth) {
      dayNumber = daysInPrevMonth - firstDayOfMonth + i + 1;
      cellDate = new Date(year, month - 1, dayNumber);
      otherMonth = true;
    } else if (i >= firstDayOfMonth + daysInMonth) {
      dayNumber = i - (firstDayOfMonth + daysInMonth) + 1;
      cellDate = new Date(year, month + 1, dayNumber);
      otherMonth = true;
    } else {
      dayNumber = i - firstDayOfMonth + 1;
      cellDate = new Date(year, month, dayNumber);
    }

    const dateString = formatDate(cellDate);
    const hasEvent = events.some((event) => event.data_evento === dateString);
    const isSelected = dateString === selectedDate;
    const isToday = dateString === formatDate(hoje);

    cells.push(
      <button
        key={dateString + i}
        onClick={() => setSelectedDate(dateString)}
        className={[
              "calendario-cell",
              otherMonth ? "other-month" : "",
            ].filter(Boolean).join(" ")}
        style={{
          ...(otherMonth ? calendarCellOtherMonth : {}),
          ...(isSelected ? calendarCellSelected : {}),
          ...(isToday ? calendarCellToday : {}),
        }}
      >
        <span style={dayNumberStyle}>{dayNumber}</span>

        {hasEvent && <span style={eventDotStyle} />}

        {isSelected && <span style={selectedGlowStyle} />}
      </button>
    );
  }

  return (
    <>
      <TopBar />

      <main style={pageStyle}>
        <div style={bgGlowTop} />
        <div style={bgGlowBottom} />
        <div style={bgNoise} />

        <section style={heroStyle}>
          <p style={heroKicker}>Arquivos da Fraternidade</p>
          <h1 style={heroTitle}>Calendário Iconics</h1>
          <p style={heroText}>
            Acompanhe os eventos, selecione datas e visualize os encontros marcados
            da fraternidade em um painel mais elegante e organizado.
          </p>
        </section>

        <section style={shellStyle}>
          <div style={calendarCardStyle}>
            <div style={ornamentLine} />

            <div style={headerRowStyle}>
              <div>
                <p style={sectionMiniTitle}>Cronologia da Fraternidade</p>
                <h2 style={sectionTitle}>Calendário de Eventos</h2>
                <p style={sectionText}>
                  Navegue pelos meses e veja os eventos cadastrados por data.
                </p>
              </div>

              <div style={legendWrap}>
                <div style={legendItem}>
                  <span style={{ ...legendDot, background: "#f0cf88" }} />
                  <span>Evento</span>
                </div>

                <div style={legendItem}>
                  <span style={{ ...legendDot, background: "#a855f7" }} />
                  <span>Selecionado</span>
                </div>

                <div style={legendItem}>
                  <span style={{ ...legendDot, background: "#ffffff" }} />
                  <span>Hoje</span>
                </div>
              </div>
            </div>

            <div style={monthBarStyle}>
              <button
                style={monthNavButton}
                onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              >
                ◀
              </button>

              <div style={monthTitleWrap}>
                <div style={monthTitle}>{monthNames[month]} {year}</div>
                <div style={monthSubtitle}>
                  Data selecionada: {formatDisplayDate(selectedDate)}
                </div>
              </div>

              <button
                style={monthNavButton}
                onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              >
                ▶
              </button>
            </div>

            <div style={weekGridStyle}>
              {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d) => (
                <div key={d} style={weekDayStyle}>
                  {d}
                </div>
              ))}
            </div>

            <div style={gridStyle}>{cells}</div>

            <div style={eventsSectionStyle}>
              <div style={eventsHeaderStyle}>
                <span style={eventsLine} />
                <h2 style={eventsTitle}>Eventos do dia</h2>
                <span style={eventsLine} />
              </div>

              {loading ? (
                <p style={emptyTextStyle}>Carregando eventos...</p>
              ) : selectedEvents.length === 0 ? (
                <p style={emptyTextStyle}>Nenhum evento nesta data.</p>
              ) : (
                <div style={eventsListStyle}>
                  {selectedEvents.map((event) => (
                    <div key={event.id} className="calendario-event-card">
                      <div style={eventInfoStyle}>
                        <div style={eventDatePill}>
                          {formatDisplayDate(event.data_evento)} • {event.horario || "Sem horário"}
                        </div>

                        <div style={eventTitleStyle}>{event.titulo}</div>

                        <div style={eventLocationStyle}>
                          {event.local || "Sem local"}
                        </div>

                        <div style={eventDescriptionStyle}>
                          {event.descricao || "Sem descrição"}
                        </div>

                        <div style={eventActionsRowStyle}>
                          <Link href={`/evento/${event.id}`} style={eventDetailsBtnStyle}>
                            Saiba mais
                          </Link>
                        </div>
                      </div>

                      <div style={imageBoxStyle}>
                        {event.imagem_url ? (
                          <img
                            src={event.imagem_url}
                            alt={event.titulo}
                            style={eventImageStyle}
                          />
                        ) : (
                          <div style={imagePlaceholderStyle}>
                            Área para imagem do evento
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function formatDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "110px 20px 50px",
  color: "white",
};

const bgGlowTop: React.CSSProperties = {
  position: "absolute",
  top: -180,
  left: "50%",
  transform: "translateX(-50%)",
  width: 900,
  height: 420,
  borderRadius: "50%",
  background: "rgba(167,92,255,0.16)",
  filter: "blur(120px)",
  pointerEvents: "none",
};

const bgGlowBottom: React.CSSProperties = {
  position: "absolute",
  right: -120,
  bottom: -120,
  width: 520,
  height: 520,
  borderRadius: "50%",
  background: "rgba(96,36,255,0.16)",
  filter: "blur(120px)",
  pointerEvents: "none",
};

const bgNoise: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  backgroundImage:
    "radial-gradient(circle at 20% 20%, rgba(255,255,255,.04) 1px, transparent 1px)",
  backgroundSize: "120px 120px",
  opacity: 0.14,
  pointerEvents: "none",
};

const heroStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "980px",
  margin: "0 auto 28px",
  textAlign: "center",
};

const heroKicker: React.CSSProperties = {
  margin: 0,
  color: "#d8b4fe",
  textTransform: "uppercase",
  letterSpacing: "0.28em",
  fontSize: "0.78rem",
  fontWeight: 700,
};

const heroTitle: React.CSSProperties = {
  margin: "12px 0 10px",
  fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontWeight: 900,
};

const heroText: React.CSSProperties = {
  margin: "0 auto",
  maxWidth: "760px",
  color: "#d8cceb",
  lineHeight: 1.8,
  fontSize: "1rem",
};

const shellStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1100px",
  margin: "0 auto",
};

const calendarCardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
  backdropFilter: "blur(16px)",
};

const ornamentLine: React.CSSProperties = {
  width: "220px",
  height: "2px",
  margin: "0 auto 18px",
  background: "linear-gradient(90deg, transparent, rgba(216,180,254,.9), transparent)",
  borderRadius: "999px",
};

const headerRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: "26px",
};

const sectionMiniTitle: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontSize: "0.74rem",
  fontWeight: 700,
};

const sectionTitle: React.CSSProperties = {
  margin: "8px 0 8px",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "clamp(2rem, 4vw, 3.2rem)",
};

const sectionText: React.CSSProperties = {
  margin: 0,
  color: "#d8cceb",
  lineHeight: 1.7,
};

const legendWrap: React.CSSProperties = {
  display: "flex",
  gap: "16px",
  flexWrap: "wrap",
  alignItems: "center",
};

const legendItem: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  color: "#d8cceb",
  fontSize: "0.92rem",
};

const legendDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  boxShadow: "0 0 10px rgba(255,255,255,.35)",
};

const monthBarStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "64px 1fr 64px",
  alignItems: "center",
  gap: "14px",
  marginBottom: "22px",
  padding: "14px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const monthNavButton: React.CSSProperties = {
  width: "48px",
  height: "48px",
  margin: "0 auto",
  borderRadius: "50%",
  border: "1px solid rgba(201,156,255,.24)",
  background: "rgba(168,85,247,.12)",
  color: "white",
  fontSize: "1.3rem",
  cursor: "pointer",
};

const monthTitleWrap: React.CSSProperties = {
  textAlign: "center",
};

const monthTitle: React.CSSProperties = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "clamp(1.5rem, 3vw, 2.3rem)",
  fontWeight: 700,
};

const monthSubtitle: React.CSSProperties = {
  marginTop: "6px",
  color: "#cbb8e8",
  fontSize: "0.92rem",
};

const weekGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 10,
  marginBottom: 10,
};

const weekDayStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#d8b4fe",
  fontWeight: 700,
  fontSize: "0.88rem",
  letterSpacing: "0.08em",
  padding: "8px 0",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 10,
};

const calendarCellStyle: React.CSSProperties = {
  minHeight: 82,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "white",
  position: "relative",
  cursor: "pointer",
  fontWeight: 700,
  overflow: "hidden",
};

const calendarCellOtherMonth: React.CSSProperties = {
  color: "rgba(255,255,255,0.28)",
};

const calendarCellSelected: React.CSSProperties = {
  border: "1px solid #d8b4fe",
  background: "rgba(168,85,247,0.16)",
  boxShadow: "0 0 18px rgba(168,85,247,.18)",
};

const calendarCellToday: React.CSSProperties = {
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,.28)",
};

const dayNumberStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
};

const eventDotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#f0cf88",
  position: "absolute",
  left: 12,
  bottom: 12,
  zIndex: 2,
  boxShadow: "0 0 10px rgba(240,207,136,.55)",
};

const selectedGlowStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "radial-gradient(circle at center, rgba(168,85,247,.10), transparent 70%)",
  pointerEvents: "none",
};

const eventsSectionStyle: React.CSSProperties = {
  marginTop: 30,
};

const eventsHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 14,
  marginBottom: 20,
};

const eventsTitle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "1.9rem",
  whiteSpace: "nowrap",
};

const eventsLine: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: "linear-gradient(90deg, transparent, rgba(216,180,254,.4), transparent)",
};

const emptyTextStyle: React.CSSProperties = {
  color: "#d8b4fe",
  lineHeight: 1.7,
};

const eventsListStyle: React.CSSProperties = {
  display: "grid",
  gap: 16,
};

const eventCardStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 300px",
  gap: 20,
  padding: "22px",
  borderRadius: "22px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const eventInfoStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const eventDatePill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  alignSelf: "flex-start",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(168,85,247,.14)",
  border: "1px solid rgba(216,180,254,.18)",
  color: "#e9d5ff",
  fontSize: "0.9rem",
  marginBottom: "12px",
};

const eventTitleStyle: React.CSSProperties = {
  fontSize: "1.8rem",
  fontWeight: 800,
  lineHeight: 1.2,
};

const eventLocationStyle: React.CSSProperties = {
  marginTop: 10,
  color: "#d8b4fe",
  fontWeight: 600,
};

const eventDescriptionStyle: React.CSSProperties = {
  marginTop: 14,
  lineHeight: 1.8,
  color: "#e6dff3",
};

const eventActionsRowStyle: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const eventDetailsBtnStyle: React.CSSProperties = {
  border: "1px solid rgba(203,161,255,.35)",
  borderRadius: "999px",
  padding: "8px 14px",
  background: "rgba(255,255,255,.05)",
  color: "#f2e8ff",
  textDecoration: "none",
  fontWeight: 700,
};

const imageBoxStyle: React.CSSProperties = {
  minHeight: "220px",
  borderRadius: "18px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.02)",
};

const eventImageStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const imagePlaceholderStyle: React.CSSProperties = {
  color: "#fca5a5",
  textAlign: "center",
  padding: "16px",
};
