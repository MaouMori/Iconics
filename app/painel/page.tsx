"use client";

import TopBar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";

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

  useEffect(() => {
    async function load() {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) {
        setErroPerfil(userError.message);
      }

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

      if (profileError) {
        setErroPerfil(profileError.message);
      }

      if (profileData) {
        setProfile(profileData);
      } else {
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
        .order("data_evento", { ascending: true })
        .limit(12);

      const loadedEvents = eventsData || [];
      setEvents(loadedEvents);

      if (loadedEvents.length > 0) {
        setSelectedEventId(loadedEvents[0].id);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile?.id) return;

    setAvatarLoading(true);
    setAvatarMessage("");

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${profile.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        upsert: true,
      });

      if (uploadError) {
        setAvatarLoading(false);
        setAvatarMessage(`Erro ao enviar imagem: ${uploadError.message}`);
        return;
      }

    const { data } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

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

    setProfile((prev) =>
      prev ? { ...prev, avatar_url: publicUrl } : prev
    );

    setAvatarLoading(false);
    setAvatarMessage("Foto de perfil atualizada com sucesso.");
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
    if (!selectedEvent?.data_evento) return new Date();
    return new Date(`${selectedEvent.data_evento}T00:00:00`);
  }, [selectedEvent]);

  const monthLabel = useMemo(() => {
    return selectedEventDate.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  }, [selectedEventDate]);

  const calendarDays = useMemo(() => {
    const year = selectedEventDate.getFullYear();
    const month = selectedEventDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | "")[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push("");
    }

    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }

    while (cells.length < 35) {
      cells.push("");
    }

    return cells;
  }, [selectedEventDate]);

  const highlightedDays = useMemo(() => {
    const year = selectedEventDate.getFullYear();
    const month = selectedEventDate.getMonth();

    return events
      .filter((event) => {
        const d = new Date(`${event.data_evento}T00:00:00`);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .map((event) => new Date(`${event.data_evento}T00:00:00`).getDate());
  }, [events, selectedEventDate]);

  const selectedDay = useMemo(() => {
    return selectedEventDate.getDate();
  }, [selectedEventDate]);

  if (loading) {
    return <main style={pageStyle}>Carregando...</main>;
  }

  return (
    <>
      <TopBar />

      <main style={pageStyle}>
        <div style={bgGlowTop} />
        <div style={bgGlowBottom} />
        <div style={bgNoise} />

        <div style={containerStyle}>
          <header style={headerShell}>
            <div style={brandRow}>
              <div style={brandIcon}>I</div>
              <div>
                <p style={brandKicker}>Fraternidade</p>
                <h1 style={brandTitle}>ICONICS</h1>
              </div>
            </div>

            <div style={headerRight}>
              <div style={handleText}>
                @{(email ? email.split("@")[0] : "iconics_member").toUpperCase()}
              </div>
              <div style={handleSubtext}>Perfil do membro</div>
            </div>
          </header>

          {erroPerfil && <div style={errorBanner}>Erro ao carregar perfil: {erroPerfil}</div>}

          <div style={messageBanner}>Bem-vindo ao seu perfil Iconics.</div>

          <div style={mainGrid}>
            <section style={leftColumn}>
              <div style={heroGrid}>
                <div style={avatarPanel}>
                  <div style={avatarOuter}>
                    <div style={avatarInner}>
                      <img
                        src={profile?.avatar_url || avatarUrl}
                        alt="Avatar"
                        style={avatarImage}
                      />
                      <div style={avatarShade} />
                    </div>
                  </div>

                  <label style={uploadButton}>
                    {avatarLoading ? "Enviando..." : "Trocar foto"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadAvatar}
                      style={{ display: "none" }}
                    />
                  </label>

                  {avatarMessage && <p style={avatarMessageStyle}>{avatarMessage}</p>}

                  <div style={miniInfoCard}>
                    <p style={miniLabel}>Status</p>
                    <p style={miniValue}>
                      {cargoNormalizado === "lider"
                        ? "Supreme"
                        : cargoNormalizado === "vice_lider"
                        ? "Elite"
                        : cargoNormalizado === "veterano"
                        ? "Destaque"
                        : "Ascendente"}
                    </p>
                  </div>

                  <div style={miniInfoCard}>
                    <p style={miniLabel}>Força do perfil</p>
                    <div style={progressTrack}>
                      <div style={{ ...progressFill, width: `${profileStrength}%` }} />
                    </div>
                    <p style={miniSmall}>{profileStrength}%</p>
                  </div>
                </div>

                <div style={profileHeroPanel}>
                  <div style={profileTopRow}>
                    <div>
                      <h2 style={profileName}>{profile?.nome || email.split("@")[0] || "Sem nome"}</h2>

                      <div style={profileMetaList}>
                        <p style={profileMetaText}>
                          Rank: <span style={profileMetaAccent}>♛ {getCargoLabel(cargoNormalizado)}</span>
                        </p>
                        <p style={profileMetaText}>
                          E-mail: <span style={profileMetaStrong}>{email || "Não identificado"}</span>
                        </p>
                      </div>
                    </div>

                    <div style={heroActions}>
                      <button
                        style={primaryAction}
                        onClick={() => (window.location.href = "/calendario")}
                      >
                        Calendário
                      </button>

                      {isAdmin && (
                        <button
                          style={secondaryAction}
                          onClick={() => (window.location.href = "/admin")}
                        >
                          Painel Admin
                        </button>
                      )}
                    </div>
                  </div>

                  <p style={profileBio}>
                    Presença, estética e influência. Onde os outros seguem tendências, a Iconics cria impacto.
                  </p>

                  <div style={statsGrid}>
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
                      <div key={item.label} style={statCard}>
                        <p style={statLabel}>{item.label}</p>
                        <p style={statValue}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={contentGrid}>
                <div style={infoPanel}>
                  <div style={panelHeaderRow}>
                    <p style={sectionKicker}>Informações</p>
                    <span style={sectionMuted}>Visualização</span>
                  </div>

                  <div style={infoList}>
                    {[
                      ["Nome", profile?.nome || "Sem nome"],
                      ["Usuário", email ? `@${email.split("@")[0]}` : "@iconics_member"],
                      ["E-mail", email || "Não identificado"],
                      ["Cargo", getCargoLabel(cargoNormalizado)],
                      ["Acesso admin", isAdmin ? "Liberado" : "Não"],
                      ["Eventos ativos", String(events.length)],
                    ].map(([label, value]) => (
                      <div key={label} style={infoItem}>
                        <p style={infoItemLabel}>{label}</p>
                        <p style={infoItemValue}>{value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={featurePanel}>
                  <div style={panelHeaderRow}>
                    <p style={sectionKicker}>Resumo do evento</p>
                    <span style={sectionMuted}>Selecionado</span>
                  </div>

                  {selectedEvent ? (
                    <div style={eventHighlightCard}>
                      <div style={eventImageWrap}>
                        <img
                          src={selectedEvent.imagem_url || "/images/emblema.png"}
                          alt={selectedEvent.titulo}
                          style={eventImage}
                        />
                      </div>

                      <div style={eventBody}>
                        <div style={eventMetaChips}>
                          <span style={chipPrimary}>Evento</span>
                          <span style={chipMuted}>{formatEventDate(selectedEvent.data_evento)}</span>
                        </div>

                        <h3 style={eventTitle}>{selectedEvent.titulo}</h3>
                        <p style={eventDesc}>{selectedEvent.descricao || "Sem descrição."}</p>
                        <p style={eventFoot}>
                          {selectedEvent.local || "Sem local"} • {selectedEvent.horario || "Sem horário"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div style={emptyCard}>Nenhum evento cadastrado ainda.</div>
                  )}
                </div>
              </div>
            </section>

            <aside style={rightColumn}>
              <div style={sidebarPanel}>
                <div style={panelTopSpaceBetween}>
                  <h3 style={sidebarTitle}>Eventos</h3>
                  <button
                    style={ghostButton}
                    onClick={() => (window.location.href = "/calendario")}
                  >
                    Ver mais
                  </button>
                </div>

                <div style={eventList}>
                  {events.map((event) => {
                    const eventDate = new Date(`${event.data_evento}T00:00:00`);
                    const day = eventDate.getDate();
                    const month = eventDate
                      .toLocaleDateString("pt-BR", { month: "short" })
                      .replace(".", "")
                      .toUpperCase();

                    const active = selectedEventId === event.id;

                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEventId(event.id)}
                        style={{
                          ...eventListItem,
                          ...(active ? eventListItemActive : {}),
                        }}
                      >
                        <div style={eventDateBox}>
                          <span style={eventDateDay}>{day}</span>
                          <span style={eventDateMonth}>{month}</span>
                        </div>

                        <div style={eventListContent}>
                          <div>
                            <p style={eventListType}>{event.local || "Evento"}</p>
                            <p style={eventListTitle}>{event.titulo}</p>
                          </div>

                          <div style={eventThumbWrap}>
                            <img
                              src={event.imagem_url || "/images/emblema.png"}
                              alt={event.titulo}
                              style={eventThumb}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {events.length === 0 && <div style={emptyCard}>Nenhum evento cadastrado.</div>}
                </div>
              </div>

              <div style={sidebarPanel}>
                <div style={panelTopSpaceBetween}>
                  <div>
                    <h3 style={sidebarTitle}>Meu Calendário</h3>
                    <p style={calendarMonthText}>{monthLabel}</p>
                  </div>
                </div>

                <div style={weekHeader}>
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((day) => (
                    <div key={day} style={weekHeaderItem}>
                      {day}
                    </div>
                  ))}
                </div>

                <div style={calendarGridStyle}>
                  {calendarDays.map((day, index) => {
                    const isHighlighted = typeof day === "number" && highlightedDays.includes(day);
                    const isSelected = typeof day === "number" && day === selectedDay;

                    return (
                      <button
                        key={`${day}-${index}`}
                        disabled={day === ""}
                        onClick={() => {
                          const foundEvent = events.find((event) => {
                            const d = new Date(`${event.data_evento}T00:00:00`);
                            return (
                              d.getFullYear() === selectedEventDate.getFullYear() &&
                              d.getMonth() === selectedEventDate.getMonth() &&
                              d.getDate() === day
                            );
                          });

                          if (foundEvent) setSelectedEventId(foundEvent.id);
                        }}
                        style={{
                          ...calendarCell,
                          ...(day === "" ? calendarCellEmpty : {}),
                          ...(isHighlighted ? calendarCellHighlight : {}),
                          ...(isSelected ? calendarCellSelected : {}),
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div style={nextEventsBox}>
                  <p style={nextEventsLabel}>Próximos eventos</p>

                  <div style={nextEventsList}>
                    {events.map((item) => {
                      const eventDate = new Date(`${item.data_evento}T00:00:00`);
                      const day = String(eventDate.getDate()).padStart(2, "0");
                      const month = eventDate
                        .toLocaleDateString("pt-BR", { month: "short" })
                        .replace(".", "")
                        .toUpperCase();

                      return (
                        <button
                          key={item.id}
                          onClick={() => setSelectedEventId(item.id)}
                          style={nextEventItem}
                        >
                          <span style={nextEventDot} />
                          <span>
                            {day} {month} · {item.titulo}
                          </span>
                        </button>
                      );
                    })}

                    {events.length === 0 && <p style={nextEventEmpty}>Sem próximos eventos.</p>}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(180deg, #07030f 0%, #120021 100%)",
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
  background: "rgba(167,92,255,0.18)",
  filter: "blur(120px)",
  pointerEvents: "none",
};

const bgGlowBottom: React.CSSProperties = {
  position: "absolute",
  right: -140,
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
  backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,.04) 1px, transparent 1px)",
  backgroundSize: "120px 120px",
  opacity: 0.14,
  pointerEvents: "none",
};

const containerStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: 1320,
  margin: "0 auto",
  padding: "110px 24px 36px",
};

const headerShell: React.CSSProperties = {
  marginBottom: 24,
  borderRadius: 28,
  border: "1px solid rgba(180,80,255,0.18)",
  background: "rgba(0,0,0,0.28)",
  backdropFilter: "blur(18px)",
  boxShadow: "0 0 40px rgba(180,80,255,0.12)",
  padding: "22px 28px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
  flexWrap: "wrap",
};

const brandRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
};

const brandIcon: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 18,
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(216,180,254,.35)",
  background: "linear-gradient(135deg, rgba(168,85,247,.30), rgba(91,33,182,.10))",
  boxShadow: "0 0 26px rgba(180,80,255,0.18)",
  fontSize: 28,
  fontWeight: 900,
  letterSpacing: 2,
};

const brandKicker: React.CSSProperties = {
  color: "rgba(232,196,255,.78)",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.4em",
  margin: 0,
};

const brandTitle: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: "clamp(2rem, 4vw, 3.2rem)",
  lineHeight: 1,
  fontWeight: 900,
};

const headerRight: React.CSSProperties = {
  textAlign: "right",
};

const handleText: React.CSSProperties = {
  color: "#d8b4fe",
  fontSize: 24,
  fontWeight: 900,
  letterSpacing: 1,
};

const handleSubtext: React.CSSProperties = {
  color: "#b3a3c9",
  textTransform: "uppercase",
  letterSpacing: "0.35em",
  fontSize: 12,
  marginTop: 6,
};

const errorBanner: React.CSSProperties = {
  marginBottom: 18,
  borderRadius: 18,
  border: "1px solid rgba(248,113,113,.18)",
  background: "rgba(127,29,29,.20)",
  padding: "14px 16px",
  color: "#fecaca",
};

const messageBanner: React.CSSProperties = {
  marginBottom: 24,
  borderRadius: 18,
  border: "1px solid rgba(180,80,255,0.16)",
  background: "rgba(168,85,247,.12)",
  padding: "14px 16px",
  color: "#f3e8ff",
  boxShadow: "0 0 18px rgba(180,80,255,0.10)",
};

const mainGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.45fr 0.95fr",
  gap: 24,
};

const leftColumn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const rightColumn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const heroGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "340px 1fr",
  gap: 24,
};

const avatarPanel: React.CSSProperties = {
  borderRadius: 32,
  border: "1px solid rgba(180,80,255,0.20)",
  background: "rgba(0,0,0,0.28)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 0 36px rgba(180,80,255,0.12)",
  padding: 22,
};

const avatarOuter: React.CSSProperties = {
  width: "100%",
  maxWidth: 290,
  aspectRatio: "1 / 1",
  borderRadius: "999px",
  padding: 3,
  margin: "0 auto",
  background: "linear-gradient(135deg, #f0abfc, #8b5cf6, #d8b4fe)",
  boxShadow: "0 0 48px rgba(180,80,255,0.28)",
};

const avatarInner: React.CSSProperties = {
  position: "relative",
  width: "100%",
  height: "100%",
  borderRadius: "999px",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "#0a0711",
};

const avatarImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const avatarShade: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "linear-gradient(to top, rgba(0,0,0,.46), transparent)",
};

const uploadButton: React.CSSProperties = {
  marginTop: 16,
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(168,85,247,0.4)",
  background: "rgba(168,85,247,0.15)",
  color: "#f5d0fe",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "center",
};

const avatarMessageStyle: React.CSSProperties = {
  marginTop: 12,
  color: "#d8b4fe",
  fontSize: 13,
  lineHeight: 1.5,
};

const miniInfoCard: React.CSSProperties = {
  marginTop: 18,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  padding: 16,
};

const miniLabel: React.CSSProperties = {
  margin: 0,
  color: "#a1a1aa",
  textTransform: "uppercase",
  letterSpacing: "0.25em",
  fontSize: 11,
};

const miniValue: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#f0abfc",
  fontSize: 28,
  fontWeight: 900,
};

const progressTrack: React.CSSProperties = {
  marginTop: 12,
  height: 12,
  borderRadius: 999,
  background: "rgba(255,255,255,0.10)",
  overflow: "hidden",
};

const progressFill: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, #f0abfc, #8b5cf6)",
};

const miniSmall: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#d4d4d8",
  fontSize: 13,
};

const profileHeroPanel: React.CSSProperties = {
  borderRadius: 32,
  border: "1px solid rgba(180,80,255,0.20)",
  background: "rgba(0,0,0,0.28)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 0 36px rgba(180,80,255,0.12)",
  padding: 28,
  minHeight: 100,
};

const profileTopRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 20,
  flexWrap: "wrap",
};

const profileName: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(2.2rem, 4vw, 4rem)",
  fontWeight: 900,
  lineHeight: 1,
};

const profileMetaList: React.CSSProperties = {
  marginTop: 18,
  display: "flex",
  flexDirection: "column",
  gap: 8,
};

const profileMetaText: React.CSSProperties = {
  margin: 0,
  color: "#d4d4d8",
  fontSize: 18,
};

const profileMetaAccent: React.CSSProperties = {
  color: "#f0abfc",
  fontWeight: 800,
};

const profileMetaStrong: React.CSSProperties = {
  color: "#fff",
  fontWeight: 700,
};

const heroActions: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const primaryAction: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(216,180,254,.35)",
  background: "rgba(168,85,247,.16)",
  color: "#f5f3ff",
  fontWeight: 800,
  padding: "14px 20px",
  cursor: "pointer",
};

