"use client";

import { useEffect, useMemo, useState } from "react";
import TopBar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";
import "./rankings.css";

type RankingItem = {
  id: number;
  nome: string;
  pontos: number;
  cor: string | null;
  foguete_emoji: string | null;
  ativo: boolean;
};

const EDITOR_ROLES = new Set(["admin", "lider", "vice_lider", "staff"]);

export default function RankingsPage() {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [token, setToken] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [status, setStatus] = useState("");

  const [newName, setNewName] = useState("");
  const [newPoints, setNewPoints] = useState(0);
  const [newColor, setNewColor] = useState("#a855f7");
  const [newRocket, setNewRocket] = useState("🚀");

  const [editing, setEditing] = useState<Record<number, number>>({});

  async function loadRankings() {
    const response = await fetch("/api/fraternity-rankings", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(payload?.error || "Falha ao carregar ranking.");
      return;
    }
    const data = (payload?.rankings || []) as RankingItem[];
    setRankings(data);
    setEditing(
      data.reduce<Record<number, number>>((acc, item) => {
        acc[item.id] = Number(item.pontos || 0);
        return acc;
      }, {})
    );
  }

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      await loadRankings();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token || "";
      if (mounted) setToken(accessToken);

      if (accessToken) {
        const meResponse = await fetch("/api/social/profile/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const mePayload = await meResponse.json().catch(() => null);
        const role = String(mePayload?.profile?.cargo || "").toLowerCase().trim();
        if (mounted) setCanEdit(EDITOR_ROLES.has(role));
      } else if (mounted) {
        setCanEdit(false);
      }

      if (mounted) setLoading(false);
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const maxPoints = useMemo(() => {
    if (!rankings.length) return 1;
    return Math.max(...rankings.map((item) => Number(item.pontos || 0)), 1);
  }, [rankings]);

  async function createFraternity() {
    if (!canEdit || !token) return;
    if (!newName.trim()) {
      setStatus("Informe o nome da fraternidade.");
      return;
    }
    const response = await fetch("/api/fraternity-rankings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nome: newName.trim(),
        pontos: Number(newPoints || 0),
        cor: newColor,
        foguete_emoji: newRocket || "🚀",
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(payload?.error || "Falha ao criar fraternidade.");
      return;
    }
    setNewName("");
    setNewPoints(0);
    setStatus("Fraternidade criada.");
    await loadRankings();
  }

  async function updatePoints(id: number, pontos: number) {
    if (!canEdit || !token) return;
    const response = await fetch(`/api/fraternity-rankings/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pontos }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(payload?.error || "Falha ao atualizar pontos.");
      return;
    }
    await loadRankings();
  }

  async function removeFraternity(id: number) {
    if (!canEdit || !token) return;
    const response = await fetch(`/api/fraternity-rankings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(payload?.error || "Falha ao remover fraternidade.");
      return;
    }
    setStatus("Fraternidade removida.");
    await loadRankings();
  }

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="rankings-page rankings-loader">Carregando rankings...</main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="rankings-page">
        <section className="rankings-shell">
          <header className="rankings-header">
            <p className="rankings-kicker">Competição Iconics</p>
            <h1>Rankings das Fraternidades</h1>
            <p>
              Pontuação manual da liderança. O foguete mais avançado no gráfico está na frente.
            </p>
          </header>

          <section className="rankings-chart-card">
            <div className="chart-axis">
              <span className="axis-start">0 pts</span>
              <span className="axis-end">{maxPoints} pts</span>
            </div>
            <div className="chart-track" />
            <div className="chart-area">
              {rankings.map((item, index) => {
                const ratio = Math.max(0, Math.min(1, Number(item.pontos || 0) / maxPoints));
                const x = 4 + ratio * 88;
                const y = 8 + ratio * 70 + (index % 2 === 0 ? 0 : 2);
                return (
                  <div
                    key={item.id}
                    className="rocket-node"
                    style={{
                      left: `${x}%`,
                      bottom: `${y}%`,
                      borderColor: item.cor || "#a855f7",
                      boxShadow: `0 0 24px ${item.cor || "#a855f7"}66`,
                    }}
                  >
                    <span className="rocket-icon">{item.foguete_emoji || "🚀"}</span>
                    <div className="rocket-label">
                      <strong>{item.nome}</strong>
                      <span>{item.pontos} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rankings-table-card">
            <div className="rankings-table-head">
              <h2>Classificação atual</h2>
            </div>
            <div className="rankings-list">
              {rankings.map((item, idx) => (
                <article key={`row-${item.id}`} className="ranking-row">
                  <div className="ranking-place">#{idx + 1}</div>
                  <div className="ranking-name">
                    <strong>{item.nome}</strong>
                    <span>{item.foguete_emoji || "🚀"}</span>
                  </div>
                  <div className="ranking-points">{item.pontos} pts</div>
                  {canEdit ? (
                    <div className="ranking-controls">
                      <button
                        type="button"
                        onClick={() =>
                          setEditing((prev) => ({
                            ...prev,
                            [item.id]: Number(prev[item.id] || 0) - 10,
                          }))
                        }
                      >
                        -10
                      </button>
                      <input
                        type="number"
                        value={editing[item.id] ?? item.pontos}
                        onChange={(e) =>
                          setEditing((prev) => ({
                            ...prev,
                            [item.id]: Number(e.target.value || 0),
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setEditing((prev) => ({
                            ...prev,
                            [item.id]: Number(prev[item.id] || 0) + 10,
                          }))
                        }
                      >
                        +10
                      </button>
                      <button
                        type="button"
                        className="save-btn"
                        onClick={() => updatePoints(item.id, Number(editing[item.id] ?? item.pontos))}
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() => removeFraternity(item.id)}
                      >
                        Remover
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
              {rankings.length === 0 ? (
                <p className="rank-empty">Nenhuma fraternidade cadastrada ainda.</p>
              ) : null}
            </div>
          </section>

          {canEdit ? (
            <section className="rankings-admin-card">
              <h3>Adicionar fraternidade</h3>
              <div className="admin-grid">
                <input
                  placeholder="Nome da fraternidade"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Pontos"
                  value={newPoints}
                  onChange={(e) => setNewPoints(Number(e.target.value || 0))}
                />
                <input
                  type="text"
                  placeholder="Emoji foguete"
                  value={newRocket}
                  onChange={(e) => setNewRocket(e.target.value)}
                />
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                />
                <button type="button" onClick={createFraternity}>
                  Criar fraternidade
                </button>
              </div>
            </section>
          ) : null}

          {status ? <p className="rank-status">{status}</p> : null}
        </section>
      </main>
    </>
  );
}

