"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import "../missoes.css";

type MissionProfile = {
  canManage: boolean;
};

export default function CriarMissaoPage() {
  const [profile, setProfile] = useState<MissionProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [uploadingMissionImage, setUploadingMissionImage] = useState(false);
  const [createForm, setCreateForm] = useState({
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
  });

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
      setCreateForm({ ...createForm, title: "", summary: "", details: "", image_url: "" });
      setMessage("Missao criada e pendurada no mural.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel criar a missao.");
    }
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
              </div>
            )}
          </section>
        </section>
      </main>
    </>
  );
}
