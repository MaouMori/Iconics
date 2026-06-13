"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/Topbar";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import { hasAdminAccess, normalizeRole } from "@/lib/roles";

type FieldType = "text" | "number" | "textarea" | "email" | "select" | "radio";

type FieldDef = {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  fullWidth?: boolean;
  options?: string[];
};

const fieldTypeLabels: Record<FieldType, string> = {
  text: "Resposta curta",
  textarea: "Paragrafo",
  email: "E-mail",
  number: "Numero",
  select: "Lista suspensa",
  radio: "Multipla escolha",
};

const fieldTypes: FieldType[] = ["text", "textarea", "email", "number", "select", "radio"];

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 42);
}

function makeUniqueId(base: string, fields: FieldDef[], ignoredIndex?: number) {
  const fallback = normalizeId(base) || "campo";
  const used = new Set(
    fields
      .filter((_, index) => index !== ignoredIndex)
      .map((field) => field.id)
  );

  if (!used.has(fallback)) return fallback;

  let next = 2;
  while (used.has(`${fallback}_${next}`)) {
    next += 1;
  }

  return `${fallback}_${next}`;
}

function createField(fields: FieldDef[], type: FieldType = "text"): FieldDef {
  const label = type === "radio" ? "Nova pergunta de escolha" : "Nova pergunta";
  return {
    id: makeUniqueId(label, fields),
    label,
    type,
    required: false,
    placeholder: type === "textarea" ? "Escreva uma resposta detalhada" : "Digite sua resposta",
    fullWidth: type === "textarea" || type === "radio",
    options: type === "select" || type === "radio" ? ["Opcao 1", "Opcao 2"] : undefined,
  };
}

function sanitizeFields(fields: FieldDef[]) {
  return fields.map((field) => ({
    id: field.id,
    label: field.label.trim(),
    type: field.type,
    required: !!field.required,
    placeholder: field.placeholder?.trim() || "",
    fullWidth: !!field.fullWidth,
    options:
      field.type === "select" || field.type === "radio"
        ? (field.options || []).map((option) => option.trim()).filter(Boolean)
        : undefined,
  }));
}