const secondaryAction: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(251,191,36,.28)",
  background: "rgba(251,191,36,.10)",
  color: "#fde68a",
  fontWeight: 800,
  padding: "14px 20px",
  cursor: "pointer",
};

const profileBio: React.CSSProperties = {
  marginTop: 24,
  maxWidth: 820,
  color: "#d4d4d8",
  lineHeight: 1.8,
  fontSize: 18,
};

const statsGrid: React.CSSProperties = {
  marginTop: 28,
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(140px, 1fr))",
  gap: 14,
  alignItems: "stretch",
};

const statCard: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  padding: "18px 16px",
  minHeight: 120,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
};

const statLabel: React.CSSProperties = {
  margin: 0,
  color: "#a1a1aa",
  textTransform: "uppercase",
  letterSpacing: "0.20em",
  fontSize: 10,
  lineHeight: 1.4,
};

const statValue: React.CSSProperties = {
  margin: "14px 0 0",
  color: "#fff",
  fontSize: 20,
  fontWeight: 900,
  lineHeight: 1.15,
  wordBreak: "break-word",
};

const contentGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "0.95fr 1.05fr",
  gap: 24,
};

const infoPanel: React.CSSProperties = {
  borderRadius: 32,
  border: "1px solid rgba(180,80,255,0.20)",
  background: "rgba(0,0,0,0.28)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 0 36px rgba(180,80,255,0.12)",
  padding: 24,
};

