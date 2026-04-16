"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type RocketPoint = {
  id: number;
  x: number;
  y: number;
};

const EDITOR_ROLES = new Set(["admin", "lider", "vice_lider", "conselheiro", "staff"]);

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildRocketLayout(rankings: RankingItem[], maxPoints: number): RocketPoint[] {
  const lanes = [14, 26, 38, 50, 62, 74, 86];
  const minDistance = 10.5; // distancia minima em porcentagem no eixo Y da mesma lane
  const laneYs = new Map<number, number[]>();
  lanes.forEach((_, laneIndex) => laneYs.set(laneIndex, []));

  return rankings.map((item, index) => {
    const ratio = Math.max(0, Math.min(1, toNumber(item.pontos, 0) / Math.max(maxPoints, 1)));
    const baseY = 8 + ratio * 84;

    let chosenLane = 0;
    let chosenScore = -1;

    for (let laneIndex = 0; laneIndex < lanes.length; laneIndex += 1) {
      const usedYs = laneYs.get(laneIndex) || [];
      if (!usedYs.length) {
        chosenLane = laneIndex;
        chosenScore = 999;
        break;
      }
      const nearest = Math.min(...usedYs.map((usedY) => Math.abs(usedY - baseY)));
      if (nearest >= minDistance) {
        chosenLane = laneIndex;
        chosenScore = 999;
        break;
      }
      if (nearest > chosenScore) {
        chosenScore = nearest;
        chosenLane = laneIndex;
      }
    }

    const usedYs = laneYs.get(chosenLane) || [];
    let y = baseY;
    if (usedYs.some((usedY) => Math.abs(usedY - y) < minDistance)) {
      const direction = index % 2 === 0 ? 1 : -1;
      y = Math.max(6, Math.min(94, y + direction * (minDistance * 0.75)));
    }
    usedYs.push(y);
    laneYs.set(chosenLane, usedYs);

    return {
      id: item.id,
      x: lanes[chosenLane],
      y,
    };
  });
}

