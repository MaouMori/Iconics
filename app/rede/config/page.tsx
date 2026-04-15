"use client";

import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useState } from "react";
import "../rede.css";

type Profile = {
  id: string;
  nome: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
};

export default function RedeConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [token, setToken] = useState("");
  const [status, setStatus] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);

  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }
      if (!mounted) return;
      setToken(accessToken);
    }
    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    async function loadProfile() {
      const response = await fetch("/api/social/profile/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setStatus(payload?.error || "Erro ao carregar perfil.");
        setLoading(false);
        return;
      }
      const p = payload.profile as Profile;
      setProfile(p);
      setNome(p.nome || "");
      setUsername(p.username || "");
      setBio(p.bio || "");
      setAvatarUrl(p.avatar_url || "");
      setLoading(false);
    }
    loadProfile();
  }, [token]);

  async function uploadAvatar(file: File) {
    if (!token) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "avatars");
    const response = await fetch("/api/social/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const payload = await response.json().catch(() => ({}));
    setUploading(false);
    if (!response.ok) {
      setStatus(payload?.error || "Falha no upload do avatar.");
      return;
    }
    setAvatarUrl(String(payload.url || ""));
  }

  async function saveProfile() {
    if (!token) return;
    setSaving(true);
    const response = await fetch("/api/social/profile/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nome,
        username,
        bio,
        avatar_url: avatarUrl,
      }),
    });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setStatus(payload?.error || "Erro ao salvar perfil.");
      return;
    }
    setProfile(payload.profile as Profile);
    setStatus("Perfil atualizado com sucesso.");
  }

  if (loading) {
    return (
      <main className="rede-loader">
        <Spinner texto="Carregando configuracoes..." />
      </main>
    );
  }

  return (
    <main className="social-app">
      <section className="social-shell">
        <header className="social-topbar">
          <div className="brand-left">
            <div className="brand-flame">◉</div>
            <strong>ICONICS</strong>
          </div>
          <h1>Configuracoes do Perfil</h1>
          <div className="top-actions">
            <Link href="/rede" className="top-btn">Voltar para Rede</Link>
            <Link href="/painel" className="top-btn">Painel</Link>
          </div>
        </header>

        <section className="side-card config-panel">
          <div className="config-avatar-row">
            <img
              src={avatarUrl || profile?.avatar_url || "/images/logo.png"}
              alt="Avatar"
              className="profile-cover"
            />
            <div className="config-avatar-actions">
              <label className="chip-btn">
                Upload novo avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await uploadAvatar(file);
                  }}
                />
              </label>
              <input
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="URL do avatar (opcional)"
              />
            </div>
          </div>

          <div className="config-grid">
            <div>
              <p className="section-title">Nome</p>
              <input value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div>
              <p className="section-title">@Username</p>
              <input value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="section-title">Bio</p>
            <textarea rows={5} value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>

          <div className="config-actions">
            <button className="publish-btn" onClick={saveProfile} disabled={saving || uploading}>
              {saving ? "Salvando..." : "Salvar alteracoes"}
            </button>
            <Link href="/rede" className="top-btn">Cancelar</Link>
          </div>
        </section>
      </section>

      {status ? <div className="status-toast">{status}</div> : null}
    </main>
  );
}

