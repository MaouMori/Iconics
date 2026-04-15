"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Spinner from "@/components/Spinner";
import NotificationBell from "@/components/NotificationBell";
import { supabase } from "@/lib/supabase";
import "../rede.css";

type MemberLite = {
  id: string;
  nome: string;
  username: string | null;
  avatar_url: string | null;
  cargo: string;
};

type Conversation = {
  with: MemberLite;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
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

type MeProfile = {
  id: string;
  nome: string | null;
};

export default function RedeMensagensPage() {
  const [token, setToken] = useState("");
  const [me, setMe] = useState<MeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<MemberLite[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState(() => {
    if (typeof window === "undefined") return "";
    const queryWith = new URLSearchParams(window.location.search).get("with");
    return String(queryWith || "").trim();
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [draftImage, setDraftImage] = useState("");
  const [status, setStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlineIds, setOnlineIds] = useState<string[]>([]);
  const [typingIds, setTypingIds] = useState<string[]>([]);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingOffTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function boot() {
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

      const meRes = await fetch("/api/social/profile/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (meRes.ok && mounted) {
        const payload = await meRes.json();
        setMe(payload.profile || null);
      }

      if (mounted) setToken(accessToken);
    }
    boot();
    return () => {
      mounted = false;
    };
  }, []);

  async function loadMessages(currentToken: string, withId?: string) {
    const query = withId ? `?with=${withId}` : "";
    const response = await fetch(`/api/social/messages${query}`, {
      headers: { Authorization: `Bearer ${currentToken}` },
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = await response.json();
    setMembers(payload.members || []);
    setConversations(payload.conversations || []);
    setMessages(payload.messages || []);
  }

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    async function loadInitial() {
      await loadMessages(token, selectedId || undefined);
      if (mounted) setLoading(false);
    }
    loadInitial();
    return () => {
      mounted = false;
    };
  }, [token, selectedId]);

  useEffect(() => {
    if (!token || !selectedId) return;
    const channel = supabase
      .channel("rede-mensagens-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "social_direct_messages" }, () => {
        loadMessages(token, selectedId);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [token, selectedId]);

  useEffect(() => {
    if (!token || !me?.id) return;

    const channel = supabase.channel("rede-presence-chat", {
      config: { presence: { key: me.id } },
    });
    presenceChannelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const rawState = channel.presenceState();
        const ids = Object.keys(rawState).filter((id) => id !== me.id);
        setOnlineIds(ids);
      })
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const from = String(payload?.from || "");
        const to = String(payload?.to || "");
        const typing = Boolean(payload?.typing);
        if (!from || to !== me.id) return;

        setTypingIds((prev) => {
          if (typing) {
            if (prev.includes(from)) return prev;
            return [...prev, from];
          }
          return prev.filter((id) => id !== from);
        });
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        await channel.track({
          profileId: me.id,
          ts: Date.now(),
        });
      });

    const touchPresence = () => {
      channel.track({ profileId: me.id, ts: Date.now() });
    };
    document.addEventListener("visibilitychange", touchPresence);

    return () => {
      document.removeEventListener("visibilitychange", touchPresence);
      presenceChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [token, me?.id]);

  const emitTyping = useCallback((targetId: string, typing: boolean) => {
    const channel = presenceChannelRef.current;
    if (!channel || !me?.id || !targetId) return;
    channel.send({
      type: "broadcast",
      event: "typing",
      payload: {
        from: me.id,
        to: targetId,
        typing,
      },
    });
  }, [me]);

  useEffect(() => {
    if (!selectedId) return;
    if (!draft.trim()) {
      emitTyping(selectedId, false);
      if (typingOffTimerRef.current) {
        window.clearTimeout(typingOffTimerRef.current);
        typingOffTimerRef.current = null;
      }
      return;
    }

    emitTyping(selectedId, true);
    if (typingOffTimerRef.current) window.clearTimeout(typingOffTimerRef.current);
    typingOffTimerRef.current = window.setTimeout(() => {
      emitTyping(selectedId, false);
      typingOffTimerRef.current = null;
    }, 1400);

    return () => {
      if (typingOffTimerRef.current) {
        window.clearTimeout(typingOffTimerRef.current);
        typingOffTimerRef.current = null;
      }
    };
  }, [draft, selectedId, emitTyping]);

  async function uploadChatImage(file: File) {
    if (!token) throw new Error("Nao autenticado.");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("folder", "chat");

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

  async function sendMessage() {
    if (!token || !selectedId || (!draft.trim() && !draftImage)) return;
    const response = await fetch("/api/social/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        recipientId: selectedId,
        content: draft.trim() || "[imagem]",
        imageUrl: draftImage || null,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Erro ao enviar mensagem.");
      return;
    }

    setDraft("");
    setDraftImage("");
    emitTyping(selectedId, false);
    setStatus("");
    await loadMessages(token, selectedId);
  }

  const selectedMember = useMemo(
    () =>
      conversations.find((c) => c.with.id === selectedId)?.with ||
      members.find((m) => m.id === selectedId) ||
      null,
    [conversations, members, selectedId]
  );

  const list = useMemo(() => {
    if (conversations.length > 0) return conversations.map((c) => c.with);
    return members;
  }, [conversations, members]);

  const filteredList = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => {
      const nome = String(item.nome || "").toLowerCase();
      const username = String(item.username || "").toLowerCase();
      return nome.includes(q) || username.includes(q);
    });
  }, [list, searchTerm]);

  if (loading) {
    return (
      <main className="rede-loader">
        <Spinner texto="Carregando mensagens..." />
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
          <h1>Mensagens privadas</h1>
          <div className="top-actions">
            <Link href="/rede" className="top-btn">Rede</Link>
            <Link href="/painel" className="top-btn">Painel</Link>
            <NotificationBell className="top-btn" />
            <button className="top-btn danger" onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/";
            }}>Sair</button>
          </div>
        </header>

        <section className="messages-layout">
          <aside className="messages-sidebar">
            <div className="messages-sidebar-head">
              <strong>Conversas</strong>
              <span>{filteredList.length}</span>
            </div>
            <input
              className="messages-search"
              placeholder="Buscar por nome ou @username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="messages-list">
              {filteredList.map((member) => {
                const convo = conversations.find((c) => c.with.id === member.id);
                const unread = convo?.unreadCount || 0;
                const isOnline = onlineIds.includes(member.id);
                const isTyping = typingIds.includes(member.id);
                return (
                  <button
                    key={member.id}
                    className={`conversation-item ${selectedId === member.id ? "active" : ""}`}
                    onClick={() => {
                      setSelectedId(member.id);
                      setDraft("");
                      setDraftImage("");
                    }}
                  >
                    <img src={member.avatar_url || "/images/logo.png"} alt="" />
                    <div className="conversation-text">
                      <strong>
                        {member.nome}
                        <span className={`online-dot ${isOnline ? "on" : ""}`} />
                      </strong>
                      <p>{isTyping ? "digitando..." : (convo?.lastMessage || `@${member.username || "membro"}`)}</p>
                    </div>
                    {unread > 0 ? <span className="conversation-unread">{unread}</span> : null}
                  </button>
                );
              })}
              {filteredList.length === 0 ? (
                <p className="messages-empty-list">Nenhuma conversa encontrada.</p>
              ) : null}
            </div>
          </aside>

          <section className="messages-chat">
            {!selectedMember ? (
              <div className="chat-empty-state">
                <h3>Selecione uma conversa</h3>
                <p>Escolha um membro na coluna da esquerda para abrir o chat.</p>
              </div>
            ) : (
              <>
                <header className="messages-chat-head">
                  <div className="chat-user-head">
                    <img src={selectedMember.avatar_url || "/images/logo.png"} alt="" />
                    <div>
                      <strong>{selectedMember.nome}</strong>
                      <p>
                        @{selectedMember.username || "membro"} •{" "}
                        {onlineIds.includes(selectedMember.id) ? "online" : "offline"}
                        {typingIds.includes(selectedMember.id) ? " • digitando..." : ""}
                      </p>
                    </div>
                  </div>
                  <div className="chat-head-actions">
                    <Link href={`/rede/perfil/${selectedMember.id}`} className="top-btn">
                      Ver perfil
                    </Link>
                  </div>
                </header>

                <div className="messages-stream">
                  {messages.map((msg) => (
                    <article
                      key={msg.id}
                      className={`message-bubble ${msg.sender_profile_id === me?.id ? "me" : "other"}`}
                    >
                      <p>{msg.content}</p>
                      {msg.image_url ? <img src={msg.image_url} alt="" /> : null}
                      <small>{new Date(msg.created_at).toLocaleString("pt-BR")}</small>
                    </article>
                  ))}
                </div>

                <footer className="messages-compose">
                  <input
                    placeholder={`Mensagem para ${selectedMember.nome}`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendMessage();
                    }}
                  />
                  <label className="chip-btn">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          const url = await uploadChatImage(file);
                          setDraftImage(url);
                        } catch (error) {
                          setStatus(error instanceof Error ? error.message : "Falha no upload.");
                        }
                      }}
                    />
                  </label>
                  <button onClick={sendMessage} disabled={uploading}>
                    Enviar
                  </button>
                </footer>

                {draftImage ? <img src={draftImage} alt="" className="preview-image" /> : null}
              </>
            )}
          </section>

          <aside className="messages-profile">
            {selectedMember ? (
              <>
                <img
                  className="messages-profile-avatar"
                  src={selectedMember.avatar_url || "/images/logo.png"}
                  alt=""
                />
                <h3>{selectedMember.nome}</h3>
                <p>@{selectedMember.username || "membro"}</p>
                <p className="messages-profile-role">{selectedMember.cargo}</p>
                <p className="messages-profile-status">
                  {onlineIds.includes(selectedMember.id) ? "Online agora" : "Offline"}
                </p>
                <Link href={`/rede/perfil/${selectedMember.id}`} className="quick-btn">
                  Abrir perfil completo
                </Link>
              </>
            ) : (
              <>
                <h3>Perfil</h3>
                <p>Abra uma conversa para ver detalhes do membro.</p>
              </>
            )}
          </aside>
        </section>
      </section>

      {status ? <div className="status-toast">{status}</div> : null}
    </main>
  );
}
