"use client";

import { useEffect, useState } from "react";
import TopBar from "@/components/Topbar";
import Toast from "@/components/Toast";
import "./recrutamento.css";

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

const fieldIcons: Record<FieldDef["type"], string> = {
  text: "I",
  number: "#",
  textarea: "Q",
  email: "@",
  select: "V",
  radio: "*",
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
          setMensagem(data?.error || "Nao foi possivel carregar o formulario.");
          setLoading(false);
          return;
        }

        setForm({
          ...data,
          titulo: data?.titulo || "Formulario Iconics",
          descricao: data?.descricao || "Preencha os campos abaixo e nossa equipe entrara em contato o mais breve possivel.",
          campos: Array.isArray(data?.campos) ? data.campos : [],
        });

        const initial: Record<string, string> = {};
        (data?.campos || []).forEach((field: FieldDef) => {
          initial[field.id] = "";
        });
        setRespostas(initial);
      } catch {
        setMensagem("Erro ao carregar formulario.");
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
    const className = field.fullWidth || field.type === "textarea" || field.type === "radio"
      ? "recruit-field full"
      : "recruit-field";

    if (field.type === "textarea") {
      return (
        <div key={field.id} className={className}>
          <label>
            <span>{fieldIcons[field.type]}</span>
            {field.label}
          </label>
          <div className="recruit-control frame textarea-frame">
            <textarea
              value={value}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder={field.placeholder || field.label}
              required={field.required}
            />
          </div>
        </div>
      );
    }

    if (field.type === "select") {
      return (
        <div key={field.id} className={className}>
          <label>
            <span>{fieldIcons[field.type]}</span>
            {field.label}
          </label>
          <div className="recruit-control frame select-frame">
            <select
              value={value}
              onChange={(e) => updateField(field.id, e.target.value)}
              required={field.required}
            >
              <option value="">Selecione uma opcao</option>
              {(field.options || []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }

    if (field.type === "radio") {
      return (
        <div key={field.id} className={className}>
          <label>
            <span>{fieldIcons[field.type]}</span>
            {field.label}
          </label>
          <div className="recruit-radio-list">
            {(field.options || []).map((option) => (
              <label key={option} className="recruit-radio-card">
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
      <div key={field.id} className={className}>
        <label>
          <span>{fieldIcons[field.type] || "I"}</span>
          {field.label}
        </label>
        <div className="recruit-control frame">
          <input
            type={field.type || "text"}
            value={value}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.placeholder || field.label}
            required={field.required}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <TopBar />
      <main className="recruit-page">
        <div className="recruit-grain" />
        <div className="recruit-shell">
          <aside className="recruit-panel frame">
            <div className="recruit-arch">
              <div className="recruit-bat">ICONICS</div>
            </div>
            <p className="recruit-kicker">Entre em contato</p>
            <h1>Formulario</h1>
            <div className="recruit-divider" />
            {form?.titulo ? <strong className="recruit-form-title">{form.titulo}</strong> : null}
            <p className="recruit-description">
              {form?.descricao || "Preencha os campos abaixo e nossa equipe entrara em contato o mais breve possivel."}
            </p>

            <div className="recruit-benefits">
              <div>
                <strong>Confidencialidade</strong>
                <span>Seus dados ficam seguros conosco.</span>
              </div>
              <div>
                <strong>Resposta rapida</strong>
                <span>Retornaremos assim que a revisao terminar.</span>
              </div>
              <div>
                <strong>Suporte dedicado</strong>
                <span>Estamos prontos para te ajudar.</span>
              </div>
            </div>
          </aside>

          <section className="recruit-form-frame frame">
            {loading ? (
              <p className="recruit-message">Carregando formulario...</p>
            ) : !form ? (
              <p className="recruit-message">{mensagem || "Nenhum formulario ativo."}</p>
            ) : (
              <form onSubmit={handleSubmit} className="recruit-form">
                {form.campos.map(renderField)}

                <button type="submit" className="recruit-submit frame" disabled={sending}>
                  <span>+</span>
                  {sending ? "Enviando..." : "Enviar formulario"}
                </button>

                <p className="recruit-policy">
                  Ao enviar, voce concorda com nossa Politica de Privacidade.
                </p>
              </form>
            )}
          </section>
        </div>

        {mensagem && !loading && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}
      </main>
    </>
  );
}
