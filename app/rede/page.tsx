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
  const [commentDraft, setCommentDraft] = useState<Record<number, string>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [status, setStatus] = useState("");

  const [editNome, setEditNome] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

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
    setMembers(payload.members || []);
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
    setStatus("Publicação enviada.");
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
    if (!token || !selectedMemberId || !newMessageText.trim()) return;
    const response = await fetch("/api/social/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientId: selectedMemberId,
        content: newMessageText,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Erro ao enviar mensagem.");
      return;
    }
    setNewMessageText("");
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
        <div className="rede-shell">
          <aside className="rede-left">
            <section className="rede-card profile-card">
              <p className="rede-kicker">Perfil</p>
              <div className="profile-head">
                <img
                  src={editAvatar || me?.avatar_url || "/images/logo.png"}
                  alt="Avatar"
                  className="profile-avatar"
                />
                <div>
                  <h2>{me?.nome || "Membro"}</h2>
                  <p>@{me?.username || "semusername"}</p>
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
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Bio"
                  rows={3}
                />
                <button className="btn-primary" onClick={saveProfile} disabled={savingProfile}>
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
              <p className="rede-kicker">Criar publicação</p>
              <textarea
                placeholder="O que você está pensando?"
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                rows={3}
              />
              <input
                placeholder="URL da imagem (opcional)"
                value={newPostImage}
                onChange={(e) => setNewPostImage(e.target.value)}
              />
              <button className="btn-primary" onClick={createPost}>
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
                  <span>{post.comment_count} comentários</span>
                </div>

                <div className="comment-list">
                  {post.recent_comments.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <strong>{comment.author.nome || "Membro"}:</strong> {comment.content}
                    </div>
                  ))}
                </div>

                <div className="comment-box">
                  <input
                    placeholder="Escreva um comentário"
                    value={commentDraft[post.id] || ""}
                    onChange={(e) => setCommentDraft((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  />
                  <button onClick={() => addComment(post.id)}>Comentar</button>
                </div>
              </article>
            ))}
          </section>

          <aside className="rede-right">
            <section className="rede-card">
              <div className="row-between">
                <p className="rede-kicker">Notificações</p>
                <button className="btn-ghost" onClick={markNotificationsRead}>
                  Marcar lidas
                </button>
              </div>
              <p className="notif-count">
                Não lidas: {unreadCount}
                {adminPendingCount > 0 ? ` | Pendências vínculo: ${adminPendingCount}` : ""}
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
                {selectedMember ? `Conversa com ${selectedMember.nome}` : "Selecione alguém para conversar"}
              </p>
              <div className="chat-messages">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`chat-bubble ${msg.sender_profile_id === me?.id ? "me" : "other"}`}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
              <div className="chat-input">
                <input
                  placeholder="Digite sua mensagem"
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                />
                <button onClick={sendMessage}>Enviar</button>
              </div>
            </section>
          </aside>
        </div>
        {status ? <div className="status-toast">{status}</div> : null}
      </main>
    </>
  );
}
