"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components/Spinner";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import "../admin-dashboard.css";

type DiscordLog = {
  id: number;
  guild_id: string | null;
  channel_id: string | null;
  event_title: string;
  event_description: string | null;
  level: string;
  created_at: string;
};

export default function AdminLogsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<DiscordLog[]>([]);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token || "";
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/discord-logs?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error || "Erro ao carregar logs.");
        setLoading(false);
        return;
      }

      setLogs(payload.logs || []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <AdminShell active="dashboard" title="Logs Discord" description="Carregando logs...">
        <div style={{ minHeight: "46vh", display: "grid", placeItems: "center" }}>
          <Spinner texto="Carregando logs..." />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="dashboard"
      title="Logs Discord no Site"
      description="Espelho de eventos do bot para auditoria no painel."
    >
      {error && <p style={{ color: "#ffb5c6" }}>{error}</p>}
      <section className="admin-table-wrap">
        <div className="admin-table">
          <div className="admin-row admin-row-header">
            <span>Evento</span>
            <span>Data</span>
            <span>Nível</span>
          </div>
          {logs.map((log) => (
            <div key={log.id} className="admin-row" style={{ minHeight: 72 }}>
              <span>
                <strong>{log.event_title}</strong>
                <br />
                <small style={{ color: "#cbb3ea" }}>{log.event_description || "-"}</small>
              </span>
              <span>{new Date(log.created_at).toLocaleString("pt-BR")}</span>
              <span className="status novo">{log.level}</span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="admin-row">
              <span>Nenhum log encontrado.</span>
              <span>-</span>
              <span>-</span>
            </div>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

