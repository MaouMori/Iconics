"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import "../missoes.css";

type MissionProfile = {
  canManage: boolean;
};

type MissionForm = {
  title: string;
  summary: string;
  details: string;
  reward_influence: string;
  required_level: string;
  visible_level: string;
  time_limit_hours: string;
  difficulty: string;
  category: string;
  status: string;
  image_url: string;
};

type MissionItem = {
  id: number;
  title?: string | null;
  summary?: string | null;
  details?: string | null;
  reward_influence?: number | null;
  required_level?: number | null;
  visible_level?: number | null;
  time_limit_hours?: number | null;
  difficulty?: string | null;
  category?: string | null;
  status?: string | null;
  image_url?: string | null;
};

const emptyMissionForm: MissionForm = {
  title: "",
  summary: "",
  details: "",
  reward_influence: "100",
  required_level: "0",
  visible_level: "0",
  time_limit_hours: "24",
  difficulty: "media",
  category: "geral",
  status: "active",
  image_url: "",
};

function missionToForm(mission: MissionItem): MissionForm {
  return {
    title: String(mission.title || ""),
    summary: String(mission.summary || ""),
    details: String(mission.details || ""),
    reward_influence: String(mission.reward_influence ?? 100),
    required_level: String(mission.required_level ?? 0),
    visible_level: String(mission.visible_level ?? 0),
    time_limit_hours: String(mission.time_limit_hours ?? 24),
    difficulty: String(mission.difficulty || "media"),
    category: String(mission.category || "geral"),
    status: String(mission.status || "active"),
    image_url: String(mission.image_url || ""),
  };
}

