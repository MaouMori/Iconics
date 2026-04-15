"use client";

import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import "./rede.css";

type Profile = {
  id: string;
  nome: string | null;
  email: string | null;
  cargo: string;
  avatar_url: string | null;
  username: string | null;
  bio: string | null;
  social_muted_until?: string | null;
};

type FeedComment = {
  id: number;
  content: string;
  created_at: string;
  author: {
    id: string;
    nome: string | null;
    username: string | null;
    avatar_url: string | null;
  };
};

type FeedPost = {
  id: number;
  profile_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  author: {
    id: string;
    nome: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  recent_comments: FeedComment[];
};

type MemberLite = {
  id: string;
  nome: string;
  username: string | null;
  avatar_url: string | null;
  cargo: string;
};

type Message = {
  id: number;
  sender_profile_id: string;
  recipient_profile_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  read_at: string | null;
};

type Notification = {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

type FollowState = {
  followersCount: number;
  followingCount: number;
  followingIds: string[];
};

const MOD_ROLES = new Set(["admin", "lider", "vice_lider", "staff"]);

export default function RedePage() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [me, setMe] = useState<Profile | null>(null);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [follows, setFollows] = useState<FollowState>({
    followersCount: 0,
    followingCount: 0,
    followingIds: [],
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminPendingCount, setAdminPendingCount] = useState(0);

  const [newPostText, setNewPostText] = useState("");
  const [newPostImage, setNewPostImage] = useState("");
  const [newMessageText, setNewMessageText] = useState("");
  const [newMessageImage, setNewMessageImage] = useState("");
  const [commentDraft, setCommentDraft] = useState<Record<number, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  const [editNome, setEditNome] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [nowIso, setNowIso] = useState(() => new Date().toISOString());

  const canModerate = MOD_ROLES.has(String(me?.cargo || "").toLowerCase());
  const mutedUntil = me?.social_muted_until ? String(me.social_muted_until) : "";
  const isMuted = Boolean(mutedUntil && mutedUntil > nowIso);

  function fmtShortTime(iso?: string | null) {
    if (!iso) return "agora";
    const diffMs = new Date(nowIso).getTime() - new Date(iso).getTime();
    const min = Math.max(1, Math.floor(diffMs / 60000));
    if (min < 60) return `${min}m`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  }

  async function uploadFile(file: File, folder: "posts" | "chat" | "avatars") {
    if (!token) throw new Error("Nao autenticado.");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);

    const response = await fetch("/api/social/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const payload = await response.json();
    setUploading(false);
    if (!response.ok) throw new Error(payload.error || "Falha no upload.");
    return String(payload.url || "");
  }

  useEffect(() => {
    const interval = setInterval(() => {
      setNowIso(new Date().toISOString());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function bootstrap() {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      const ensure = await fetch("/api/profiles/ensure", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!ensure.ok) {
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

  async function loadProfile(currentToken: string) {
    const response = await fetch("/api/social/profile/me", {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!response.ok) return;
    const payload = await response.json();
    const profile = payload.profile as Profile;
    setMe(profile);
    setEditNome(profile.nome || "");
    setEditUsername(profile.username || "");
    setEditBio(profile.bio || "");
    setEditAvatar(profile.avatar_url || "");
  }

  async function loadFeed(currentToken: string) {
    const response = await fetch("/api/social/feed?limit=25", {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!response.ok) return;
    const payload = await response.json();
    setFeed(payload.posts || []);
  }

  async function loadMessages(currentToken: string, withId?: string) {
    const query = withId ? `?with=${withId}` : "";
    const response = await fetch(`/api/social/messages${query}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!response.ok) return;
    const payload = await response.json();
    const fetchedMembers = (payload.members || []) as MemberLite[];
    setMembers(fetchedMembers);
    setMessages(payload.messages || []);
  }

  async function loadNotifications(currentToken: string) {
    const response = await fetch("/api/social/notifications", {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!response.ok) return;
    const payload = await response.json();
    setNotifications(payload.notifications || []);
    setUnreadCount(payload.unreadCount || 0);
    setAdminPendingCount(payload.adminPendingCount || 0);
  }

  async function loadFollows(currentToken: string) {
    const response = await fetch("/api/social/follows", {
      headers: { Authorization: `Bearer ${currentToken}` },
    });
    if (!response.ok) return;
    const payload = await response.json();
    setFollows({
      followersCount: Number(payload.followersCount || 0),
      followingCount: Number(payload.followingCount || 0),
      followingIds: Array.isArray(payload.followingIds)
        ? payload.followingIds.map((id: unknown) => String(id))
        : [],
    });
  }

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    async function loadAll() {
      await Promise.all([
        loadProfile(token),
        loadFeed(token),
        loadMessages(token, selectedMemberId || undefined),
        loadFollows(token),
        loadNotifications(token),
      ]);
      if (mounted) setLoading(false);
    }
    loadAll();
    return () => {
      mounted = false;
    };
  }, [token, selectedMemberId]);

  useEffect(() => {
    if (!token) return;
    const channel = supabase
      .channel("rede-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_posts" }, () => {
        loadFeed(token);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_post_comments" }, () => {
        loadFeed(token);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_direct_messages" }, () => {
        if (selectedMemberId) loadMessages(token, selectedMemberId);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "site_notifications" }, () => {
        loadNotifications(token);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_follows" }, () => {
        loadFollows(token);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "social_follows" }, () => {
        loadFollows(token);
      })
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "member_card_link_requests" },
        () => {
          loadNotifications(token);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, selectedMemberId]);

  async function createPost() {
    if (!token || !newPostText.trim()) return;
    const response = await fetch("/api/social/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: newPostText, imageUrl: newPostImage }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Erro ao publicar.");
      return;
    }
    setNewPostText("");
    setNewPostImage("");
    setStatus("Publicacao enviada.");
    loadFeed(token);
  }

  async function toggleLike(postId: number) {
    if (!token) return;
    await fetch(`/api/social/posts/${postId}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    loadFeed(token);
  }

  async function addComment(postId: number) {
    const content = String(commentDraft[postId] || "").trim();
    if (!token || !content) return;
    const response = await fetch(`/api/social/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Erro ao comentar.");
      return;
    }
    setCommentDraft((prev) => ({ ...prev, [postId]: "" }));
    loadFeed(token);
  }

  async function sendMessage() {
    if (!token || !selectedMemberId || (!newMessageText.trim() && !newMessageImage)) return;
    const response = await fetch("/api/social/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientId: selectedMemberId,
        content: newMessageText || "[imagem]",
        imageUrl: newMessageImage || null,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Erro ao enviar mensagem.");
      return;
    }
    setNewMessageText("");
    setNewMessageImage("");
    loadMessages(token, selectedMemberId);
  }

  async function saveProfile() {
    if (!token) return;
    setSavingProfile(true);
    const response = await fetch("/api/social/profile/me", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        nome: editNome,
        username: editUsername,
        bio: editBio,
        avatar_url: editAvatar,
      }),
    });
    const payload = await response.json();
    setSavingProfile(false);
    if (!response.ok) {
      setStatus(payload.error || "Erro ao salvar perfil.");
      return;
    }
    setStatus("Perfil atualizado.");
    setMe(payload.profile);
  }

  async function markNotificationsRead() {
    if (!token) return;
    await fetch("/api/social/notifications", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ all: true }),
    });
    loadNotifications(token);
  }

  async function removePost(postId: number) {
    if (!token || !canModerate) return;
    const response = await fetch(`/api/social/moderation/posts/${postId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setStatus(payload?.error || "Falha ao remover post.");
      return;
    }
    loadFeed(token);
  }

  async function removeComment(commentId: number) {
    if (!token || !canModerate) return;
    const response = await fetch(`/api/social/moderation/comments/${commentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setStatus(payload?.error || "Falha ao remover comentario.");
      return;
    }
    loadFeed(token);
  }

  async function muteMember(profileId: string) {
    if (!token || !canModerate) return;
    const response = await fetch("/api/social/moderation/mute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        profileId,
        minutes: 60,
        reason: "Silenciado por 60 minutos pela moderacao.",
      }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus(payload?.error || "Falha ao silenciar membro.");
      return;
    }
    setStatus("Membro silenciado por 60 minutos.");
  }

  async function toggleFollow(targetProfileId: string) {
    if (!token || !targetProfileId || targetProfileId === me?.id) return;
    const alreadyFollowing = follows.followingIds.includes(targetProfileId);
    const response = await fetch(`/api/social/follows/${targetProfileId}`, {
      method: alreadyFollowing ? "DELETE" : "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setStatus(payload?.error || "Falha ao atualizar seguimento.");
      return;
    }
    await loadFollows(token);
    setStatus(alreadyFollowing ? "Voce deixou de seguir." : "Agora voce esta seguindo.");
  }

  const selectedMember = useMemo(
    () => members.find((item) => item.id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  const trendingMembers = useMemo(() => members.slice(0, 4), [members]);

  if (loading) {
    return (
      <main className="rede-loader">
        <Spinner texto="Carregando Rede Iconics..." />
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
          <h1>A rede esta observando voce...</h1>
          <div className="top-actions">
            <Link href="/" className="top-btn">Voltar ao site</Link>
            <Link href="/painel" className="top-btn">Painel</Link>
            <Link href="/rede" className="top-btn active">Rede</Link>
            <button className="top-btn danger" onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}>Sair</button>
          </div>
        </header>

        <div className="social-grid">
          <aside className="left-column">
            <div className="icon-rail">
              <Link href="/rede">⌂</Link>
              <button onClick={() => document.querySelector<HTMLTextAreaElement>(".composer-panel textarea")?.focus()}>◎</button>
              <button onClick={() => document.querySelector<HTMLTextAreaElement>(".chat-compose input")?.focus()}>⌕</button>
              <button onClick={() => document.querySelector<HTMLElement>(".left-list-panel")?.scrollIntoView({ behavior: "smooth" })}>👥</button>
              <button onClick={() => document.querySelector<HTMLElement>(".side-card")?.scrollIntoView({ behavior: "smooth" })}>✚</button>
              <Link href="/rede/config">⚙</Link>
            </div>

            <section className="profile-panel">
              <img className="profile-cover" src={editAvatar || me?.avatar_url || "/images/logo.png"} alt="" />
              <h2>{me?.nome || "Membro"}</h2>
              <p>@{me?.username || "semusername"}</p>
              <p className="bio">{editBio || me?.bio || "Nos criamos icones."}</p>
              <div className="profile-stats">
                <button type="button">
                  <strong>{follows.followersCount}</strong>
                  <span>seguidores</span>
                </button>
                <button type="button">
                  <strong>{follows.followingCount}</strong>
                  <span>seguindo</span>
                </button>
              </div>
              <div className="profile-actions-mini">
                <button>👤</button>
                <button>💬</button>
                <button>🖼</button>
                <button>👁</button>
              </div>
            </section>

            <section className="left-list-panel">
              <p className="section-title">Mensagens</p>
              <div className="member-scroll">
                {members.map((member) => (
                  <button
                    key={member.id}
                    className={`member-tile ${selectedMemberId === member.id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedMemberId(member.id);
                      setNewMessageText("");
                      setNewMessageImage("");
                    }}
                  >
                    <img src={member.avatar_url || "/images/logo.png"} alt="" />
                    <div>
                      <strong>{member.nome}</strong>
                      <span>@{member.username || "membro"}</span>
                    </div>
                    <span className="member-tile-actions">
                      {member.id !== me?.id ? (
                        <button
                          type="button"
                          className={`follow-btn ${follows.followingIds.includes(member.id) ? "on" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(member.id);
                          }}
                        >
                          {follows.followingIds.includes(member.id) ? "Seguindo" : "Seguir"}
                        </button>
                      ) : null}
                    </span>
                    {canModerate ? <em onClick={(e) => { e.stopPropagation(); muteMember(member.id); }}>Silenciar</em> : null}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="center-column">
            <section className="composer-panel">
              <div className="composer-head">💬 Criar publicacao <span>📷</span></div>
              <textarea
                placeholder="O que voce esta pensando?..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                rows={2}
              />
              <input
                placeholder="URL da imagem (opcional)"
                value={newPostImage}
                onChange={(e) => setNewPostImage(e.target.value)}
              />
              <div className="composer-row">
                <label className="chip-btn">
                  Upload imagem
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadFile(file, "posts");
                        setNewPostImage(url);
                      } catch (error) {
                        setStatus(error instanceof Error ? error.message : "Falha no upload.");
                      }
                    }}
                  />
                </label>
                <button className="publish-btn" onClick={createPost} disabled={uploading || isMuted}>Publicar</button>
              </div>
              {newPostImage ? <img src={newPostImage} alt="" className="preview-image" /> : null}
            </section>

            <div className="feed-list">
              {feed.map((post) => (
                <article key={post.id} className="post-card-premium">
                  <div className="post-head">
                    <img src={post.author.avatar_url || "/images/logo.png"} alt="" />
                    <div>
                      <strong>{post.author.nome || "Membro"}</strong>
                      <p>@{post.author.username || "membro"} • {fmtShortTime(post.created_at)}</p>
                    </div>
                    {canModerate ? <button className="mod-x" onClick={() => removePost(post.id)}>✕</button> : null}
                  </div>

                  <p className="post-content">{post.content}</p>
                  {post.image_url ? <img src={post.image_url} alt="" className="post-cover" /> : null}

                  <div className="post-metrics">
                    <button onClick={() => toggleLike(post.id)}>💜 {post.like_count}</button>
                    <span>💬 {post.comment_count}</span>
                  </div>

                  <div className="comments-mini">
                    {post.recent_comments.map((comment) => (
                      <div key={comment.id} className="comment-mini">
                        <b>{comment.author.nome || "Membro"}:</b> {comment.content}
                        {canModerate ? <button onClick={() => removeComment(comment.id)}>Remover</button> : null}
                      </div>
                    ))}
                  </div>

                  <div className="comment-input-row">
                    <input
                      placeholder="Comentar..."
                      value={commentDraft[post.id] || ""}
                      onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                    />
                    <button onClick={() => addComment(post.id)} disabled={isMuted}>Enviar</button>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="right-column">
            <section className="side-card">
              <div className="side-head"><strong>Trending 🔥</strong><button>Ver tudo</button></div>
              <div className="trend-list">
                {trendingMembers.map((member, idx) => (
                  <div key={member.id} className="trend-item">
                    <img src={member.avatar_url || "/images/logo.png"} alt="" />
                    <div>
                      <strong>{member.nome}</strong>
                      <p>{member.username ? `@${member.username}` : member.cargo}</p>
                    </div>
                    <span>#{idx + 1}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="side-card">
              <div className="side-head"><strong>Atividades</strong><button onClick={markNotificationsRead}>Marcar lidas</button></div>
              <p className="notif-count">Nao lidas: {unreadCount} {adminPendingCount > 0 ? `| Pendencias: ${adminPendingCount}` : ""}</p>
              <div className="activity-list">
                {notifications.map((item) => (
                  <div key={item.id} className={`activity-item ${item.is_read ? "" : "unread"}`}>
                    <strong>{item.title}</strong>
                    <p>{item.body || "-"}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="side-card">
              <div className="side-head"><strong>Acoes rapidas</strong></div>
              <button className="quick-btn" onClick={() => document.querySelector<HTMLTextAreaElement>(".composer-panel textarea")?.focus()}>Criar publicacao</button>
              <button className="quick-btn" onClick={() => document.querySelector<HTMLInputElement>(".comment-input-row input")?.focus()}>Comentar</button>
            </section>

            {selectedMember ? (
              <section className="side-card chat-side">
                <div className="side-head">
                  <p className="section-title">Conversa com {selectedMember.nome}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedMemberId("");
                      setMessages([]);
                      setNewMessageText("");
                      setNewMessageImage("");
                    }}
                  >
                    Fechar
                  </button>
                </div>
                <div className="chat-scroll">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`bubble ${msg.sender_profile_id === me?.id ? "me" : "other"}`}>
                      <p>{msg.content}</p>
                      {msg.image_url ? <img src={msg.image_url} alt="" /> : null}
                    </div>
                  ))}
                </div>
                <div className="chat-compose">
                  <input
                    placeholder="Digite sua mensagem"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                  />
                  <button onClick={sendMessage} disabled={isMuted}>Enviar</button>
                </div>
                <div className="composer-row">
                  <label className="chip-btn">
                    Upload imagem do chat
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadFile(file, "chat");
                          setNewMessageImage(url);
                        } catch (error) {
                          setStatus(error instanceof Error ? error.message : "Falha no upload.");
                        }
                      }}
                    />
                  </label>
                </div>
                {newMessageImage ? <img src={newMessageImage} alt="" className="preview-image" /> : null}
              </section>
            ) : (
              <section className="side-card chat-placeholder">
                <p className="section-title">Chat privado</p>
                <p>Clique em um membro na coluna esquerda para abrir a conversa.</p>
              </section>
            )}
          </aside>
        </div>
      </section>

      {status ? <div className="status-toast">{status}</div> : null}

      <section className="hidden-profile-editor">
        <input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
        <input value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
        <input value={editAvatar} onChange={(e) => setEditAvatar(e.target.value)} />
        <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} />
        <button onClick={saveProfile} disabled={savingProfile || uploading}>Salvar meu perfil</button>
      </section>
    </main>
  );
}
