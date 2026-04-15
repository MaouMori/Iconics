"use client";

import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabase";
import { uploadPublicImage } from "@/lib/uploadImage";
import { useEffect, useMemo, useState } from "react";

type LinkRequest = {
  id: number;
  member_card_id: number;
  status: string;
  requested_at: string;
};

type MemberCardRow = {
  id: number;
  nome: string;
  idade: number | null;
  cargo: string | null;
  meta: string | null;
  personalidade: string | null;
  habitos: string | null;
  gostos: string | null;
  hobbies: string | null;
  tags: string | null;
  stats: string | null;
  sigil: string | null;
  imagem_url: string | null;
  accent_color: string | null;
  galeria?: string[] | null;
};

type LinkResponse = {
  linked: boolean;
  card?: MemberCardRow;
  pendingRequests?: LinkRequest[];
};

type EditableForm = {
  nome: string;
  idade: string;
  cargo: string;
  meta: string;
  personalidade: string;
  habitos: string;
  gostos: string;
  hobbies: string;
  tags: string;
  stats: string;
  sigil: string;
  imagem_url: string;
  accent_color: string;
  galeria: string[];
};

const EMPTY_FORM: EditableForm = {
  nome: "",
  idade: "",
  cargo: "membro",
  meta: "",
  personalidade: "",
  habitos: "",
  gostos: "",
  hobbies: "",
  tags: "",
  stats: "",
  sigil: "",
  imagem_url: "",
  accent_color: "#7c3aed",
  galeria: Array(16).fill(""),
};

