"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

type TopBarProps = {
  showPainel?: boolean;
  showLogout?: boolean;
};

export default function TopBar({
  showPainel = true,
  showLogout = true,
}: TopBarProps) {
  const pathname = usePathname();
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [alertCount, setAlertCount] = useState(0);
  const [profile, setProfile] = useState<{
    nome?: string | null;
    cargo?: string | null;
    avatar_url?: string | null;
    level?: number;
    xp?: number;
    nextInfluence?: number;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 680 : false
  );
  const isAppRoute = Boolean(
    pathname?.startsWith("/painel") ||
    pathname?.startsWith("/rede") ||
    pathname?.startsWith("/missoes")
  );
  const useSidebar = isLogged && isAppRoute && !isMobile;

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      setIsLogged(!!data.session);
      setToken(data.session?.access_token || "");
      if (!data.session) setAlertCount(0);
      setLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLogged(!!session);
      setToken(session?.access_token || "");
      if (!session) setAlertCount(0);
      setLoading(false);
    });

    const onResize = () => setIsMobile(window.innerWidth <= 680);
    window.addEventListener("resize", onResize);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    async function loadSummary() {
      const response = await fetch("/api/social/notifications?summary=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok || !mounted) return;
      const payload = await response.json();
      setAlertCount((payload.unreadCount || 0) + (payload.adminPendingCount || 0));
    }

    loadSummary();
    const interval = setInterval(loadSummary, 10000);

    const channel = supabase
      .channel("topbar-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "site_notifications" }, () => {
        loadSummary();
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "member_card_link_requests" },
        () => {
          loadSummary();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [token]);

  useEffect(() => {
    if (!token || !useSidebar) {
      return;
    }

    let mounted = true;
    async function loadProfile() {
      const profileResponse = await fetch("/api/social/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const profilePayload = await profileResponse.json().catch(() => null);
      const missionResponse = await fetch("/api/missions", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const missionPayload = await missionResponse.json().catch(() => null);
      if (!mounted) return;
      setProfile({
        ...(profilePayload?.profile || {}),
        level: missionPayload?.profile?.level || 0,
        xp: missionPayload?.profile?.xp || 0,
        nextInfluence: missionPayload?.profile?.nextInfluence || 1,
      });
    }

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [token, useSidebar]);

  useEffect(() => {
    if (!useSidebar) {
      document.body.classList.remove("has-app-sidebar");
      return;
    }
    document.body.classList.add("has-app-sidebar");
    return () => document.body.classList.remove("has-app-sidebar");
  }, [useSidebar]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (useSidebar) {
    const xp = Number(profile?.xp || 0);
    const nextInfluence = Math.max(Number(profile?.nextInfluence || 1), 1);
    const xpPercent = Math.min(100, Math.round((xp / nextInfluence) * 100));
    const navItems = [
      { label: "Painel", href: "/painel", icon: "P" },
      { label: "Missoes", href: "/missoes", icon: "M" },
      { label: "Rede", href: "/rede", icon: "N" },
      { label: "Notificacoes", href: "/rede", icon: "!" },
      { label: "Mensagens", href: "/rede/mensagens", icon: "@" },
      { label: "Configuracoes", href: "/rede/config", icon: "S" },
    ];
    const coreItems = [
      { label: "Mansao", href: "/mansao", icon: "I" },
      { label: "Calendario", href: "/calendario", icon: "D" },
      { label: "Parcerias", href: "/parcerias", icon: "L" },
    ];

    return (
      <aside style={sidebarStyle}>
        <Link href="/painel" style={sidebarLogoStyle}>
          <img src="/images/iconics-logo.png" alt="ICONICS" style={sidebarLogoImageStyle} />
        </Link>

        <section style={sidebarProfileStyle}>
          <img src={profile?.avatar_url || "/images/iconics_emblem_main.png"} alt={profile?.nome || "Membro"} style={sidebarAvatarStyle} />
          <strong style={sidebarNameStyle}>{profile?.nome || "Membro Iconics"}</strong>
          <span style={sidebarRankStyle}>{profile?.cargo || "Iconics"}</span>
          <div style={sidebarLevelTopStyle}>
            <span>Nivel {profile?.level || 0}</span>
            <span>{xpPercent}%</span>
          </div>
          <div style={sidebarProgressStyle}><div style={{ ...sidebarProgressFillStyle, width: `${xpPercent}%` }} /></div>
          <div style={sidebarInfluenceStyle}>
            <strong>{xp.toLocaleString("pt-BR")}</strong>
            <span>XP</span>
          </div>
        </section>

        <nav style={sidebarNavStyle} aria-label="Navegacao principal">
          <span style={sidebarSectionLabelStyle}>Navegacao</span>
          {navItems.map((item) => {
            const active = item.label === "Rede"
              ? pathname === "/rede" || pathname?.startsWith("/rede/perfil")
              : item.label === "Notificacoes"
              ? false
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const showBadge = item.label === "Notificacoes" && alertCount > 0;
            return (
              <Link key={item.href + item.label} href={item.href} style={active ? sidebarLinkActiveStyle : sidebarLinkStyle}>
                <span style={sidebarIconStyle}>{item.icon}</span>
                <span>{item.label}</span>
                {showBadge ? <em style={sidebarBadgeStyle}>{alertCount}</em> : null}
              </Link>
            );
          })}
        </nav>

        <nav style={sidebarCoreStyle} aria-label="Iconics core">
          <span style={sidebarSectionLabelStyle}>Iconics core</span>
          {coreItems.map((item) => (
            <Link key={item.href} href={item.href} style={sidebarLinkStyle}>
              <span style={sidebarIconStyle}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {showLogout ? (
          <button onClick={handleLogout} style={sidebarLogoutStyle}>
            Sair
          </button>
        ) : null}
        <small style={sidebarFooterStyle}>ICONICS 2026</small>
      </aside>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        top: isMobile ? 10 : 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        width: "min(96vw, 760px)",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 8,
          padding: isMobile ? "8px 10px" : "10px 14px",
          borderRadius: isMobile ? 18 : 999,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(10,8,18,.72)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 40px rgba(91,33,182,.18)",
          width: "100%",
        }}
      >
        <Link href="/" style={linkStyle}>
          Voltar ao site
        </Link>

        {!loading && isLogged && showPainel && (
          <Link href="/painel" style={linkStyle}>
            Painel
          </Link>
        )}

        {!loading && isLogged && (
          <Link href="/missoes" style={linkStyle}>
            Missoes
          </Link>
        )}

        {!loading && isLogged && (
          <Link href="/rede" style={linkStyle}>
            Rede{alertCount > 0 ? ` (${alertCount})` : ""}
          </Link>
        )}

        <Link href="/rankings" style={linkStyle}>
          Rankings
        </Link>

        {!loading && isLogged && (
          <NotificationBell className="topbar-bell-link" />
        )}

        {!loading && isLogged && showLogout && (
          <button onClick={handleLogout} style={buttonStyle}>
            Sair
          </button>
        )}

        {!loading && !isLogged && (
          <Link href="/login" style={linkStyle}>
            Login
          </Link>
        )}
      </nav>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 999,
  color: "white",
  textDecoration: "none",
  background: "rgba(255,255,255,.05)",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 999,
  color: "white",
  background: "rgba(220,38,38,.18)",
  border: "1px solid rgba(255,255,255,.06)",
  cursor: "pointer",
};

const sidebarStyle: React.CSSProperties = {
  position: "fixed",
  top: 18,
  left: 18,
  bottom: 18,
  zIndex: 120,
  width: 252,
  display: "flex",
  flexDirection: "column",
  gap: 14,
  padding: 16,
  borderRadius: 8,
  border: "1px solid rgba(192,132,252,.32)",
  background: "linear-gradient(180deg, rgba(10,5,24,.96), rgba(5,3,14,.98))",
  boxShadow: "0 0 34px rgba(168,85,247,.2), inset 0 1px 0 rgba(255,255,255,.06)",
  color: "#f7f0ff",
  overflowY: "auto",
};

const sidebarLogoStyle: React.CSSProperties = {
  minHeight: 112,
  display: "grid",
  placeItems: "center",
  borderRadius: 8,
  border: "1px solid rgba(192,132,252,.2)",
  background: "rgba(77,22,132,.16)",
};

const sidebarLogoImageStyle: React.CSSProperties = {
  width: 150,
  height: "auto",
  objectFit: "contain",
};

const sidebarProfileStyle: React.CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: 7,
  paddingBottom: 10,
  borderBottom: "1px solid rgba(255,255,255,.08)",
};

const sidebarAvatarStyle: React.CSSProperties = {
  width: 92,
  height: 92,
  borderRadius: "50%",
  objectFit: "cover",
  border: "1px solid rgba(217,70,239,.52)",
  boxShadow: "0 0 22px rgba(168,85,247,.32)",
};

const sidebarNameStyle: React.CSSProperties = {
  color: "#fff",
  fontSize: 16,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const sidebarRankStyle: React.CSSProperties = {
  color: "#d946ef",
  textTransform: "uppercase",
  letterSpacing: ".08em",
  fontSize: 11,
};

const sidebarLevelTopStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "space-between",
  color: "#f5d0fe",
  textTransform: "uppercase",
  fontSize: 11,
  marginTop: 8,
};

const sidebarProgressStyle: React.CSSProperties = {
  width: "100%",
  height: 7,
  borderRadius: 999,
  background: "rgba(255,255,255,.12)",
  overflow: "hidden",
};

const sidebarProgressFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(90deg, #9333ea, #d946ef)",
};

const sidebarInfluenceStyle: React.CSSProperties = {
  width: "100%",
  display: "grid",
  justifyItems: "center",
  gap: 2,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(192,132,252,.2)",
  background: "rgba(126,34,206,.15)",
};

const sidebarNavStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
};

const sidebarCoreStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  paddingTop: 10,
  borderTop: "1px solid rgba(255,255,255,.08)",
};

const sidebarSectionLabelStyle: React.CSSProperties = {
  color: "#c084fc",
  textTransform: "uppercase",
  letterSpacing: ".12em",
  fontSize: 11,
  margin: "2px 0 4px",
};

const sidebarLinkStyle: React.CSSProperties = {
  minHeight: 42,
  display: "grid",
  gridTemplateColumns: "26px minmax(0, 1fr) auto",
  alignItems: "center",
  gap: 10,
  padding: "0 10px",
  borderRadius: 8,
  color: "#ddd6fe",
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: ".04em",
  fontSize: 12,
};

const sidebarLinkActiveStyle: React.CSSProperties = {
  ...sidebarLinkStyle,
  color: "#fff",
  border: "1px solid rgba(217,70,239,.55)",
  background: "rgba(126,34,206,.32)",
  boxShadow: "0 0 18px rgba(192,38,211,.18)",
};

const sidebarIconStyle: React.CSSProperties = {
  width: 24,
  height: 24,
  display: "grid",
  placeItems: "center",
  borderRadius: 6,
  border: "1px solid rgba(216,180,254,.18)",
  color: "#f5d0fe",
  fontSize: 11,
};

const sidebarBadgeStyle: React.CSSProperties = {
  minWidth: 20,
  height: 20,
  display: "grid",
  placeItems: "center",
  borderRadius: 999,
  background: "#7e22ce",
  color: "#fff",
  fontSize: 11,
  fontStyle: "normal",
};

const sidebarLogoutStyle: React.CSSProperties = {
  minHeight: 44,
  marginTop: "auto",
  borderRadius: 8,
  border: "1px solid rgba(248,113,113,.5)",
  background: "rgba(127,29,29,.24)",
  color: "#fecaca",
  textTransform: "uppercase",
  letterSpacing: ".08em",
  cursor: "pointer",
};

const sidebarFooterStyle: React.CSSProperties = {
  textAlign: "center",
  color: "#a78bfa",
  fontSize: 10,
  letterSpacing: ".08em",
};
