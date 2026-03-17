"use client";

import TopBar from "@/components/Topbar";
import { supabase } from "@/lib/supabase";
import { uploadPublicImage } from "@/lib/uploadImage";
import { useEffect, useState } from "react";

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
    return <main style={pageStyle}>Carregando...</main>;
  }

  if (!permitido) {
    return (
      <>
        <TopBar />
        <main style={pageStyle}>
          <div style={panelStyle}>
            <h1 style={titleStyle}>Acesso negado</h1>
            <p style={mutedText}>
              Somente vice-líder ou líder podem gerenciar eventos.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <div style={panelStyle}>
          <div style={headerRow}>
            <div>
              <p style={eyebrowStyle}>Administração da Fraternidade</p>
              <h1 style={titleStyle}>Gerenciar Eventos</h1>
              <p style={mutedText}>
                Crie e organize os eventos que aparecem no calendário do site.
              </p>
            </div>

            <button
              style={primaryButton}
              onClick={() => (window.location.href = "/admin")}
            >
              Voltar
            </button>
          </div>

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
                    width: 240,
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

          {mensagem && <p style={messageStyle}>{mensagem}</p>}

          <div style={{ marginTop: 32 }}>
            <h2 style={sectionTitle}>Eventos cadastrados</h2>

            <div style={{ display: "grid", gap: 16, marginTop: 18 }}>
              {eventos.map((evento) => (
                <div key={evento.id} style={eventCardStyle}>
                  <div style={{ flex: 1 }}>
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
                          width: 220,
                          height: 140,
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
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "28px",
  color: "white",
};

const panelStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "1280px",
  margin: "0 auto",
  marginTop: "26px",
  borderRadius: "26px",
  border: "1px solid rgba(201,156,255,.12)",
  background: "linear-gradient(180deg, rgba(18,7,30,.92), rgba(10,3,20,.92))",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
  padding: "28px",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  alignItems: "flex-start",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontSize: "0.78rem",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0 8px",
  fontFamily: 'Georgia,"Times New Roman",serif',
  fontSize: "clamp(2rem, 4vw, 3rem)",
};

const mutedText: React.CSSProperties = {
  margin: 0,
  color: "#d8cceb",
  lineHeight: 1.7,
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia,"Times New Roman",serif',
  fontSize: "1.6rem",
};

const messageStyle: React.CSSProperties = {
  marginTop: "16px",
  color: "#e9d5ff",
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
};

const eventCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 16,
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const mutedP: React.CSSProperties = {
  margin: "8px 0",
  color: "#d8b4fe",
};