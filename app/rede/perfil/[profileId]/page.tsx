"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Spinner from "@/components/Spinner";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/lib/supabase";
import "../../rede.css";

type ProfilePayload = {
  profile: {
    id: string;
    nome: string | null;
    username: string | null;
    cargo: string | null;
    avatar_url: string | null;
    bio: string | null;
  };
  followersCount: number;
  followingCount: number;
  following: boolean;
  recentPosts: Array<{
    id: number;
    content: string;
    image_url: string | null;
    created_at: string;
    like_count: number;
    comment_count: number;
  }>;
};

export default function RedeProfilePage() {
  const params = useParams<{ profileId: string }>();
  const profileId = String(params?.profileId || "").trim();

  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [payload, setPayload] = useState<ProfilePayload | null>(null);
  const [status, setStatus] = useState("");

  async function loadProfile(currentToken: string) {
    const response = await fetch(`/api/social/profile/${profileId}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
      cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus(data.error || "Erro ao carregar perfil.");
      return;
    }
    setPayload(data);
  }

  useEffect(() => {
    let mounted = true;
    async function boot() {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }
      if (!mounted) return;
      setToken(accessToken);
      await loadProfile(accessToken);
      if (mounted) setLoading(false);
    }
    boot();
    return () => {
      mounted = false;
    };
  }, [profileId]);

  async function toggleFollow() {
    if (!payload || !token) return;
    const method = payload.following ? "DELETE" : "POST";
    const response = await fetch(`/api/social/follows/${payload.profile.id}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(data?.error || "Nao foi possivel atualizar.");
      return;
    }
    await loadProfile(token);
  }

  if (loading) {
    return (
      <main className="rede-loader">
        <Spinner texto="Carregando perfil..." />
      </main>
    );
  }

  if (!payload) {
    return (
      <main className="rede-loader">
        <p>{status || "Perfil nao encontrado."}</p>
      </main>
    );
  }

  return (
    <main className="social-app">
      <section className="social-shell">
        <header className="social-topbar">
          <div className="brand-left">
            <img src="/images/iconics-logo.png" alt="Logo Iconics" className="brand-logo" />
            <strong>ICONICS</strong>
          </div>
          <h1>Perfil de {payload.profile.nome || "Membro"}</h1>
          <div className="top-actions">
            <Link href="/rede" className="top-btn">Rede</Link>
            <Link href={`/rede/mensagens?with=${payload.profile.id}`} className="top-btn">Mensagem</Link>
            <NotificationBell className="top-btn" />
          </div>
        </header>

        <section className="profile-view-layout">
          <aside className="profile-view-side">
            <img src={payload.profile.avatar_url || "/images/logo.png"} alt="" className="profile-view-avatar" />
            <h2>{payload.profile.nome || "Membro"}</h2>
            <p>@{payload.profile.username || "membro"}</p>
            <p className="profile-view-role">{payload.profile.cargo || "membro"}</p>
            <p className="profile-view-bio">{payload.profile.bio || "Sem bio cadastrada."}</p>
            <div className="profile-view-stats">
              <div><strong>{payload.followersCount}</strong><span>Seguidores</span></div>
              <div><strong>{payload.followingCount}</strong><span>Seguindo</span></div>
            </div>
            <button className="quick-btn" onClick={toggleFollow}>
              {payload.following ? "Deixar de seguir" : "Seguir perfil"}
            </button>
          </aside>

          <section className="profile-view-feed">
            <h3>Publicacoes recentes</h3>
            <div className="feed-list">
              {payload.recentPosts.map((post) => (
                <article key={post.id} className="post-card-premium">
                  <p className="post-content">{post.content}</p>
                  {post.image_url ? <img src={post.image_url} alt="" className="post-cover" /> : null}
                  <div className="post-metrics">
                    <span>💜 {post.like_count}</span>
                    <span>💬 {post.comment_count}</span>
                    <span>{new Date(post.created_at).toLocaleString("pt-BR")}</span>
                  </div>
                </article>
              ))}
              {payload.recentPosts.length === 0 ? <p>Nenhuma publicacao ainda.</p> : null}
            </div>
          </section>
        </section>
      </section>

      {status ? <div className="status-toast">{status}</div> : null}
    </main>
  );
}
