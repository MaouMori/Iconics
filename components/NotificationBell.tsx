"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type NotificationBellProps = {
  href?: string;
  className?: string;
  compact?: boolean;
};

export default function NotificationBell({
  href = "/rede",
  className = "",
  compact = false,
}: NotificationBellProps) {
  const [token, setToken] = useState("");
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setToken(data.session?.access_token || "");
      if (!data.session) setCount(0);
    }

    boot();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token || "");
      if (!session) setCount(0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    let mounted = true;
    async function loadSummary() {
      const response = await fetch("/api/social/notifications?summary=1", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok || !mounted) return;
      const payload = await response.json();
      const nextCount = Number(payload.unreadCount || 0) + Number(payload.adminPendingCount || 0);
      setCount(nextCount);
    }

    loadSummary();
    const interval = setInterval(loadSummary, 12000);

    const channel = supabase
      .channel("global-bell")
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

  return (
    <Link
      href={href}
      className={className}
      style={bellStyle}
      aria-label={`Notificacoes ${count > 0 ? count : ""}`}
    >
      {compact ? "🔔" : "🔔 Notificacoes"}
      {count > 0 ? <span style={badgeStyle}>{count}</span> : null}
    </Link>
  );
}

const bellStyle: React.CSSProperties = {
  position: "relative",
  border: "1px solid rgba(200, 154, 255, 0.24)",
  borderRadius: 999,
  padding: "8px 14px",
  textDecoration: "none",
  color: "#efe3ff",
  background: "rgba(255, 255, 255, 0.04)",
  fontWeight: 600,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  minHeight: 38,
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  top: -6,
  right: -6,
  minWidth: 18,
  height: 18,
  borderRadius: 999,
  background: "#ef4444",
  color: "#fff",
  fontSize: 11,
  fontWeight: 700,
  display: "grid",
  placeItems: "center",
  padding: "0 4px",
  border: "1px solid rgba(255,255,255,.3)",
};