const featurePanel: React.CSSProperties = {
  borderRadius: 32,
  border: "1px solid rgba(180,80,255,0.20)",
  background: "rgba(0,0,0,0.28)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 0 36px rgba(180,80,255,0.12)",
  padding: 24,
};

const panelHeaderRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 18,
};

const sectionKicker: React.CSSProperties = {
  margin: 0,
  color: "#e879f9",
  textTransform: "uppercase",
  letterSpacing: "0.35em",
  fontSize: 11,
};

const sectionMuted: React.CSSProperties = {
  color: "#71717a",
  fontSize: 14,
};

const infoList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const infoItem: React.CSSProperties = {
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  padding: 16,
};

const infoItemLabel: React.CSSProperties = {
  margin: 0,
  color: "#a1a1aa",
  textTransform: "uppercase",
  letterSpacing: "0.22em",
  fontSize: 11,
};

const infoItemValue: React.CSSProperties = {
  margin: "10px 0 0",
  color: "#fff",
  fontWeight: 700,
  fontSize: 18,
};

const eventHighlightCard: React.CSSProperties = {
  overflow: "hidden",
  borderRadius: 28,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
};

const eventImageWrap: React.CSSProperties = {
  width: "100%",
  height: 260,
  overflow: "hidden",
};

const eventImage: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const eventBody: React.CSSProperties = {
  padding: 20,
};

