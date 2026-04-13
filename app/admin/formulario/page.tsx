"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";

type FieldDef = {
  id: string;
  label: string;
  type: "text" | "number" | "textarea" | "email" | "select" | "radio";
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  options?: string[];
};

export default function AdminFormularioPage() {
  const [permitido, setPermitido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");

  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [camposJson, setCamposJson] = useState("[]");

  useEffect(() => {
    async function load() {
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

      const cargo = String(profile?.cargo || "").trim().toLowerCase();

      if (cargo !== "lider" && cargo !== "vice_lider") {
        setLoading(false);
        return;
      }

      setPermitido(true);

      const { data } = await supabase
        .from("recruitment_form_settings")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        setSettingsId(data.id);
        setTitulo(data.titulo || "");
        setDescricao(data.descricao || "");
        setAtivo(!!data.ativo);
        setCamposJson(JSON.stringify(data.campos || [], null, 2));
      }

      setLoading(false);
    }

    load();
  }, []);

  async function saveSettings() {
    setMensagem("");

    let parsedCampos: FieldDef[] = [];

    try {
      parsedCampos = JSON.parse(camposJson);
    } catch {
      setMensagem("O JSON dos campos está inválido.");
      return;
    }

    const payload = {
      titulo,
      descricao,
      ativo,
      campos: parsedCampos,
    };

    if (settingsId) {
      const { error } = await supabase
        .from("recruitment_form_settings")
        .update(payload)
        .eq("id", settingsId);

      if (error) {
        setMensagem(error.message);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from("recruitment_form_settings")
        .insert(payload)
        .select()
        .single();

      if (error) {
        setMensagem(error.message);
        return;
      }

      setSettingsId(data.id);
    }

    setMensagem("Formulário salvo com sucesso.");
  }

  if (loading) {
    return <main style={pageStyle}><Spinner /></main>;
  }

  if (!permitido) {
    return <main style={pageStyle}>Acesso negado.</main>;
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <div style={shellStyle}>
          <div style={heroCardStyle}>
            <p style={kickerStyle}>Editor de Formulário</p>
            <h1 style={titleStyle}>Gerenciar recrutamento</h1>
            <p style={mutedStyle}>
              Edite o título, descrição e os campos em JSON. Muito mais fácil de manter.
            </p>
          </div>

          <div style={gridStyle}>
            <div style={panelStyle}>
              <h2 style={panelTitleStyle}>Configuração</h2>

              <input
                style={inputStyle}
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título"
              />

              <textarea
                style={textareaStyle}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição"
              />

              <label style={checkboxWrap}>
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                />
                Formulário ativo
              </label>

              <h3 style={subTitleStyle}>Campos (JSON)</h3>

              <textarea
                style={jsonStyle}
                value={camposJson}
                onChange={(e) => setCamposJson(e.target.value)}
                placeholder="Cole aqui o JSON do formulário"
              />

              <button style={saveButtonStyle} onClick={saveSettings}>
                Salvar formulário
              </button>

              {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}
            </div>

            <div style={panelStyle}>
              <h2 style={panelTitleStyle}>Exemplo de campo</h2>

              <pre style={exampleStyle}>{`{
  "id": "nome_personagem",
  "label": "Nome do personagem",
  "type": "text",
  "required": true,
  "placeholder": "Digite o nome",
  "fullWidth": false
}`}</pre>

              <h2 style={{ ...panelTitleStyle, marginTop: 18 }}>Exemplo com alternativas</h2>

              <pre style={exampleStyle}>{`{
  "id": "frase_combinacao",
  "label": "Qual dessas frases mais combina com você?",
  "type": "radio",
  "required": true,
  "fullWidth": true,
  "options": [
    "Eu brilho mesmo em silêncio",
    "Não peço espaço, eu ocupo",
    "Minha presença fala antes de mim"
  ]
}`}</pre>
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
  padding: "110px 24px 40px",
  color: "white",
};

const shellStyle: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "grid",
  gap: 22,
};

const heroCardStyle: React.CSSProperties = {
  borderRadius: "28px",
  border: "1px solid rgba(201,156,255,.14)",
  background: "rgba(18,7,30,.92)",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
  padding: "28px",
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
  margin: "10px 0 8px",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "clamp(2rem, 4vw, 3rem)",
};

const mutedStyle: React.CSSProperties = {
  color: "#d8cceb",
  lineHeight: 1.7,
  margin: 0,
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: 20,
};

const panelStyle: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "24px",
  display: "grid",
  gap: 14,
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "1.7rem",
};

const subTitleStyle: React.CSSProperties = {
  margin: "8px 0 0",
  fontSize: "1rem",
  color: "#f3e8ff",
};

const inputStyle: React.CSSProperties = {
  height: "48px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: "0 14px",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  minHeight: "100px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: "14px",
  outline: "none",
};

const jsonStyle: React.CSSProperties = {
  minHeight: "460px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#120a1f",
  color: "#f3e8ff",
  padding: "16px",
  outline: "none",
  fontFamily: "monospace",
  fontSize: ".92rem",
  lineHeight: 1.7,
};

const checkboxWrap: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  color: "#e9d5ff",
};

const saveButtonStyle: React.CSSProperties = {
  height: "48px",
  borderRadius: "999px",
  border: "none",
  background: "#8b5cf6",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const messageStyle: React.CSSProperties = {
  color: "#e9d5ff",
  marginTop: "4px",
};

const exampleStyle: React.CSSProperties = {
  margin: 0,
  padding: "16px",
  borderRadius: "16px",
  background: "#120a1f",
  border: "1px solid rgba(255,255,255,0.06)",
  overflowX: "auto",
  color: "#ddd0f2",
  lineHeight: 1.7,
  fontSize: ".9rem",
};