export default function PainelVinculoPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [requestMemberId, setRequestMemberId] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const [data, setData] = useState<LinkResponse>({ linked: false, pendingRequests: [] });
  const [form, setForm] = useState<EditableForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<(File | null)[]>(Array(16).fill(null));

  useEffect(() => {
    async function init() {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";

      if (!accessToken) {
        window.location.href = "/login";
        return;
      }

      setToken(accessToken);
      const response = await fetch("/api/member-links/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });

      const payload = (await response.json()) as LinkResponse & { error?: string };
      if (!response.ok) {
        setError(payload.error || "Erro ao carregar vinculo.");
        setLoading(false);
        return;
      }

      setData(payload);
      if (payload.linked && payload.card) {
        setForm(formFromCard(payload.card));
      }
      setLoading(false);
    }

    init();
  }, []);

  function formFromCard(card: MemberCardRow): EditableForm {
    const cleanGallery = Array.isArray(card.galeria)
      ? card.galeria.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 16)
      : [];

    return {
      nome: card.nome || "",
      idade: card.idade ? String(card.idade) : "",
      cargo: card.cargo || "membro",
      meta: card.meta || "",
      personalidade: card.personalidade || "",
      habitos: card.habitos || "",
      gostos: card.gostos || "",
      hobbies: card.hobbies || "",
      tags: card.tags || "",
      stats: card.stats || "",
      sigil: card.sigil || "",
      imagem_url: card.imagem_url || "",
      accent_color: card.accent_color || "#7c3aed",
      galeria: Array(16)
        .fill("")
        .map((_, i) => cleanGallery[i] || ""),
    };
  }

  async function loadMyLink(accessToken = token) {
    const response = await fetch("/api/member-links/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    const payload = (await response.json()) as LinkResponse & { error?: string };
    if (!response.ok) {
      setError(payload.error || "Erro ao carregar vinculo.");
      return;
    }

    setData(payload);
    setError("");

    if (payload.linked && payload.card) {
      setForm(formFromCard(payload.card));
    } else {
      setForm(EMPTY_FORM);
    }
  }

  async function sendLinkRequest() {
    setMessage("");
    setError("");

    const memberId = Number(requestMemberId);
    if (!Number.isInteger(memberId) || memberId <= 0) {
      setError("Informe um ID de membro valido.");
      return;
    }

    if (!requestCode.trim()) {
      setError("Informe o codigo de acesso.");
      return;
    }

    const response = await fetch("/api/member-links/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        memberId,
        accessCode: requestCode,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || "Erro ao enviar solicitacao.");
      return;
    }

    setMessage(payload.message || "Solicitacao enviada.");
    setRequestCode("");
    setRequestMemberId("");
    await loadMyLink();
  }

  async function saveMyCard() {
    if (!data.linked) return;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload: Record<string, unknown> = { ...form };

      if (imageFile) {
        payload.imagem_url = await uploadPublicImage(imageFile, "member-images");
      }

      const mergedGallery = [...form.galeria];
      for (let i = 0; i < galleryFiles.length; i += 1) {
        const file = galleryFiles[i];
        if (!file) continue;
        mergedGallery[i] = await uploadPublicImage(file, "member-gallery");
      }
      payload.galeria = mergedGallery.filter(Boolean);

      const response = await fetch("/api/member-links/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Nao foi possivel salvar.");
        return;
      }

      setMessage("Card atualizado com sucesso.");
      setImageFile(null);
      setGalleryFiles(Array(16).fill(null));
      await loadMyLink();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  const pending = data.pendingRequests || [];
  const galleryPreview = useMemo(() => form.galeria.map((x) => x.trim()), [form.galeria]);

  if (loading) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <Spinner texto="Carregando vinculo..." />
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <section style={panelStyle}>
          <div style={headerRow}>
            <div>
              <p style={eyebrow}>Vinculo de Membro</p>
              <h1 style={title}>Meu Card Vinculado</h1>
              <p style={muted}>
                Solicite o vinculo com o codigo de acesso do card. Apos aprovacao por lider, vice-lider
                ou staff, a edicao do card fica liberada para sua conta.
              </p>
            </div>
            <button style={secondaryBtn} onClick={() => (window.location.href = "/painel")}>
              Voltar ao painel
            </button>
          </div>

          {message && <Toast mensagem={message} onClose={() => setMessage("")} />}
          {error && <Toast mensagem={error} onClose={() => setError("")} />}

          {!data.linked && (
            <div style={requestBox}>
              <h3 style={cardTitle}>Solicitar vinculo</h3>
              <div style={grid2}>
                <input
                  style={input}
                  type="number"
                  min={1}
                  value={requestMemberId}
                  onChange={(e) => setRequestMemberId(e.target.value)}
                  placeholder="ID do card (ex.: 12)"
                />
                <input
                  style={input}
                  type="text"
                  value={requestCode}
                  onChange={(e) => setRequestCode(e.target.value)}
                  placeholder="Codigo de acesso do card"
                />
              </div>
              <button style={primaryBtn} onClick={sendLinkRequest}>
                Enviar solicitacao
              </button>

              {pending.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={muted}>Solicitacoes pendentes:</p>
                  {pending.map((item) => (
                    <p key={item.id} style={line}>
                      Pedido #{item.id} - card #{item.member_card_id} ({new Date(item.requested_at).toLocaleString("pt-BR")})
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}

          {data.linked && (
            <div style={editorWrap}>
              <h3 style={cardTitle}>Edicao do card vinculado</h3>

              <div style={grid2}>
                <input style={input} value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome" />
                <input style={input} value={form.idade} onChange={(e) => setForm((p) => ({ ...p, idade: e.target.value }))} placeholder="Idade" />
                <input style={input} value={form.cargo} onChange={(e) => setForm((p) => ({ ...p, cargo: e.target.value }))} placeholder="Cargo" />
                <input style={input} value={form.meta} onChange={(e) => setForm((p) => ({ ...p, meta: e.target.value }))} placeholder="Meta" />
              </div>

              <textarea style={textarea} value={form.personalidade} onChange={(e) => setForm((p) => ({ ...p, personalidade: e.target.value }))} placeholder="Personalidade" />
              <textarea style={textarea} value={form.habitos} onChange={(e) => setForm((p) => ({ ...p, habitos: e.target.value }))} placeholder="Habitos" />
              <textarea style={textarea} value={form.gostos} onChange={(e) => setForm((p) => ({ ...p, gostos: e.target.value }))} placeholder="Gostos" />
              <textarea style={textarea} value={form.hobbies} onChange={(e) => setForm((p) => ({ ...p, hobbies: e.target.value }))} placeholder="Hobbies" />

              <div style={grid2}>
                <input style={input} value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} placeholder="Tags (A|B|C)" />
                <input style={input} value={form.stats} onChange={(e) => setForm((p) => ({ ...p, stats: e.target.value }))} placeholder="Stats (Forca:10|Velocidade:8)" />
                <input style={input} value={form.sigil} onChange={(e) => setForm((p) => ({ ...p, sigil: e.target.value }))} placeholder="Sigil" />
                <input style={input} value={form.accent_color} onChange={(e) => setForm((p) => ({ ...p, accent_color: e.target.value }))} placeholder="Cor destaque (#7c3aed)" />
                <input style={input} value={form.imagem_url} onChange={(e) => setForm((p) => ({ ...p, imagem_url: e.target.value }))} placeholder="Imagem principal (URL)" />
                <input style={input} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
              </div>

              <h4 style={subtitle}>Galeria (ate 16 fotos)</h4>
              <p style={muted}>Cada foto tem um ID de 1 a 16. Use esse ID para controle rapido.</p>
              <div style={galleryGrid}>
                {Array.from({ length: 16 }).map((_, index) => (
                  <div key={index} style={galleryItem}>
                    <p style={{ margin: "0 0 8px", fontWeight: 700 }}>ID da foto: {index + 1}</p>
                    {galleryPreview[index] && (
                      <img src={galleryPreview[index]} alt={`Galeria ${index + 1}`} style={galleryPreviewStyle} />
                    )}
                    <input
                      style={input}
                      value={form.galeria[index] || ""}
                      onChange={(e) => {
                        const next = [...form.galeria];
                        next[index] = e.target.value;
                        setForm((p) => ({ ...p, galeria: next }));
                      }}
                      placeholder={`URL da foto ${index + 1}`}
                    />
                    <input
                      style={input}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const next = [...galleryFiles];
                        next[index] = e.target.files?.[0] || null;
                        setGalleryFiles(next);
                      }}
                    />
                    <button
                      style={secondaryBtn}
                      onClick={() => {
                        const next = [...form.galeria];
                        next[index] = "";
                        setForm((p) => ({ ...p, galeria: next }));
                      }}
                    >
                      Remover slot
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
                <h4 style={{ margin: 0 }}>Lista de imagens com ID</h4>
                {galleryPreview.filter(Boolean).length === 0 && (
                  <p style={muted}>Nenhuma imagem cadastrada.</p>
                )}
                {galleryPreview.map((src, index) =>
                  src ? (
                    <p key={`list-${index}`} style={line}>
                      <strong>ID {index + 1}:</strong> {src}
                    </p>
                  ) : null
                )}
              </div>

              <button style={primaryBtn} onClick={saveMyCard} disabled={saving}>
                {saving ? "Salvando..." : "Salvar alteracoes do meu card"}
              </button>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "110px 20px 40px",
  color: "#fff",
};

const panelStyle: React.CSSProperties = {
  maxWidth: 1200,
  margin: "0 auto",
  borderRadius: 22,
  border: "1px solid rgba(201,156,255,.16)",
  background: "rgba(11,3,20,.88)",
  padding: 22,
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 18,
};

const eyebrow: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: ".78rem",
  fontWeight: 700,
};

const title: React.CSSProperties = {
  margin: "8px 0",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "clamp(1.7rem, 4vw, 2.4rem)",
};

const muted: React.CSSProperties = { margin: 0, color: "#d8cceb", lineHeight: 1.6 };
const line: React.CSSProperties = { margin: "6px 0", color: "#e9ddff" };
const cardTitle: React.CSSProperties = { marginTop: 0, marginBottom: 12 };
const subtitle: React.CSSProperties = { marginTop: 16, marginBottom: 8 };
const grid2: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 };
const input: React.CSSProperties = { width: "100%", borderRadius: 10, border: "1px solid rgba(201,156,255,.35)", background: "rgba(255,255,255,.03)", color: "#fff", padding: "10px 12px" };
const textarea: React.CSSProperties = { ...input, minHeight: 88, marginTop: 10 } as React.CSSProperties;
const primaryBtn: React.CSSProperties = { marginTop: 14, borderRadius: 10, border: "1px solid rgba(201,156,255,.5)", background: "linear-gradient(180deg, #3d235f 0%, #2a1744 100%)", color: "#fff", padding: "10px 14px", fontWeight: 700 };
const secondaryBtn: React.CSSProperties = { borderRadius: 10, border: "1px solid rgba(201,156,255,.35)", background: "rgba(255,255,255,.05)", color: "#fff", padding: "8px 12px" };
const requestBox: React.CSSProperties = { border: "1px solid rgba(201,156,255,.2)", borderRadius: 14, padding: 14 };
const editorWrap: React.CSSProperties = { border: "1px solid rgba(201,156,255,.2)", borderRadius: 14, padding: 14 };
const galleryGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 };
const galleryItem: React.CSSProperties = { border: "1px solid rgba(201,156,255,.2)", borderRadius: 10, padding: 10 };
const galleryPreviewStyle: React.CSSProperties = { width: "100%", height: 130, objectFit: "cover", borderRadius: 8, marginBottom: 8 };