const eventMetaChips: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  marginBottom: 12,
};

const chipPrimary: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  borderRadius: 999,
  border: "1px solid rgba(232,121,249,.30)",
  background: "rgba(168,85,247,.14)",
  color: "#f5d0fe",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.22em",
  padding: "8px 12px",
};

const chipMuted: React.CSSProperties = {
  color: "#a1a1aa",
  fontSize: 14,
};

const eventTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 32,
  fontWeight: 900,
};

const eventDesc: React.CSSProperties = {
  marginTop: 14,
  color: "#d4d4d8",
  lineHeight: 1.8,
  fontSize: 16,
};

const eventFoot: React.CSSProperties = {
  marginTop: 16,
  color: "#a1a1aa",
  fontSize: 14,
};

const sidebarPanel: React.CSSProperties = {
  borderRadius: 32,
  border: "1px solid rgba(180,80,255,0.20)",
  background: "rgba(0,0,0,0.28)",
  backdropFilter: "blur(16px)",
  boxShadow: "0 0 36px rgba(180,80,255,0.12)",
  padding: 20,
};

const panelTopSpaceBetween: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 14,
  marginBottom: 18,
};

const sidebarTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 32,
  fontWeight: 900,
};

const ghostButton: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(232,121,249,.28)",
  background: "rgba(168,85,247,.10)",
  color: "#f5d0fe",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.25em",
  padding: "10px 14px",
  cursor: "pointer",
};

