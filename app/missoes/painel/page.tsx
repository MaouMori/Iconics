"use client";

import TopBar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import "../missoes.css";

type Profile = {
  id: string;
  nome: string | null;
  cargo: string | null;
  avatar_url?: string | null;
  level: number;
  xp: number;
  rankLabel: string;
  canManage: boolean;
};

export default function MissionPanelPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ranking, setRanking] = useState<Profile[]>([]);
  const [selected, setSelected] = useState("");
  const [level, setLevel] = useState("");
  const [xpDelta, setXpDelta] = useState("");
  const [levels, setLevels] = useState<{ level: number; required_xp: number; label?: string | null }[]>([]);
  const [levelDraft, setLevelDraft] = useState({ level: "", required_xp: "", label: "" });
  const [message, setMessage] = useState("Carregando painel...");

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  async function load() {
    const token = await getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    const response = await fetch("/api/missions", { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error || "Nao foi possivel carregar.");
      return;
    }
    setProfile(payload.profile);
    setRanking(payload.ranking || []);
    setLevels(payload.levels?.length ? payload.levels : [{ level: 0, required_xp: 0, label: "Inicial" }]);
    setSelected(payload.profile?.id || "");
    setMessage("");
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      load();
    }, 0);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function adjustProfile() {
    const token = await getToken();
    const response = await fetch(`/api/missions/profiles/${selected}/adjust`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ level, xp_delta: xpDelta }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error || "Nao foi possivel ajustar.");
      return;
    }
    setMessage("Perfil atualizado.");
    await load();
  }

  async function saveLevels() {
    const normalized = normalizeLevels(levels);
    const token = await getToken();
    const response = await fetch("/api/missions/levels", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ levels: normalized }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error || "Nao foi possivel salvar niveis.");
      return;
    }
    setMessage("Tabela de XP por nivel atualizada.");
    setLevels(normalized);
    await load();
  }

  function normalizeLevels(items: { level: number; required_xp: number; label?: string | null }[]) {
    const byLevel = new Map<number, { level: number; required_xp: number; label?: string | null }>();
    items.forEach((item) => {
      const itemLevel = Math.max(0, Math.floor(Number(item.level) || 0));
      const requiredXp = Math.max(0, Math.floor(Number(item.required_xp) || 0));
      byLevel.set(itemLevel, { level: itemLevel, required_xp: itemLevel === 0 ? 0 : requiredXp, label: String(item.label || "").trim() || null });
    });
    byLevel.set(0, { level: 0, required_xp: 0, label: byLevel.get(0)?.label || "Inicial" });
    return Array.from(byLevel.values()).sort((a, b) => a.level - b.level);
  }

  function addOrUpdateLevel() {
    const nextLevel = Number(levelDraft.level);
    const nextXp = Number(levelDraft.required_xp);
    if (!Number.isFinite(nextLevel) || nextLevel < 0 || !Number.isFinite(nextXp) || nextXp < 0) {
      setMessage("Informe um nivel e uma quantidade de XP validos.");
      return;
    }
    const merged = normalizeLevels([
      ...levels,
      {
        level: Math.floor(nextLevel),
        required_xp: Math.floor(nextXp),
        label: levelDraft.label,
      },
    ]);
    setLevels(merged);
    setLevelDraft({ level: "", required_xp: "", label: "" });
    setMessage("Nivel adicionado na tabela. Clique em Salvar tabela para publicar.");
  }

  return (
    <>
      <TopBar />
      <main className="missions-page">
        <section className="missions-shell">
          {message ? <div className="missions-alert">{message}</div> : null}
          <section className="missions-board mission-page-grid clean-page-panel">
              <article className="agent-card">
                <div className="agent-top">
                  <img src={profile?.avatar_url || "/images/iconics_emblem_main.png"} alt={profile?.nome || "Membro"} />
                  <div>
                    <h2>{profile?.nome || "Membro Iconics"}</h2>
                    <p>{profile?.rankLabel || "Recem-chegado"}</p>
                  </div>
                </div>
                <div className="agent-stat"><span>Nivel</span><strong>{profile?.level || 0}</strong></div>
                <div className="agent-stat"><span>XP</span><strong>{profile?.xp || 0}</strong></div>
              </article>

              {profile?.canManage ? (
                <article className="activity-card">
                  <h2>Gestao de nivel</h2>
                  <div className="mission-form">
                    <select value={selected} onChange={(e) => setSelected(e.target.value)}>
                      {ranking.map((item) => <option key={item.id} value={item.id}>{item.nome || item.id} - nivel {item.level}</option>)}
                    </select>
                    <input placeholder="Setar nivel" value={level} onChange={(e) => setLevel(e.target.value)} />
                    <input placeholder="Adicionar/remover XP" value={xpDelta} onChange={(e) => setXpDelta(e.target.value)} />
                    <button type="button" onClick={adjustProfile}>Salvar ajuste</button>
                  </div>
                </article>
              ) : (
                <article className="activity-card">
                  <h2>Acesso comum</h2>
                  <p className="muted">Voce pode aceitar missoes, enviar comprovantes e acompanhar seu progresso. Ajustes de XP e nivel ficam com lideres, vice-lideres e conselheiros.</p>
                </article>
              )}

              {profile?.canManage ? (
                <article className="activity-card level-editor">
                  <h2>XP por nivel</h2>
                  <p className="muted">Digite o nivel e o XP necessario. A tabela abaixo mostra todos os niveis publicados e pode ser editada a qualquer momento.</p>
                  <div className="level-create-row">
                    <input placeholder="Nivel" value={levelDraft.level} onChange={(e) => setLevelDraft({ ...levelDraft, level: e.target.value })} />
                    <input placeholder="XP necessario" value={levelDraft.required_xp} onChange={(e) => setLevelDraft({ ...levelDraft, required_xp: e.target.value })} />
                    <input placeholder="Titulo do nivel" value={levelDraft.label} onChange={(e) => setLevelDraft({ ...levelDraft, label: e.target.value })} />
                    <button type="button" onClick={addOrUpdateLevel}>Adicionar</button>
                  </div>
                  <div className="level-table-scroll">
                    <div className="level-table-head">
                      <span>Nivel</span>
                      <span>XP necessario</span>
                      <span>Titulo</span>
                    </div>
                    {normalizeLevels(levels).map((item, index) => (
                      <div className="level-row" key={`${item.level}-${index}`}>
                        <input value={item.level} onChange={(e) => {
                          const next = normalizeLevels(levels);
                          next[index] = { ...next[index], level: Number(e.target.value) };
                          setLevels(normalizeLevels(next));
                        }} />
                        <input value={item.required_xp} disabled={item.level === 0} onChange={(e) => {
                          const next = normalizeLevels(levels);
                          next[index] = { ...next[index], required_xp: Number(e.target.value) };
                          setLevels(normalizeLevels(next));
                        }} />
                        <input value={item.label || ""} placeholder="Titulo" onChange={(e) => {
                          const next = normalizeLevels(levels);
                          next[index] = { ...next[index], label: e.target.value };
                          setLevels(normalizeLevels(next));
                        }} />
                      </div>
                    ))}
                  </div>
                  <div className="mission-modal-actions">
                    <button type="button" onClick={() => setLevels(normalizeLevels(levels))}>Organizar tabela</button>
                    <button type="button" onClick={saveLevels}>Salvar tabela</button>
                  </div>
                </article>
              ) : null}
            </section>
        </section>
      </main>
    </>
  );
}
