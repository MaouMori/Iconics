"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/Topbar";

type FieldDef = {
  id: string;
  label: string;
  type: "text" | "number" | "textarea" | "email" | "select" | "radio";
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  options?: string[];
};

type FormSettings = {
  id: number;
  titulo: string;
  descricao: string;
  campos: FieldDef[];
  ativo: boolean;
};

export default function RecrutamentoPage() {
  const [form, setForm] = useState<FormSettings | null>(null);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch("/api/recruitment/form", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok || !data) {
          setMensagem(data?.error || "Não foi possível carregar o formulário.");
          setLoading(false);
          return;
        }

        setForm(data);

        const initial: Record<string, string> = {};
        (data?.campos || []).forEach((field: FieldDef) => {
          initial[field.id] = "";
        });
        setRespostas(initial);
      } catch {
        setMensagem("Erro ao carregar formulário.");
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, []);

  function updateField(id: string, value: string) {
    setRespostas((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");
    setSending(true);

    try {
      const res = await fetch("/api/recruitment/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ respostas }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMensagem(data?.error || "Erro ao enviar candidatura.");
        setSending(false);
        return;
      }

      setMensagem("Candidatura enviada com sucesso.");

      const cleared: Record<string, string> = {};
      (form?.campos || []).forEach((field) => {
        cleared[field.id] = "";
      });
      setRespostas(cleared);
    } catch {
      setMensagem("Erro inesperado ao enviar.");
    } finally {
      setSending(false);
    }
  }

  function renderField(field: FieldDef) {
    const value = respostas[field.id] || "";
    const commonStyle = field.fullWidth ? fullFieldStyle : fieldStyle;

    if (field.type === "textarea") {
      return (
        <div key={field.id} style={commonStyle}>
          <label style={labelStyle}>{field.label}</label>
          <textarea
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder || field.label}
            required={field.required}
            style={textareaStyle}
          />
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.id} style={commonStyle}>
          <label style={labelStyle}>{field.label}</label>
          <select
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            required={field.required}
            style={inputStyle}
          >
            <option value="">Selecione uma opção</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "radio") {
      return (
        <div key={field.id} style={fullFieldStyle}>
          <label style={labelStyle}>{field.label}</label>
          <div style={radioWrapStyle}>
            {(field.options || []).map((option) => (
              <label key={option} style={radioCardStyle}>
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  checked={value === option}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  required={field.required}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={field.id} style={commonStyle}>
        <label style={labelStyle}>{field.label}</label>
        <input
          type={field.type || "text"}
          value={value}
          onChange={(e) => updateField(field.id, e.target.value)}
          placeholder={field.placeholder || field.label}
          required={field.required}
          style={inputStyle}
        />
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <div style={glowTopStyle} />
        <div style={glowBottomStyle} />

        <div style={shellStyle}>
          <div style={heroStyle}>
            <p style={kickerStyle}>Recrutamento Iconics</p>
            <h1 style={titleStyle}>{form?.titulo || "Formulário de Recrutamento"}</h1>
            <p style={descStyle}>
              {form?.descricao || "Preencha suas informações."}
            </p>
          </div>

          <div style={cardStyle}>
            {loading ? (
              <p style={messageStyle}>Carregando formulário...</p>
            ) : !form ? (
              <p style={messageStyle}>{mensagem || "Nenhum formulário ativo."}</p>
            ) : (
              <form onSubmit={handleSubmit} style={formGridStyle}>
                {form.campos.map(renderField)}

                <button type="submit" style={submitStyle} disabled={sending}>
                  {sending ? "Enviando..." : "Enviar candidatura"}
                </button>
              </form>
            )}

            {mensagem && !loading && <p style={messageStyle}>{mensagem}</p>}
          </div>
        </div>
      </main>
    </>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  position: "relative",
  overflow: "hidden",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "110px 24px 40px",
  color: "white",
};

const glowTopStyle: React.CSSProperties = {
  position: "absolute",
  top: -180,
  left: "50%",
  transform: "translateX(-50%)",
  width: 900,
  height: 420,
  borderRadius: "50%",
  background: "rgba(167,92,255,0.16)",
  filter: "blur(120px)",
  pointerEvents: "none",
};

const glowBottomStyle: React.CSSProperties = {
  position: "absolute",
  right: -120,
  bottom: -120,
  width: 520,
  height: 520,
  borderRadius: "50%",
  background: "rgba(96,36,255,0.16)",
  filter: "blur(120px)",
  pointerEvents: "none",
};

const shellStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  maxWidth: "1000px",
  margin: "0 auto",
};

const heroStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "24px",
};

const kickerStyle: React.CSSProperties = {
  margin: 0,
  color: "#c99cff",
  textTransform: "uppercase",
  letterSpacing: ".14em",
  fontSize: ".78rem",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: "10px 0 12px",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "clamp(2.2rem, 4vw, 3.4rem)",
};

const descStyle: React.CSSProperties = {
  color: "#d8cceb",
  lineHeight: 1.8,
  maxWidth: "760px",
  margin: "0 auto",
};

const cardStyle: React.CSSProperties = {
  borderRadius: "28px",
  border: "1px solid rgba(201,156,255,.14)",
  background: "rgba(18,7,30,.92)",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
  padding: "28px",
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const fieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const fullFieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  gridColumn: "1 / -1",
};

const labelStyle: React.CSSProperties = {
  color: "#f3e8ff",
  fontSize: ".95rem",
  fontWeight: 600,
  lineHeight: 1.5,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "52px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,.09)",
  background: "rgba(255,255,255,.05)",
  color: "#fff",
  padding: "0 16px",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  minHeight: "130px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,.09)",
  background: "rgba(255,255,255,.05)",
  color: "#fff",
  padding: "14px 16px",
  outline: "none",
  resize: "vertical",
};

const radioWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: "10px",
};

const radioCardStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: "10px",
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  borderRadius: "14px",
  padding: "12px 14px",
  color: "#e9d5ff",
  cursor: "pointer",
};

const submitStyle: React.CSSProperties = {
  gridColumn: "1 / -1",
  minHeight: "54px",
  borderRadius: "999px",
  border: "none",
  background: "linear-gradient(90deg, #5b21b6, #a855f7, #7c3aed)",
  color: "#fff",
  fontWeight: 700,
  fontSize: "1rem",
  cursor: "pointer",
  marginTop: "6px",
};

const messageStyle: React.CSSProperties = {
  marginTop: "16px",
  color: "#e9d5ff",
  lineHeight: 1.7,
};