const eventList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const eventListItem: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  display: "grid",
  gridTemplateColumns: "78px 1fr",
  gap: 14,
  borderRadius: 22,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  padding: 12,
  cursor: "pointer",
};

const eventListItemActive: React.CSSProperties = {
  border: "1px solid rgba(232,121,249,.45)",
  background: "rgba(168,85,247,.12)",
  boxShadow: "0 0 20px rgba(180,80,255,0.16)",
};

const eventDateBox: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid rgba(180,80,255,0.18)",
  background: "rgba(0,0,0,0.30)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 0",
};

const eventDateDay: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  lineHeight: 1,
};

const eventDateMonth: React.CSSProperties = {
  marginTop: 6,
  color: "#e879f9",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.28em",
};

const eventListContent: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 88px",
  gap: 12,
  alignItems: "center",
};

const eventListType: React.CSSProperties = {
  margin: 0,
  color: "#71717a",
  textTransform: "uppercase",
  letterSpacing: "0.22em",
  fontSize: 11,
};

const eventListTitle: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#fff",
  fontSize: 18,
  fontWeight: 800,
};

const eventThumbWrap: React.CSSProperties = {
  height: 64,
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.08)",
};

const eventThumb: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const calendarMonthText: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#a1a1aa",
  textTransform: "uppercase",
  letterSpacing: "0.26em",
  fontSize: 11,
};

