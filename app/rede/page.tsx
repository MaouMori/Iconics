"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
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

const MOD_ROLES = new Set(["admin", "lider", "vice_lider", "staff"]);

export default function RedePage() {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState("");
  const [me, setMe] = useState<Profile | null>(null);
  const [feed, setFeed] = useState<FeedPost[]>([]);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
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

  useEffect(() => {
    const interval = setInterval(() => {
      setNowIso(new Date().toISOString());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

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
    if (!withId && fetchedMembers.length > 0 && !selectedMemberId) {
      setSelectedMemberId(fetchedMembers[0].id);
    }
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

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    async function loadAll() {
      await Promise.all([
        loadProfile(token),
        loadFeed(token),
        loadMessages(token, selectedMemberId || undefined),
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

  const selectedMember = useMemo(
    () => members.find((item) => item.id === selectedMemberId) || null,
    [members, selectedMemberId]
  );

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="rede-loader">
          <Spinner texto="Carregando Rede Iconics..." />
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="rede-page">
        <div className="rede-hero">
          <h1>A rede esta observando voce...</h1>
          <p>Feed, chat, perfil editavel, notificacoes ao vivo e moderacao integrada.</p>
        </div>

        <div className="rede-shell">
          <aside className="rede-left">
            <section className="rede-card profile-card">
              <p className="rede-kicker">Meu perfil</p>
              <div className="profile-head">
                <img
                  src={editAvatar || me?.avatar_url || "/images/logo.png"}
                  alt="Avatar"
                  className="profile-avatar"
                />
                <div>
                  <h2>{me?.nome || "Membro"}</h2>
                  <p>@{me?.username || "semusername"}</p>
                  {isMuted ? (
                    <span className="muted-chip">
                      Silenciado ate {new Date(mutedUntil).toLocaleTimeString("pt-BR")}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="form-stack">
                <input value={editNome} onChange={(e) => setEditNome(e.target.value)} placeholder="Nome" />
                <input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="username"
                />
                <input
                  value={editAvatar}
                  onChange={(e) => setEditAvatar(e.target.value)}
                  placeholder="URL da foto"
                />
                <label className="file-btn">
                  Upload avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const url = await uploadFile(file, "avatars");
                        setEditAvatar(url);
                      } catch (error) {
                        setStatus(error instanceof Error ? error.message : "Falha no upload.");
                      }
                    }}
                  />
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Bio"
                  rows={3}
                />
                <button className="btn-primary" onClick={saveProfile} disabled={savingProfile || uploading}>
                  {savingProfile ? "Salvando..." : "Salvar meu perfil"}
                </button>
              </div>
            </section>

            <section className="rede-card">
              <p className="rede-kicker">Mensagens</p>
              <div className="member-list">
                {members.map((member) => (
                  <button
                    key={member.id}
                    className={`member-item ${selectedMemberId === member.id ? "active" : ""}`}
                    onClick={() => setSelectedMemberId(member.id)}
                  >
                    <img src={member.avatar_url || "/images/logo.png"} alt="" />
                    <div>
                      <strong>{member.nome}</strong>
                      <p>@{member.username || "membro"}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="rede-center">
            <section className="rede-card composer-card">
              <p className="rede-kicker">Criar publicacao</p>
              <textarea
                placeholder="O que voce esta pensando?"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                rows={3}
              />
              <input
                placeholder="URL da imagem (opcional)"
                value={newPostImage}
                onChange={(e) => setNewPostImage(e.target.value)}
              />
              <label className="file-btn">
                Upload imagem do post
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
              {newPostImage ? <img src={newPostImage} alt="" className="preview-image" /> : null}
              <button className="btn-primary" onClick={createPost} disabled={uploading || isMuted}>
                Publicar
              </button>
            </section>

            {feed.map((post) => (
              <article key={post.id} className="rede-card post-card">
                <div className="post-head">
                  <img src={post.author.avatar_url || "/images/logo.png"} alt="" />
                  <div>
                    <strong>{post.author.nome || "Membro"}</strong>
                    <p>@{post.author.username || "membro"}</p>
                  </div>
                  <span>{new Date(post.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <p className="post-content">{post.content}</p>
                {post.image_url ? <img src={post.image_url} alt="" className="post-image" /> : null}

                <div className="post-actions">
                  <button onClick={() => toggleLike(post.id)}>
                    {post.liked_by_me ? "Descurtir" : "Curtir"} ({post.like_count})
                  </button>
                  <span>{post.comment_count} comentarios</span>
                  {canModerate ? (
                    <button className="danger-btn" onClick={() => removePost(post.id)}>
                      Remover post
                    </button>
                  ) : null}
                </div>

                <div className="comment-list">
                  {post.recent_comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div>
                        <strong>{comment.author.nome || "Membro"}:</strong> {comment.content}
                      </div>
                      {canModerate ? (
                        <button className="danger-mini" onClick={() => removeComment(comment.id)}>
                          Remover
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="comment-box">
                  <input
                    placeholder="Escreva um comentario"
                    value={commentDraft[post.id] || ""}
                    onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  />
                  <button onClick={() => addComment(post.id)} disabled={isMuted}>
                    Comentar
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="rede-right">
            <section className="rede-card">
              <div className="row-between">
                <p className="rede-kicker">Notificacoes</p>
                <button className="btn-ghost" onClick={markNotificationsRead}>
                  Marcar lidas
                </button>
              </div>
              <p className="notif-count">
                Nao lidas: {unreadCount}
                {adminPendingCount > 0 ? ` | Pendencias vinculo: ${adminPendingCount}` : ""}
              </p>
              <div className="notif-list">
                {notifications.map((item) => (
                  <div key={item.id} className={`notif-item ${item.is_read ? "" : "unread"}`}>
                    <strong>{item.title}</strong>
                    <p>{item.body || "-"}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rede-card chat-card">
              <p className="rede-kicker">
                {selectedMember ? `Conversa com ${selectedMember.nome}` : "Selecione alguem para conversar"}
              </p>
              {canModerate && selectedMember ? (
                <button className="danger-btn" onClick={() => muteMember(selectedMember.id)}>
                  Silenciar 60m
                </button>
              ) : null}
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-bubble ${msg.sender_profile_id === me?.id ? "me" : "other"}`}
                  >
                    <p>{msg.content}</p>
                    {msg.image_url ? <img src={msg.image_url} alt="" className="chat-image" /> : null}
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  placeholder="Digite sua mensagem"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                />
                <button onClick={sendMessage} disabled={isMuted}>
                  Enviar
                </button>
              </div>
              <div className="chat-actions">
                <label className="file-btn">
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
                {newMessageImage ? (
                  <div className="chat-preview">
                    <img src={newMessageImage} alt="" />
                    <button onClick={() => setNewMessageImage("")}>Remover imagem</button>
                  </div>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
        {status ? <div className="status-toast">{status}</div> : null}
      </main>
    </>
  );
}