export default function CriarMissaoPage() {
  const [profile, setProfile] = useState<MissionProfile | null>(null);
  const [missions, setMissions] = useState<MissionItem[]>([]);
  const [editDrafts, setEditDrafts] = useState<Record<number, MissionForm>>({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploadingMissionImage, setUploadingMissionImage] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [createForm, setCreateForm] = useState<MissionForm>(emptyMissionForm);

  async function getToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || "";
  }

  useEffect(() => {
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
        setLoading(false);
        return;
      }
      setProfile(payload.profile);
      const loadedMissions = (payload.missions || []) as MissionItem[];
      setMissions(loadedMissions);
      setEditDrafts(Object.fromEntries(loadedMissions.map((mission) => [mission.id, missionToForm(mission)])));
      setLoading(false);
    }
    load();
  }, []);

  async function apiAction(url: string, options: RequestInit = {}) {
    const token = await getToken();
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Operacao nao concluida.");
    return data;
  }

  async function uploadMissionFile(file: File) {
    const token = await getToken();
    const form = new FormData();
    form.append("file", file);
    form.append("purpose", "mission-image");
    const response = await fetch("/api/missions/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.error || "Falha no upload.");
    return data.file as { name: string; url: string; type: string };
  }

  async function createMission() {
    setMessage("");
    try {
      await apiAction("/api/missions", { method: "POST", body: JSON.stringify(createForm) });
      setCreateForm(emptyMissionForm);
      setMessage("Missao criada e pendurada no mural.");
      await loadMissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel criar a missao.");
    }
  }

  async function loadMissions() {
    const token = await getToken();
    const response = await fetch("/api/missions", { headers: { Authorization: `Bearer ${token}` } });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setMessage(payload?.error || "Nao foi possivel recarregar missoes.");
      return;
    }
    const loadedMissions = (payload.missions || []) as MissionItem[];
    setProfile(payload.profile);
    setMissions(loadedMissions);
    setEditDrafts(Object.fromEntries(loadedMissions.map((mission) => [mission.id, missionToForm(mission)])));
  }

  async function updateMission(missionId: number) {
    setMessage("");
    setSavingId(missionId);
    try {
      await apiAction(`/api/missions/${missionId}`, { method: "PATCH", body: JSON.stringify(editDrafts[missionId]) });
      setMessage("Missao atualizada.");
      await loadMissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel atualizar a missao.");
    }
    setSavingId(null);
  }

  async function deleteMission(missionId: number) {
    if (!window.confirm("Deletar esta missao? Essa acao nao pode ser desfeita.")) return;
    setMessage("");
    setSavingId(missionId);
    try {
      await apiAction(`/api/missions/${missionId}`, { method: "DELETE" });
      setMessage("Missao deletada.");
      await loadMissions();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel deletar a missao.");
    }
    setSavingId(null);
  }

  function updateDraft(missionId: number, patch: Partial<MissionForm>) {
    setEditDrafts((current) => ({
      ...current,
      [missionId]: { ...(current[missionId] || emptyMissionForm), ...patch },
    }));
  }

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="missions-page missions-loading"><Spinner texto="Carregando criacao..." /></main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="missions-page">
        <section className="missions-shell">
          {message ? <div className="missions-alert">{message}</div> : null}
          <section className="missions-board mission-page-panel clean-page-panel">
            {!profile?.canManage ? (
              <div className="mission-empty">Apenas lideranca pode criar missoes.</div>
            ) : (
              <div className="mission-form mission-create-page">
                <h2>Criar missao</h2>
                <input placeholder="Titulo" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} />
                <textarea placeholder="Resumo" value={createForm.summary} onChange={(e) => setCreateForm({ ...createForm, summary: e.target.value })} />
                <textarea placeholder="Detalhes" value={createForm.details} onChange={(e) => setCreateForm({ ...createForm, details: e.target.value })} />
                <label className="mission-file-input">
                  {uploadingMissionImage ? "Enviando imagem..." : "Enviar imagem da missao"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingMissionImage(true);
                      try {
                        const uploaded = await uploadMissionFile(file);
                        setCreateForm({ ...createForm, image_url: uploaded.url });
                      } catch (error) {
                        setMessage(error instanceof Error ? error.message : "Falha no upload da imagem.");
                      }
                      setUploadingMissionImage(false);
                    }}
                  />
                </label>
                {createForm.image_url ? <img className="mission-upload-preview" src={createForm.image_url} alt="Preview da missao" /> : null}
                <div className="mission-form-grid">
                  <input placeholder="XP" value={createForm.reward_influence} onChange={(e) => setCreateForm({ ...createForm, reward_influence: e.target.value })} />
                  <input placeholder="Nivel para aceitar" value={createForm.required_level} onChange={(e) => setCreateForm({ ...createForm, required_level: e.target.value })} />
                  <input placeholder="Nivel para ver" value={createForm.visible_level} onChange={(e) => setCreateForm({ ...createForm, visible_level: e.target.value })} />
                  <input placeholder="Horas" value={createForm.time_limit_hours} onChange={(e) => setCreateForm({ ...createForm, time_limit_hours: e.target.value })} />
                </div>
                <div className="mission-form-grid">
                  <input placeholder="Categoria" value={createForm.category} onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })} />
                  <input placeholder="Dificuldade" value={createForm.difficulty} onChange={(e) => setCreateForm({ ...createForm, difficulty: e.target.value })} />
                </div>
                <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                  <option value="active">Ativa</option>
                  <option value="secret">Secreta</option>
                </select>
                <button type="button" onClick={createMission}>Pendurar no mural</button>

                <div className="mission-editor-list">
                  <h2>Editar missoes existentes</h2>
                  {missions.length === 0 ? <p className="muted">Nenhuma missao cadastrada.</p> : null}
                  {missions.map((mission) => {
                    const draft = editDrafts[mission.id] || missionToForm(mission);
                    return (
                      <article className="mission-edit-card" key={mission.id}>
                        <div className="mission-edit-head">
                          <strong>{draft.title || `Missao #${mission.id}`}</strong>
                          <span>#{mission.id}</span>
                        </div>
                        <input placeholder="Titulo" value={draft.title} onChange={(e) => updateDraft(mission.id, { title: e.target.value })} />
                        <textarea placeholder="Resumo" value={draft.summary} onChange={(e) => updateDraft(mission.id, { summary: e.target.value })} />
                        <textarea placeholder="Detalhes" value={draft.details} onChange={(e) => updateDraft(mission.id, { details: e.target.value })} />
                        <label className="mission-file-input">
                          Trocar imagem da missao
                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setSavingId(mission.id);
                              try {
                                const uploaded = await uploadMissionFile(file);
                                updateDraft(mission.id, { image_url: uploaded.url });
                              } catch (error) {
                                setMessage(error instanceof Error ? error.message : "Falha no upload da imagem.");
                              }
                              setSavingId(null);
                            }}
                          />
                        </label>
                        {draft.image_url ? <img className="mission-upload-preview" src={draft.image_url} alt={`Preview ${draft.title}`} /> : null}
                        <div className="mission-form-grid">
                          <input placeholder="XP" value={draft.reward_influence} onChange={(e) => updateDraft(mission.id, { reward_influence: e.target.value })} />
                          <input placeholder="Nivel para aceitar" value={draft.required_level} onChange={(e) => updateDraft(mission.id, { required_level: e.target.value })} />
                          <input placeholder="Nivel para ver" value={draft.visible_level} onChange={(e) => updateDraft(mission.id, { visible_level: e.target.value })} />
                          <input placeholder="Horas" value={draft.time_limit_hours} onChange={(e) => updateDraft(mission.id, { time_limit_hours: e.target.value })} />
                        </div>
                        <div className="mission-form-grid">
                          <input placeholder="Categoria" value={draft.category} onChange={(e) => updateDraft(mission.id, { category: e.target.value })} />
                          <input placeholder="Dificuldade" value={draft.difficulty} onChange={(e) => updateDraft(mission.id, { difficulty: e.target.value })} />
                        </div>
                        <select value={draft.status} onChange={(e) => updateDraft(mission.id, { status: e.target.value })}>
                          <option value="active">Ativa</option>
                          <option value="secret">Secreta</option>
                        </select>
                        <div className="mission-edit-actions">
                          <button type="button" onClick={() => updateMission(mission.id)} disabled={savingId === mission.id}>
                            {savingId === mission.id ? "Salvando..." : "Salvar alteracoes"}
                          </button>
                          <button type="button" className="danger-action" onClick={() => deleteMission(mission.id)} disabled={savingId === mission.id}>
                            Deletar missao
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
