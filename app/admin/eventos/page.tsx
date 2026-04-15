"use client";

import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { uploadPublicImage } from "@/lib/uploadImage";
import { useEffect, useState } from "react";
import "../admin-dashboard.css";

type EventItem = {
  id: number;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  horario: string | null;
  local: string | null;
  imagem_url: string | null;
};

export default function AdminEventosPage() {
  const [permitido, setPermitido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [uploading, setUploading] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [horario, setHorario] = useState("");
  const [local, setLocal] = useState("");
  const [imagemUrl, setImagemUrl] = useState("");
  const [imagemFile, setImagemFile] = useState<File | null>(null);

  const [eventos, setEventos] = useState<EventItem[]>([]);

  useEffect(() => {
    async function iniciar() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("cargo")
        .eq("id", userData.user.id)
        .single();

      const cargoNormalizado = String(profile?.cargo || "")
        .trim()
        .toLowerCase();

      if (cargoNormalizado === "lider" || cargoNormalizado === "vice_lider") {
        setPermitido(true);
        await carregarEventos();
      }

      setLoading(false);
    }

    iniciar();
  }, []);

  async function carregarEventos() {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("data_evento", { ascending: true });

    if (error) {
      setMensagem(error.message);
      return;
    }

    setEventos(data || []);
  }

  function limparFormulario() {
    setTitulo("");
    setDescricao("");
    setDataEvento("");
    setHorario("");
    setLocal("");
    setImagemUrl("");
    setImagemFile(null);
  }

  async function criarEvento(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMensagem("Usuário não autenticado.");
      return;
    }

    let finalImageUrl = imagemUrl;

    if (imagemFile) {
      try {
        setUploading(true);
        finalImageUrl = await uploadPublicImage(imagemFile, "event-images");
      } catch (error) {
        setUploading(false);
        setMensagem(
          error instanceof Error ? error.message : "Erro ao enviar imagem."
        );
        return;
      } finally {
        setUploading(false);
      }
    }

    const { error } = await supabase.from("events").insert({
      titulo,
      descricao,
      data_evento: dataEvento,
      horario,
      local,
      imagem_url: finalImageUrl,
      criado_por: userData.user.id,
    });

    if (error) {
      setMensagem(error.message);
      return;
    }

    setMensagem("Evento criado com sucesso.");
    limparFormulario();
    await carregarEventos();
  }

  async function excluirEvento(id: number) {
    const confirmar = window.confirm("Tem certeza que deseja excluir este evento?");
    if (!confirmar) return;

    const { error } = await supabase.from("events").delete().eq("id", id);

    if (error) {
      setMensagem(error.message);
      return;
    }

    setMensagem("Evento excluído.");
    await carregarEventos();
  }

  if (loading) {
    return (
      <main className="admin-page-loader">
        <Spinner />
      </main>
    );
  }

  if (!permitido) {
    return (
      <AdminShell
        active="eventos"
        title="Gerenciar Eventos"
        description="Crie e organize os eventos que aparecem no calendario do site."
      >
        <section className="admin-denied">
          <h2>Acesso negado</h2>
          <p>Somente vice-lider ou lider podem gerenciar eventos.</p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="eventos"
      title="Gerenciar Eventos"
      description="Crie e organize os eventos que aparecem no calendario do site."
    >
      <div style={panelStyle}>
          {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}

          <div style={twoColumnLayout}>
            {/* Coluna esquerda - Formulário */}
            <div style={leftColumn}>
              <h2 style={sectionTitle}>Criar novo evento</h2>

              <form onSubmit={criarEvento} style={{ display: "grid", gap: 12 }}>
                <input
                  style={inputStyle}
                  placeholder="Título do evento"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  required
                />

                <textarea
                  style={textareaStyle}
                  placeholder="Descrição"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />

                <div style={twoColStyle}>
                  <input
                    style={inputStyle}
                    type="date"
                    value={dataEvento}
                    onChange={(e) => setDataEvento(e.target.value)}
                    required
                  />

                  <input
                    style={inputStyle}
                    placeholder="Horário (ex: 22h)"
                    value={horario}
                    onChange={(e) => setHorario(e.target.value)}
                  />
                </div>

                <input
                  style={inputStyle}
                  placeholder="Local"
                  value={local}
                  onChange={(e) => setLocal(e.target.value)}
                />

                <input
                  style={inputStyle}
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
                />

                <input
                  style={inputStyle}
                  placeholder="Ou cole uma URL da imagem (opcional)"
                  value={imagemUrl}
                  onChange={(e) => setImagemUrl(e.target.value)}
                />

                {(imagemFile || imagemUrl) && (
                  <div style={{ marginTop: 8 }}>
                    <img
                      src={imagemFile ? URL.createObjectURL(imagemFile) : imagemUrl}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: 150,
                        objectFit: "cover",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,.08)",
                      }}
                    />
                  </div>
                )}

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button type="submit" style={primaryButton}>
                    {uploading ? "Enviando imagem..." : "Criar evento"}
                  </button>

                  <button type="button" style={secondaryButton} onClick={limparFormulario}>
                    Limpar
                  </button>
                </div>
              </form>
            </div>

            {/* Coluna direita - Eventos cadastrados */}
            <div style={rightColumn}>
              <h2 style={sectionTitle}>Eventos cadastrados ({eventos.length})</h2>

              <div style={eventsListStyle}>
                {eventos.map((evento) => (
                  <div key={evento.id} style={eventCardStyle}>
                    <div>
                      <strong style={{ fontSize: "1.05rem" }}>{evento.titulo}</strong>

                      <p style={mutedP}>
                        {evento.data_evento} • {evento.horario || "Sem horário"}
                      </p>

                      <p style={mutedP}>{evento.local || "Sem local"}</p>
                      <p style={mutedP}>{evento.descricao || "Sem descrição"}</p>

                      {evento.imagem_url && (
                        <img
                          src={evento.imagem_url}
                          alt={evento.titulo}
                          style={{
                            marginTop: 12,
                            width: "100%",
                            height: 120,
                            objectFit: "cover",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,.08)",
                          }}
                        />
                      )}
                    </div>

                    <button
                      style={deleteButtonStyle}
                      onClick={() => excluirEvento(evento.id)}
                    >
                      Excluir
                    </button>
                  </div>
                ))}

                {eventos.length === 0 && (
                  <p style={mutedText}>Nenhum evento cadastrado ainda.</p>
                )}
              </div>
            </div>
          </div>
      </div>
    </AdminShell>
  );
}

const panelStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
  marginTop: "26px",
  borderRadius: "26px",
  border: "1px solid rgba(201,156,255,.12)",
  background: "linear-gradient(180deg, rgba(18,7,30,.92), rgba(10,3,20,.92))",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
  padding: "28px",
};

const mutedText: React.CSSProperties = {
  margin: 0,
  color: "#d8cceb",
  lineHeight: 1.7,
};

const sectionTitle: React.CSSProperties = {
  margin: "0 0 16px",
  fontFamily: 'Georgia,"Times New Roman",serif',
  fontSize: "1.4rem",
};

const twoColumnLayout: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "32px",
};

const leftColumn: React.CSSProperties = {
  minWidth: 0,
};

const rightColumn: React.CSSProperties = {
  minWidth: 0,
  borderLeft: "1px solid rgba(255,255,255,0.08)",
  paddingLeft: "32px",
};

const twoColStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "12px",
};

const inputStyle: React.CSSProperties = {
  height: "46px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: "0 14px",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  minHeight: "110px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: "14px",
  outline: "none",
};

const primaryButton: React.CSSProperties = {
  height: "46px",
  padding: "0 20px",
  borderRadius: "999px",
  border: "none",
  background: "#8b5cf6",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton: React.CSSProperties = {
  height: "46px",
  padding: "0 20px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const deleteButtonStyle: React.CSSProperties = {
  height: "42px",
  padding: "0 16px",
  borderRadius: "999px",
  border: "none",
  background: "#dc2626",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  marginTop: "12px",
};

const eventsListStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  maxHeight: "700px",
  overflowY: "auto",
  paddingRight: "8px",
};

const eventCardStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const mutedP: React.CSSProperties = {
  margin: "4px 0",
  color: "#d8b4fe",
  fontSize: "0.95rem",
};