export default function RankingsPage() {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [status, setStatus] = useState("");

  const [newName, setNewName] = useState("");
  const [newPoints, setNewPoints] = useState(0);
  const [newColor, setNewColor] = useState("#a855f7");
  const [newRocket, setNewRocket] = useState("🚀");

  const [editName, setEditName] = useState("");
  const [editPoints, setEditPoints] = useState(0);
  const [editColor, setEditColor] = useState("#a855f7");
  const [editRocket, setEditRocket] = useState("🚀");

  function applySelection(item: RankingItem | null) {
    if (!item) {
      setSelectedId(null);
      setEditName("");
      setEditPoints(0);
      setEditColor("#a855f7");
      setEditRocket("🚀");
      return;
    }
    setSelectedId(item.id);
    setEditName(item.nome || "");
    setEditPoints(toNumber(item.pontos, 0));
    setEditColor(item.cor || "#a855f7");
    setEditRocket(item.foguete_emoji || "🚀");
  }

  const loadRankings = useCallback(async (preferredId?: number | null) => {
    const response = await fetch("/api/fraternity-rankings", { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(payload?.error || "Falha ao carregar ranking.");
      return;
    }
    const data = (payload?.rankings || []) as RankingItem[];
    setRankings(data);
    if (!data.length) {
      applySelection(null);
      return;
    }
    const currentSelected = preferredId
      ? data.find((item) => item.id === preferredId) || null
      : null;
    applySelection(currentSelected || data[0]);
  }, []);

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
  }, [loadRankings]);

  const maxPoints = useMemo(() => {
    if (!rankings.length) return 1;
    return Math.max(...rankings.map((item) => toNumber(item.pontos, 0)), 1);
  }, [rankings]);

  const rocketLayout = useMemo(() => buildRocketLayout(rankings, maxPoints), [rankings, maxPoints]);
  const selected = useMemo(
    () => rankings.find((item) => item.id === selectedId) || rankings[0] || null,
    [rankings, selectedId]
  );
  const selectedRank = useMemo(
    () => (selected ? rankings.findIndex((item) => item.id === selected.id) + 1 : null),
    [rankings, selected]
  );

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
        pontos: toNumber(newPoints, 0),
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
    await loadRankings(selected?.id || null);
  }

  async function saveSelected() {
    if (!canEdit || !token || !selected) return;
    const response = await fetch(`/api/fraternity-rankings/${selected.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nome: editName.trim(),
        pontos: toNumber(editPoints, 0),
        cor: editColor,
        foguete_emoji: editRocket || "🚀",
      }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(payload?.error || "Falha ao salvar fraternidade.");
      return;
    }
    setStatus("Fraternidade atualizada.");
    await loadRankings(selected?.id || null);
  }

  async function removeSelected() {
    if (!canEdit || !token || !selected) return;
    const response = await fetch(`/api/fraternity-rankings/${selected.id}`, {
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
            <p className="rankings-kicker">Competicao Iconics</p>
            <h1>Rankings das Fraternidades</h1>
            <p>
              Clique em um foguete para ver detalhes. Aposicoes automaticas evitam sobreposicao.
            </p>
          </header>

          <section className="rankings-chart-card">
            <div className="chart-main-grid">
              <div>
                <div className="chart-axis">
                  <span className="axis-end">{maxPoints} pts</span>
                  <span className="axis-start">0 pts</span>
                </div>
                <div className="chart-track" />

                <div className="chart-area">
                  {rankings.map((item) => {
                    const position = rocketLayout.find((point) => point.id === item.id);
                    if (!position) return null;
                    const isSelected = selected?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={`rocket-only ${isSelected ? "selected" : ""}`}
                        style={{
                          left: `${position.x}%`,
                          bottom: `${position.y}%`,
                          borderColor: item.cor || "#a855f7",
                          boxShadow: `0 0 24px ${(item.cor || "#a855f7")}55`,
                        }}
                        title={`${item.nome} - ${item.pontos} pts`}
                        onClick={() => applySelection(item)}
                      >
                        <span>{item.foguete_emoji || "🚀"}</span>
                      </button>
                    );
                  })}
                  {!rankings.length ? <p className="rank-empty">Nenhuma fraternidade cadastrada.</p> : null}
                </div>
              </div>

              <aside className="rocket-info-card">
                <h2>Fraternidade selecionada</h2>
                {selected ? (
                  <>
                    <p className="info-rank">Posicao atual: #{selectedRank || 1}</p>
                    {!canEdit ? (
                      <div className="info-view">
                        <div className="info-preview">
                          <span className="big-rocket">{selected.foguete_emoji || "🚀"}</span>
                          <div>
                            <strong>{selected.nome}</strong>
                            <p>{selected.pontos} pts</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="info-edit-grid">
                        <label>
                          Nome da fraternidade
                          <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                        </label>
                        <label>
                          Pontos
                          <input
                            type="number"
                            value={editPoints}
                            onChange={(e) => setEditPoints(toNumber(e.target.value, 0))}
                          />
                        </label>
                        <label>
                          Emoji do foguete
                          <input value={editRocket} onChange={(e) => setEditRocket(e.target.value)} />
                        </label>
                        <label>
                          Cor
                          <input type="color" value={editColor} onChange={(e) => setEditColor(e.target.value)} />
                        </label>

                        <div className="edit-actions">
                          <button type="button" className="save-btn" onClick={saveSelected}>
                            Salvar
                          </button>
                          <button type="button" className="delete-btn" onClick={removeSelected}>
                            Remover
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="rank-empty">Selecione um foguete no grafico.</p>
                )}
              </aside>
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
                  onChange={(e) => setNewPoints(toNumber(e.target.value, 0))}
                />
                <input
                  type="text"
                  placeholder="Emoji foguete"
                  value={newRocket}
                  onChange={(e) => setNewRocket(e.target.value)}
                />
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} />
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
