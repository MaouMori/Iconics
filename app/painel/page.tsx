"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import "./painel.css";

type Profile = {
  id?: string;
  nome: string | null;
  cargo: string;
  email?: string | null;
  avatar_url?: string | null;
};

type EventItem = {
  id: number;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  horario: string | null;
  local: string | null;
  imagem_url: string | null;
};

export default function PainelPage() {
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroPerfil, setErroPerfil] = useState("");
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());

  useEffect(() => {
    async function load() {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) setErroPerfil(userError.message);

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const currentUserId = userData.user.id;
      const currentUserEmail = userData.user.email || "";
      setEmail(currentUserEmail);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, nome, cargo, email, avatar_url")
        .eq("id", currentUserId)
        .maybeSingle();

      if (profileError) setErroPerfil(profileError.message);

      if (profileData) {
        setProfile(profileData);
      } else {
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (accessToken) {
          await fetch("/api/profiles/ensure", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });
        }

        setProfile({
          id: currentUserId,
          nome:
            userData.user.user_metadata?.nome ||
            currentUserEmail.split("@")[0] ||
            "Sem nome",
          cargo: "membro",
          email: currentUserEmail,
          avatar_url: null,
        });
      }

      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .order("data_evento", { ascending: true });

      const loadedEvents = eventsData || [];
      setEvents(loadedEvents);

      if (loadedEvents.length > 0) {
        setSelectedEventId(loadedEvents[0].id);

        const firstDate = new Date(`${loadedEvents[0].data_evento}T00:00:00`);
        setCalendarDate(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    const maxSize = 2 * 1024 * 1024;
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (file.size > maxSize) {
      setAvatarMessage("Erro: a imagem deve ter no máximo 2 MB.");
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setAvatarMessage("Erro: formato inválido. Use JPEG, PNG, WebP ou GIF.");
      return;
    }

    setAvatarLoading(true);
    setAvatarMessage("");

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${profile.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      setAvatarLoading(false);
      setAvatarMessage(`Erro ao enviar imagem: ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", profile.id);

    if (updateError) {
      setAvatarLoading(false);
      setAvatarMessage("Erro ao salvar avatar.");
      return;
    }

    setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
    setAvatarLoading(false);
    setAvatarMessage("Foto de perfil atualizada com sucesso.");
  }

  function goPrevMonth() {
    setCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }

  function goNextMonth() {
    setCalendarDate(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }

  const cargoNormalizado = String(profile?.cargo || "membro").trim().toLowerCase();
  const isAdmin = cargoNormalizado === "lider" || cargoNormalizado === "vice_lider";

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) || events[0] || null;

  const avatarUrl = useMemo(() => {
    const seed = encodeURIComponent(profile?.nome || email || "iconics");
    return `https://api.dicebear.com/9.x/adventurer-neutral/svg?seed=${seed}`;
  }, [profile?.nome, email]);

  const profileStrength = useMemo(() => {
    const base =
      cargoNormalizado === "lider"
        ? 96
        : cargoNormalizado === "vice_lider"
        ? 88
        : cargoNormalizado === "veterano"
        ? 76
        : 64;

    const eventBonus = Math.min(events.length * 3, 18);
    return Math.min(100, base + eventBonus);
  }, [cargoNormalizado, events.length]);

  const selectedEventDate = useMemo(() => {
    if (!selectedEvent?.data_evento) return null;
    return new Date(`${selectedEvent.data_evento}T00:00:00`);
  }, [selectedEvent]);

  const monthLabel = useMemo(() => {
    return calendarDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [calendarDate]);

  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | "")[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push("");
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }

    while (cells.length < 42) {
      cells.push("");
    }

    return cells;
  }, [calendarDate]);

  const highlightedDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    return events
      .filter((event) => {
        const d = new Date(`${event.data_evento}T00:00:00`);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((event) => new Date(`${event.data_evento}T00:00:00`).getDate());
  }, [events, calendarDate]);

  const selectedDay = useMemo(() => {
    if (!selectedEventDate) return null;

    const sameMonth =
      selectedEventDate.getFullYear() === calendarDate.getFullYear() &&
      selectedEventDate.getMonth() === calendarDate.getMonth();

    return sameMonth ? selectedEventDate.getDate() : null;
  }, [selectedEventDate, calendarDate]);

  const filteredMonthEvents = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    return events.filter((event) => {
      const d = new Date(`${event.data_evento}T00:00:00`);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [events, calendarDate]);

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="painel-page">
          <div className="painel-loader"><Spinner texto="Carregando portal da ICONICS..." /></div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />

      <main className="painel-page">
        <div className="painel-bg-orb painel-bg-orb-top" />
        <div className="painel-bg-orb painel-bg-orb-bottom" />
        <div className="painel-noise" />

        <div className="painel-shell">
          <header className="painel-header glass-card">
            <div className="painel-brand">
              <div className="painel-brand-icon">I</div>

              <div>
                <p className="painel-kicker">Fraternidade</p>
                <h1 className="painel-title">ICONICS</h1>
              </div>
            </div>

            <div className="painel-header-right">
              <div className="painel-handle">
                @{(email ? email.split("@")[0] : "iconics_member").toUpperCase()}
              </div>
              <div className="painel-subhandle">Perfil do membro</div>
            </div>
          </header>

          {erroPerfil && (
            <div className="banner banner-error">
              Erro ao carregar perfil: {erroPerfil}
            </div>
          )}

          <div className="banner banner-info">
            Bem-vindo ao seu portal Iconics.
          </div>

          <div className="painel-grid painel-grid-3">
            <section className="painel-col painel-col-left">
              <div className="glass-card avatar-panel">
                <div className="avatar-ring">
                  <div className="avatar-core">
                    <img
                      src={profile?.avatar_url || avatarUrl}
                      alt="Avatar"
                      className="avatar-image"
                    />
                  </div>
                </div>

                <label className="upload-btn">
                  {avatarLoading ? "Enviando..." : "Trocar foto"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadAvatar}
                    hidden
                  />
                </label>

                {avatarMessage && <Toast mensagem={avatarMessage} onClose={() => setAvatarMessage("")} />}

                <div className="mini-card">
                  <p className="mini-label">Status</p>
                  <p className="mini-value">
                    {cargoNormalizado === "lider"
                      ? "Supreme"
                      : cargoNormalizado === "vice_lider"
                      ? "Elite"
                      : cargoNormalizado === "veterano"
                      ? "Destaque"
                      : "Ascendente"}
                  </p>
                </div>

                <div className="mini-card">
                  <p className="mini-label">Força do perfil</p>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{ width: `${profileStrength}%` }}
                    />
                  </div>
                  <p className="mini-small">{profileStrength}%</p>
                </div>
              </div>

              <div className="glass-card focus-panel">
                <div className="panel-head">
                  <p className="panel-kicker">Meu evento em foco</p>
                  <span className="panel-muted">Destaque</span>
                </div>

                {selectedEvent ? (
                  <div className="event-highlight event-highlight-locked">
                    <div className="event-cover event-cover-locked">
                      <img
                        src={selectedEvent.imagem_url || "/images/emblema.png"}
                        alt={selectedEvent.titulo}
                        className="event-cover-img"
                      />
                    </div>

                    <div className="event-content">
                      <div className="event-chips">
                        <span className="chip chip-primary">Evento</span>
                        <span className="chip chip-muted">
                          {formatEventDate(selectedEvent.data_evento)}
                        </span>
                      </div>

                      <h3 className="event-title">{selectedEvent.titulo}</h3>
                      <p className="event-desc">
                        {selectedEvent.descricao || "Sem descrição."}
                      </p>
                      <p className="event-foot">
                        {selectedEvent.local || "Sem local"} •{" "}
                        {selectedEvent.horario || "Sem horário"}
                      </p>

                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          window.location.href = `/evento/${selectedEvent.id}`;
                        }}
                      >
                        Saiba mais
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="empty-card">Nenhum evento cadastrado ainda.</div>
                )}
              </div>
            </section>

            <section className="painel-col painel-col-middle">
              <div className="glass-card profile-panel">
                <div className="profile-top">
                  <div>
                    <h2 className="profile-name">
                      {profile?.nome || email.split("@")[0] || "Sem nome"}
                    </h2>

                    <div className="profile-meta">
                      <p>
                        Rank: <span>♛ {getCargoLabel(cargoNormalizado)}</span>
                      </p>
                      <p>
                        E-mail: <strong>{email || "Não identificado"}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="profile-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => (window.location.href = "/calendario")}
                    >
                      Calendário
                    </button>

                    <button
                      className="btn btn-secondary"
                      onClick={() => (window.location.href = "/painel/vinculo")}
                    >
                      Meu card
                    </button>

                    {isAdmin && (
                      <button
                        className="btn btn-secondary"
                        onClick={() => (window.location.href = "/admin")}
                      >
                        Painel Admin
                      </button>
                    )}
                  </div>
                </div>

                <p className="profile-bio">
                  Presença, estética e influência. Onde os outros seguem tendências,
                  a ICONICS cria impacto.
                </p>

                <div className="stats-grid">
                  {[
                    { label: "Cargo", value: getCargoLabel(cargoNormalizado) },
                    { label: "Eventos", value: `${events.length} ativos` },
                    {
                      label: "Status",
                      value:
                        cargoNormalizado === "lider"
                          ? "Supreme"
                          : cargoNormalizado === "vice_lider"
                          ? "Elite"
                          : cargoNormalizado === "veterano"
                          ? "Destaque"
                          : "Ascendente",
                    },
                    { label: "Força do perfil", value: `${profileStrength}%` },
                  ].map((item) => (
                    <div key={item.label} className="stat-card">
                      <p className="stat-label">{item.label}</p>
                      <p className="stat-value">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card full-events-panel">
                <div className="panel-head">
                  <p className="panel-kicker">Eventos da fraternidade</p>
                  <span className="panel-muted">{events.length} visíveis</span>
                </div>

                {events.length > 0 ? (
                  <div className="events-grid">
                    {events.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        className={`event-card ${selectedEventId === event.id ? "active" : ""}`}
                        onClick={() => {
                          window.location.href = `/evento/${event.id}`;
                        }}
                      >
                        <div className="event-card-image-wrap">
                          <img
                            src={event.imagem_url || "/images/emblema.png"}
                            alt={event.titulo}
                            className="event-card-image"
                          />
                        </div>

                        <div className="event-card-body">
                          <div className="event-chips">
                            <span className="chip chip-primary">Evento</span>
                            <span className="chip chip-muted">
                              {formatEventDate(event.data_evento)}
                            </span>
                          </div>

                          <h3 className="event-card-title">{event.titulo}</h3>

                          <p className="event-card-desc">
                            {event.descricao || "Sem descrição."}
                          </p>

                          <p className="event-card-foot">
                            {event.local || "Sem local"} • {event.horario || "Sem horário"}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="empty-card">Nenhum evento cadastrado ainda.</div>
                )}
              </div>
            </section>

            <aside className="painel-col painel-col-right">
              <div className="glass-card calendar-panel">
                <div className="panel-row">
                  <div>
                    <h3 className="sidebar-title">Meu Calendário</h3>
                    <p className="calendar-month">{monthLabel}</p>
                  </div>

                  <div className="calendar-nav">
                    <button className="calendar-nav-btn" onClick={goPrevMonth}>
                      ←
                    </button>
                    <button className="calendar-nav-btn" onClick={goNextMonth}>
                      →
                    </button>
                  </div>
                </div>

                <div className="week-header">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                    <div key={day} className="week-header-item">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="calendar-grid">
                  {calendarDays.map((day, index) => {
                    const isHighlighted =
                      typeof day === "number" && highlightedDays.includes(day);
                    const isSelected = typeof day === "number" && day === selectedDay;

                    return (
                      <button
                        key={`${day}-${index}`}
                        disabled={day === ""}
                        onClick={() => {
                          const foundEvent = events.find((event) => {
                            const d = new Date(`${event.data_evento}T00:00:00`);
                            return (
                              d.getFullYear() === calendarDate.getFullYear() &&
                              d.getMonth() === calendarDate.getMonth() &&
                              d.getDate() === day
                            );
                          });

                          if (foundEvent) {
                            window.location.href = `/evento/${foundEvent.id}`;
                          }
                        }}
                        className={[
                          "calendar-cell",
                          day === "" ? "empty" : "",
                          isHighlighted ? "highlight" : "",
                          isSelected ? "selected" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="next-box">
                  <p className="next-label">Próximos eventos</p>

                  <div className="next-list">
                    {filteredMonthEvents.length > 0 ? (
                      filteredMonthEvents.map((item) => {
                        const eventDate = new Date(`${item.data_evento}T00:00:00`);
                        const day = String(eventDate.getDate()).padStart(2, "0");
                        const month = eventDate
                          .toLocaleDateString("pt-BR", { month: "short" })
                          .replace(".", "")
                          .toUpperCase();

                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              window.location.href = `/evento/${item.id}`;
                            }}
                            className="next-item"
                          >
                            <span className="next-dot" />
                            <span>
                              {day} {month} · {item.titulo}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <p className="next-empty">Sem eventos neste mês.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="glass-card info-panel">
                <div className="panel-head">
                  <p className="panel-kicker">Informações</p>
                  <span className="panel-muted">Visualização</span>
                </div>

                <div className="info-list">
                  {[
                    ["Nome", profile?.nome || "Sem nome"],
                    ["Usuário", email ? `@${email.split("@")[0]}` : "@iconics_member"],
                    ["E-mail", email || "Não identificado"],
                    ["Cargo", getCargoLabel(cargoNormalizado)],
                    ["Acesso admin", isAdmin ? "Liberado" : "Não"],
                    ["Eventos ativos", String(events.length)],
                  ].map(([label, value]) => (
                    <div key={label} className="info-item">
                      <p className="info-label">{label}</p>
                      <p className="info-value">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

function formatEventDate(dateString?: string | null) {
  if (!dateString) return "Sem data";
  const date = new Date(`${dateString}T00:00:00`);
  return date.toLocaleDateString("pt-BR");
}

function getCargoLabel(cargo: string) {
  const map: Record<string, string> = {
    lider: "Líder",
    vice_lider: "Vice-líder",
    veterano: "Veterano",
    membro: "Membro",
  };

  return map[cargo] || cargo;
}