export default function AdminFormularioPage() {
  const [permitido, setPermitido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");

  const [settingsId, setSettingsId] = useState<number | null>(null);
  const [token, setToken] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [ativo, setAtivo] = useState(true);
  const [campos, setCampos] = useState<FieldDef[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [saving, setSaving] = useState(false);

  const selectedField = campos[selectedIndex] || null;

  const jsonPreview = useMemo(() => JSON.stringify(sanitizeFields(campos), null, 2), [campos]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();
      const { data: sessionData } = await supabase.auth.getSession();
      setToken(sessionData.session?.access_token || "");

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("cargo")
        .eq("id", userData.user.id)
        .single();

      const cargo = normalizeRole(profile?.cargo);
      if (!hasAdminAccess(cargo)) {
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
        const loadedFields = Array.isArray(data.campos) ? (data.campos as FieldDef[]) : [];
        setSettingsId(data.id);
        setTitulo(data.titulo || "");
        setDescricao(data.descricao || "");
        setAtivo(!!data.ativo);
        setCampos(loadedFields.length > 0 ? loadedFields : [createField([], "text")]);
      } else {
        setTitulo("Recrutamento Iconics");
        setDescricao("Conte a sua historia para a staff.");
        setCampos([createField([], "text")]);
      }

      setLoading(false);
    }

    load();
  }, []);

  function updateField(index: number, patch: Partial<FieldDef>) {
    setCampos((current) =>
      current.map((field, fieldIndex) => {
        if (fieldIndex !== index) return field;

        const next = { ...field, ...patch };
        if (patch.label !== undefined && (!field.id || field.id.startsWith("nova_pergunta"))) {
          next.id = makeUniqueId(patch.label, current, index);
        }
        if (patch.type && patch.type !== field.type) {
          next.fullWidth = patch.type === "textarea" || patch.type === "radio";
          next.options =
            patch.type === "select" || patch.type === "radio"
              ? field.options && field.options.length > 0
                ? field.options
                : ["Opcao 1", "Opcao 2"]
              : undefined;
        }
        return next;
      })
    );
  }

  function updateOption(fieldIndex: number, optionIndex: number, value: string) {
    setCampos((current) =>
      current.map((field, index) => {
        if (index !== fieldIndex) return field;
        const options = [...(field.options || [])];
        options[optionIndex] = value;
        return { ...field, options };
      })
    );
  }

  function addOption(fieldIndex: number) {
    setCampos((current) =>
      current.map((field, index) => {
        if (index !== fieldIndex) return field;
        const options = [...(field.options || []), `Opcao ${(field.options || []).length + 1}`];
        return { ...field, options };
      })
    );
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    setCampos((current) =>
      current.map((field, index) => {
        if (index !== fieldIndex) return field;
        const options = (field.options || []).filter((_, itemIndex) => itemIndex !== optionIndex);
        return { ...field, options: options.length > 0 ? options : ["Opcao 1"] };
      })
    );
  }

  function addField(type: FieldType = "text") {
    setCampos((current) => {
      const next = [...current, createField(current, type)];
      setSelectedIndex(next.length - 1);
      return next;
    });
  }

  function duplicateField(index: number) {
    setCampos((current) => {
      const original = current[index];
      if (!original) return current;
      const copy: FieldDef = {
        ...original,
        id: makeUniqueId(`${original.id}_copia`, current),
        label: `${original.label} (copia)`,
        options: original.options ? [...original.options] : undefined,
      };
      const next = [...current.slice(0, index + 1), copy, ...current.slice(index + 1)];
      setSelectedIndex(index + 1);
      return next;
    });
  }

  function removeField(index: number) {
    setCampos((current) => {
      const next = current.filter((_, fieldIndex) => fieldIndex !== index);
      setSelectedIndex(Math.max(0, Math.min(index, next.length - 1)));
      return next;
    });
  }

  function moveField(index: number, direction: -1 | 1) {
    setCampos((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      setSelectedIndex(target);
      return next;
    });
  }

  function validateFields(fields: FieldDef[]) {
    if (fields.length === 0) return "Adicione pelo menos uma pergunta.";

    const ids = new Set<string>();
    for (const field of fields) {
      if (!field.label.trim()) return "Toda pergunta precisa ter um titulo.";
      if (!field.id.trim()) return "Toda pergunta precisa ter um ID interno.";
      if (ids.has(field.id)) return `O ID interno "${field.id}" esta repetido.`;
      ids.add(field.id);
      if ((field.type === "select" || field.type === "radio") && (!field.options || field.options.length === 0)) {
        return `A pergunta "${field.label}" precisa ter pelo menos uma alternativa.`;
      }
    }

    return "";
  }

  async function saveSettings() {
    setMensagem("");
    setSaving(true);

    const parsedCampos = sanitizeFields(campos);
    const validationError = validateFields(parsedCampos);
    if (validationError) {
      setMensagem(validationError);
      setSaving(false);
      return;
    }

    const payload = {
      titulo: titulo.trim() || "Formulario de Recrutamento",
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
        setSaving(false);
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
        setSaving(false);
        return;
      }

      setSettingsId(data.id);
    }

    setSaving(false);
    setMensagem("Formulario salvo com sucesso.");
    if (token) {
      fetch("/api/admin/site-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: "Formulario de recrutamento atualizado",
          description: `${parsedCampos.length} pergunta(s) foram salvas. Status: ${ativo ? "ativo" : "inativo"}.`,
        }),
      }).catch(() => undefined);
    }
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
          <header style={heroStyle}>
            <div>
              <p style={kickerStyle}>Editor de formulario</p>
              <h1 style={titleStyle}>Gerenciar recrutamento</h1>
              <p style={mutedStyle}>
                Monte perguntas, escolhas e textos sem editar JSON. O site publica o formulario ativo automaticamente.
              </p>
            </div>
            <button style={saveButtonStyle} onClick={saveSettings} disabled={saving}>
              {saving ? "Salvando..." : "Salvar formulario"}
            </button>
          </header>

          <section style={settingsStyle}>
            <input
              style={inputStyle}
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              placeholder="Titulo do formulario"
            />
            <textarea
              style={descriptionStyle}
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Descricao que aparece antes das perguntas"
            />
            <label style={switchStyle}>
              <input
                type="checkbox"
                checked={ativo}
                onChange={(event) => setAtivo(event.target.checked)}
              />
              <span>Formulario ativo</span>
            </label>
          </section>

          <section style={workspaceStyle}>
            <aside style={fieldListStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={sectionTitleStyle}>Perguntas</h2>
                <span style={countStyle}>{campos.length}</span>
              </div>

              <div style={addGridStyle}>
                {fieldTypes.map((type) => (
                  <button key={type} style={smallButtonStyle} onClick={() => addField(type)}>
                    {fieldTypeLabels[type]}
                  </button>
                ))}
              </div>

              <div style={fieldStackStyle}>
                {campos.map((field, index) => (
                  <button
                    key={field.id || index}
                    style={{
                      ...fieldItemStyle,
                      ...(selectedIndex === index ? fieldItemActiveStyle : null),
                    }}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <span style={fieldNumberStyle}>{index + 1}</span>
                    <span style={fieldItemTextStyle}>
                      <strong>{field.label || "Pergunta sem titulo"}</strong>
                      <small>{fieldTypeLabels[field.type]}</small>
                    </span>
                  </button>
                ))}
              </div>
            </aside>

            <div style={editorStyle}>
              {selectedField ? (
                <>
                  <div style={sectionHeaderStyle}>
                    <h2 style={sectionTitleStyle}>Editar pergunta</h2>
                    <div style={toolbarStyle}>
                      <button style={iconButtonStyle} onClick={() => moveField(selectedIndex, -1)} title="Mover para cima">
                        Up
                      </button>
                      <button style={iconButtonStyle} onClick={() => moveField(selectedIndex, 1)} title="Mover para baixo">
                        Down
                      </button>
                      <button style={iconButtonStyle} onClick={() => duplicateField(selectedIndex)} title="Duplicar">
                        Copy
                      </button>
                      <button style={dangerButtonStyle} onClick={() => removeField(selectedIndex)} title="Remover">
                        X
                      </button>
                    </div>
                  </div>

                  <div style={formGridStyle}>
                    <label style={fieldLabelStyle}>
                      Pergunta
                      <input
                        style={inputStyle}
                        value={selectedField.label}
                        onChange={(event) => updateField(selectedIndex, { label: event.target.value })}
                      />
                    </label>

                    <label style={fieldLabelStyle}>
                      Tipo
                      <select
                        style={selectStyle}
                        value={selectedField.type}
                        onChange={(event) => updateField(selectedIndex, { type: event.target.value as FieldType })}
                      >
                        {fieldTypes.map((type) => (
                          <option key={type} value={type} style={optionStyle}>
                            {fieldTypeLabels[type]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label style={fieldLabelStyle}>
                      Placeholder
                      <input
                        style={inputStyle}
                        value={selectedField.placeholder || ""}
                        onChange={(event) => updateField(selectedIndex, { placeholder: event.target.value })}
                      />
                    </label>

                    <label style={fieldLabelStyle}>
                      ID interno
                      <input
                        style={inputStyle}
                        value={selectedField.id}
                        onChange={(event) =>
                          updateField(selectedIndex, {
                            id: makeUniqueId(normalizeId(event.target.value), campos, selectedIndex),
                          })
                        }
                      />
                    </label>
                  </div>

                  <div style={toggleRowStyle}>
                    <label style={switchStyle}>
                      <input
                        type="checkbox"
                        checked={!!selectedField.required}
                        onChange={(event) => updateField(selectedIndex, { required: event.target.checked })}
                      />
                      <span>Obrigatoria</span>
                    </label>
                    <label style={switchStyle}>
                      <input
                        type="checkbox"
                        checked={!!selectedField.fullWidth}
                        onChange={(event) => updateField(selectedIndex, { fullWidth: event.target.checked })}
                      />
                      <span>Ocupar linha inteira</span>
                    </label>
                  </div>

                  {(selectedField.type === "select" || selectedField.type === "radio") && (
                    <div style={optionsPanelStyle}>
                      <div style={sectionHeaderStyle}>
                        <h3 style={miniTitleStyle}>Alternativas</h3>
                        <button style={smallButtonStyle} onClick={() => addOption(selectedIndex)}>
                          Adicionar alternativa
                        </button>
                      </div>

                      {(selectedField.options || []).map((option, optionIndex) => (
                        <div key={`${selectedField.id}-${optionIndex}`} style={optionRowStyle}>
                          <span style={optionDotStyle}>{optionIndex + 1}</span>
                          <input
                            style={inputStyle}
                            value={option}
                            onChange={(event) => updateOption(selectedIndex, optionIndex, event.target.value)}
                          />
                          <button style={dangerButtonStyle} onClick={() => removeOption(selectedIndex, optionIndex)}>
                            X
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div style={emptyStyle}>Adicione uma pergunta para comecar.</div>
              )}
            </div>

            <aside style={previewStyle}>
              <div style={sectionHeaderStyle}>
                <h2 style={sectionTitleStyle}>Previa</h2>
                <span style={statusStyle}>{ativo ? "Ativo" : "Inativo"}</span>
              </div>

              <div style={previewCardStyle}>
                <h3 style={previewTitleStyle}>{titulo || "Formulario de recrutamento"}</h3>
                <p style={previewDescStyle}>{descricao || "Descricao do formulario."}</p>
                <div style={previewGridStyle}>
                  {campos.map((field) => renderPreviewField(field))}
                </div>
              </div>

              <details style={detailsStyle}>
                <summary>Ver JSON gerado</summary>
                <pre style={jsonStyle}>{jsonPreview}</pre>
              </details>
            </aside>
          </section>

          {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}
        </div>
      </main>
    </>
  );
}

function renderPreviewField(field: FieldDef) {
  const wrapperStyle = field.fullWidth ? previewFullFieldStyle : previewFieldStyle;

  if (field.type === "textarea") {
    return (
      <label key={field.id} style={wrapperStyle}>
        {field.label}
        <textarea style={previewTextareaStyle} placeholder={field.placeholder || field.label} disabled />
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label key={field.id} style={wrapperStyle}>
        {field.label}
        <select style={previewInputStyle} disabled>
          <option style={optionStyle}>Selecione uma opcao</option>
          {(field.options || []).map((option) => (
            <option key={option} style={optionStyle}>{option}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "radio") {
    return (
      <div key={field.id} style={previewFullFieldStyle}>
        <span style={previewLabelTextStyle}>{field.label}</span>
        <div style={previewOptionStackStyle}>
          {(field.options || []).map((option) => (
            <label key={option} style={previewOptionStyle}>
              <input type="radio" disabled />
              {option}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <label key={field.id} style={wrapperStyle}>
      {field.label}
      <input style={previewInputStyle} placeholder={field.placeholder || field.label} type={field.type} disabled />
    </label>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
  padding: "110px 24px 40px",
  color: "white",
};

const shellStyle: React.CSSProperties = {
  maxWidth: "1380px",
  margin: "0 auto",
  display: "grid",
  gap: 18,
};

const heroStyle: React.CSSProperties = {
  borderRadius: "24px",
  border: "1px solid rgba(201,156,255,.14)",
  background: "rgba(18,7,30,.92)",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
  padding: "24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 18,
  flexWrap: "wrap",
};

const kickerStyle: React.CSSProperties = {
  margin: 0,
  color: "#9ef0cf",
  textTransform: "uppercase",
  letterSpacing: ".14em",
  fontSize: ".78rem",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  margin: "8px 0",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "clamp(2rem, 4vw, 3rem)",
};

const mutedStyle: React.CSSProperties = {
  color: "#d8cceb",
  lineHeight: 1.65,
  margin: 0,
  maxWidth: 760,
};

const settingsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
  alignItems: "center",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  borderRadius: "18px",
  padding: 16,
};

const workspaceStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: 16,
  alignItems: "start",
};

const fieldListStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: 16,
  display: "grid",
  gap: 14,
};

const editorStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.045)",
  padding: 20,
  display: "grid",
  gap: 16,
};

const previewStyle: React.CSSProperties = {
  borderRadius: "18px",
  border: "1px solid rgba(158,240,207,0.16)",
  background: "rgba(7,24,24,0.42)",
  padding: 16,
  display: "grid",
  gap: 14,
};

const sectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "1.35rem",
};

const miniTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1rem",
  color: "#f3e8ff",
};

const countStyle: React.CSSProperties = {
  minWidth: 30,
  height: 30,
  borderRadius: 999,
  display: "grid",
  placeItems: "center",
  background: "rgba(158,240,207,0.16)",
  color: "#9ef0cf",
  fontWeight: 700,
};

const addGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 8,
};

const fieldStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const fieldItemStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  gap: 10,
  alignItems: "center",
  textAlign: "left",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: 10,
  cursor: "pointer",
};

const fieldItemActiveStyle: React.CSSProperties = {
  borderColor: "rgba(158,240,207,0.55)",
  background: "rgba(158,240,207,0.1)",
};

const fieldNumberStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 10,
  background: "rgba(255,255,255,0.08)",
  display: "grid",
  placeItems: "center",
  color: "#d8cceb",
  flexShrink: 0,
};

const fieldItemTextStyle: React.CSSProperties = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const formGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
};

const fieldLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
  color: "#f3e8ff",
  fontWeight: 700,
  fontSize: ".9rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minHeight: 46,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "rgba(255,255,255,0.055)",
  color: "white",
  padding: "0 13px",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  minWidth: 220,
  background: "#21162f",
  color: "#ffffff",
  colorScheme: "dark",
};

const optionStyle: React.CSSProperties = {
  background: "#21162f",
  color: "#ffffff",
};

const descriptionStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 76,
  padding: 13,
  resize: "vertical",
};

const switchStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  color: "#e9d5ff",
  whiteSpace: "nowrap",
};

const toggleRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 18,
  flexWrap: "wrap",
  padding: "4px 0",
};

const toolbarStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const smallButtonStyle: React.CSSProperties = {
  minHeight: 38,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "#f8f1ff",
  padding: "0 12px",
  cursor: "pointer",
  fontWeight: 700,
};

const iconButtonStyle: React.CSSProperties = {
  minWidth: 38,
  height: 38,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  fontWeight: 800,
};

const dangerButtonStyle: React.CSSProperties = {
  ...iconButtonStyle,
  borderColor: "rgba(255,98,125,0.28)",
  background: "rgba(120,20,45,0.28)",
  color: "#ffc4cf",
};

const saveButtonStyle: React.CSSProperties = {
  minHeight: 48,
  borderRadius: 999,
  border: "none",
  background: "linear-gradient(90deg, #0f766e, #10b981)",
  color: "white",
  fontWeight: 800,
  padding: "0 22px",
  cursor: "pointer",
};

const optionsPanelStyle: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.08)",
  paddingTop: 14,
  display: "grid",
  gap: 10,
};

const optionRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px 1fr 38px",
  gap: 8,
  alignItems: "center",
};

const optionDotStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  background: "rgba(158,240,207,0.14)",
  color: "#9ef0cf",
  display: "grid",
  placeItems: "center",
  fontWeight: 800,
};

const previewCardStyle: React.CSSProperties = {
  borderRadius: 16,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 16,
};

const previewTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "1.35rem",
};

const previewDescStyle: React.CSSProperties = {
  margin: "0 0 14px",
  color: "#d8cceb",
  lineHeight: 1.55,
};

const previewGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
};

const previewFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: 7,
  color: "#f3e8ff",
  fontSize: ".86rem",
  fontWeight: 700,
};

const previewFullFieldStyle: React.CSSProperties = {
  ...previewFieldStyle,
  gridColumn: "1 / -1",
};

const previewLabelTextStyle: React.CSSProperties = {
  color: "#f3e8ff",
  fontWeight: 700,
};

const previewInputStyle: React.CSSProperties = {
  minHeight: 42,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "#d8cceb",
  padding: "0 12px",
};

const previewTextareaStyle: React.CSSProperties = {
  ...previewInputStyle,
  minHeight: 86,
  padding: 12,
};

const previewOptionStackStyle: React.CSSProperties = {
  display: "grid",
  gap: 8,
};

const previewOptionStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 10,
  color: "#e9d5ff",
  background: "rgba(255,255,255,0.04)",
};

const statusStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "6px 10px",
  background: "rgba(158,240,207,0.12)",
  color: "#9ef0cf",
  fontSize: ".8rem",
  fontWeight: 800,
};

const detailsStyle: React.CSSProperties = {
  color: "#d8cceb",
};

const jsonStyle: React.CSSProperties = {
  maxHeight: 260,
  overflow: "auto",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#120a1f",
  color: "#e9d5ff",
  padding: 12,
  fontSize: ".8rem",
  lineHeight: 1.6,
};

const emptyStyle: React.CSSProperties = {
  minHeight: 260,
  display: "grid",
  placeItems: "center",
  color: "#d8cceb",
  border: "1px dashed rgba(255,255,255,0.16)",
  borderRadius: 16,
};