const weekHeader: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 8,
  marginBottom: 12,
};

const weekHeaderItem: React.CSSProperties = {
  textAlign: "center",
  color: "#71717a",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: "0.22em",
  padding: "6px 0",
};

const calendarGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(7, 1fr)",
  gap: 8,
};

const calendarCell: React.CSSProperties = {
  aspectRatio: "1 / 1",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  color: "#d4d4d8",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};

const calendarCellEmpty: React.CSSProperties = {
  border: "1px solid transparent",
  background: "transparent",
  cursor: "default",
  color: "transparent",
};

const calendarCellHighlight: React.CSSProperties = {
  border: "1px solid rgba(232,121,249,.45)",
  background: "rgba(168,85,247,.12)",
  color: "#fff",
  boxShadow: "0 0 18px rgba(180,80,255,0.14)",
};

const calendarCellSelected: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,.28)",
  background: "rgba(168,85,247,.22)",
  color: "#fff",
  boxShadow: "0 0 18px rgba(180,80,255,0.22)",
};

const nextEventsBox: React.CSSProperties = {
  marginTop: 22,
  borderRadius: 22,
  border: "1px solid rgba(180,80,255,0.18)",
  background: "rgba(0,0,0,0.24)",
  padding: 16,
};

const nextEventsLabel: React.CSSProperties = {
  margin: "0 0 14px",
  color: "#e879f9",
  textTransform: "uppercase",
  letterSpacing: "0.30em",
  fontSize: 11,
};

const nextEventsList: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const nextEventItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  textAlign: "left",
  color: "#e4e4e7",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
};

const nextEventDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#e879f9",
  boxShadow: "0 0 12px rgba(232,121,249,.8)",
  flexShrink: 0,
};

const nextEventEmpty: React.CSSProperties = {
  margin: 0,
  color: "#71717a",
};

const emptyCard: React.CSSProperties = {
  borderRadius: 24,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.05)",
  padding: 20,
  color: "#d4d4d8",
};

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