"use client";

import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { uploadPublicImage } from "@/lib/uploadImage";
import "../admin-dashboard.css";

type MemberCard = {
  id: number;
  nome: string;
  idade: number | null;
  cargo: string;
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
  ordem: number | null;
  galeria?: string[] | null;
};

export default function AdminMembrosPage() {
  const [permitido, setPermitido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [imagemFile, setImagemFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [galeria, setGaleria] = useState<string[]>(Array(16).fill(""));
  const [galeriaFiles, setGaleriaFiles] = useState<(File | null)[]>(Array(16).fill(null));
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [idade, setIdade] = useState("");
  const [cargo, setCargo] = useState("membro");
  const [meta, setMeta] = useState("");
  const [personalidade, setPersonalidade] = useState("");
  const [habitos, setHabitos] = useState("");
  const [gostos, setGostos] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [tags, setTags] = useState("");
  const [stats, setStats] = useState("");
  const [sigil, setSigil] = useState("*");
  const [imagemUrl, setImagemUrl] = useState("");
  const [accentColor, setAccentColor] = useState("#7c3aed");
  const [ordem, setOrdem] = useState(0);

  const [membros, setMembros] = useState<MemberCard[]>([]);

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

      if (profile?.cargo === "lider" || profile?.cargo === "vice_lider") {
        setPermitido(true);
        await carregarMembros();
      }

      setLoading(false);
    }

    iniciar();
  }, []);

  async function carregarMembros() {
    const { data, error } = await supabase
      .from("member_cards")
      .select("*")
      .order("ordem", { ascending: true });

    if (error) {
      setMensagem(error.message);
      return;
    }

    setMembros((data as MemberCard[]) || []);
  }

  function editarMembro(membro: MemberCard) {
    setEditingId(membro.id);
    setNome(membro.nome || "");
    setIdade(membro.idade ? String(membro.idade) : "");
    setCargo(membro.cargo || "membro");
    setMeta(membro.meta || "");
    setPersonalidade(membro.personalidade || "");
    setHabitos(membro.habitos || "");
    setGostos(membro.gostos || "");
    setHobbies(membro.hobbies || "");
    setTags(membro.tags || "");
    setStats(membro.stats || "");
    setSigil(membro.sigil || "*");
    setImagemUrl(membro.imagem_url || "");
    setAccentColor(membro.accent_color || "#7c3aed");
    setOrdem(membro.ordem ?? 0);
    setImagemFile(null);
    const galeriaExistente = Array.isArray(membro.galeria) ? membro.galeria : [];
    const galeriaCompleta = Array(16)
      .fill("")
      .map((_, index) => galeriaExistente[index] || "");

    setGaleria(galeriaCompleta);
    setGaleriaFiles(Array(16).fill(null));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function updateGaleriaUrl(index: number, value: string) {
      setGaleria((prev) => {
        const next = [...prev];
        next[index] = value;
        return next;
      });
    }

    function updateGaleriaFile(index: number, file: File | null) {
      setGaleriaFiles((prev) => {
        const next = [...prev];
        next[index] = file;
        return next;
      });
    }

    function resetGaleria() {
      setGaleria(Array(16).fill(""));
      setGaleriaFiles(Array(16).fill(null));
    }

  function limparFormulario() {
    setEditingId(null);
    setNome("");
    setIdade("");
    setCargo("membro");
    setMeta("");
    setPersonalidade("");
    setHabitos("");
    setGostos("");
    setHobbies("");
    setTags("");
    setStats("");
    setSigil("*");
    setImagemUrl("");
    setAccentColor("#7c3aed");
    setImagemFile(null);
    setOrdem(0);
    resetGaleria();
  }

  async function salvarMembro(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");

    // Validacao de campos obrigatorios
    if (!nome.trim()) {
      setMensagem("O nome e obrigatorio.");
      return;
    }
    if (!idade.trim()) {
      setMensagem("A idade e obrigatoria.");
      return;
    }
    if (!meta.trim()) {
      setMensagem("A meta/subtitulo e obrigatoria.");
      return;
    }
    if (!personalidade.trim()) {
      setMensagem("A personalidade e obrigatoria.");
      return;
    }
    if (!tags.trim()) {
      setMensagem("As tags sao obrigatorias (minimo 3).");
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setMensagem("Usuario nao autenticado.");
      return;
    }

    let finalImageUrl = imagemUrl;

    if (imagemFile) {
      try {
        setUploading(true);
        finalImageUrl = await uploadPublicImage(imagemFile, "member-images");
      } catch (error) {
        setUploading(false);
        setMensagem(error instanceof Error ? error.message : "Erro ao enviar imagem.");
        return;
      } finally {
        setUploading(false);
      }
    }
    let finalGaleria = [...galeria];

      for (let i = 0; i < galeriaFiles.length; i++) {
        const file = galeriaFiles[i];
        if (!file) continue;

        try {
          const uploadedUrl = await uploadPublicImage(file, "member-gallery");
          finalGaleria[i] = uploadedUrl;
        } catch (error) {
          setMensagem(
            error instanceof Error
              ? `Erro ao enviar imagem da galeria ${i + 1}: ${error.message}`
              : `Erro ao enviar imagem da galeria ${i + 1}.`
          );
          return;
        }
      }

      finalGaleria = finalGaleria
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 16);

    const payload = {
      nome,
      idade: idade ? Number(idade) : null,
      cargo,
      meta,
      personalidade,
      habitos,
      gostos,
      hobbies,
      tags,
      stats,
      sigil,
      imagem_url: finalImageUrl,
      accent_color: accentColor,
      criado_por: userData.user.id,
      ordem,
      galeria: finalGaleria,
    };

    let error = null;

    if (editingId) {
      const result = await supabase
        .from("member_cards")
        .update(payload)
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase
        .from("member_cards")
        .insert(payload);

      error = result.error;
    }

    if (error) {
      setMensagem(error.message);
      return;
    }

    setMensagem(
      editingId
        ? "Membro atualizado com sucesso."
        : "Card de membro criado com sucesso."
    );

    limparFormulario();
    await carregarMembros();
  }

  async function excluirMembro(id: number) {
    const confirmar = window.confirm("Tem certeza que deseja excluir este membro?");
    if (!confirmar) return;

    const { error } = await supabase.from("member_cards").delete().eq("id", id);

    if (error) {
      setMensagem(error.message);
      return;
    }

    if (editingId === id) {
      limparFormulario();
    }

    setMensagem("Membro excluido.");
    await carregarMembros();
  }

  async function moverMembro(memberId: number, direction: "up" | "down") {
    setMensagem("");

    const membrosOrdenados = [...membros].sort(
      (a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)
    );

    const currentIndex = membrosOrdenados.findIndex((m) => m.id === memberId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= membrosOrdenados.length) return;

    const membroAtual = membrosOrdenados[currentIndex];
    const membroDestino = membrosOrdenados[targetIndex];

    const ordemAtual = membroAtual.ordem ?? 0;
    const ordemDestino = membroDestino.ordem ?? 0;

    const { error: error1 } = await supabase
      .from("member_cards")
      .update({ ordem: ordemDestino })
      .eq("id", membroAtual.id);

    if (error1) {
      setMensagem(error1.message);
      return;
    }

    const { error: error2 } = await supabase
      .from("member_cards")
      .update({ ordem: ordemAtual })
      .eq("id", membroDestino.id);

    if (error2) {
      setMensagem(error2.message);
      return;
    }

    setMensagem("Ordem atualizada.");
    await carregarMembros();
  }

  if (loading) {
    return (
      <AdminShell
        active="membros"
        title="Gerenciar Membros"
        description="Cadastre, edite e organize todos os cards de membros."
      >
        <div style={contentLoadingStyle}>
          <Spinner texto="Carregando membros..." />
        </div>
      </AdminShell>
    );
  }

  if (!permitido) {
    return (
      <AdminShell
        active="membros"
        title="Gerenciar Membros"
        description="Cadastre, edite e organize todos os cards de membros."
      >
        <section className="admin-denied">
          <h2>Acesso negado</h2>
          <p>Somente vice-lider ou lider podem gerenciar membros.</p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="membros"
      title="Gerenciar Membros"
      description="Cadastre, edite e organize todos os cards de membros."
    >
      <div style={{ ...cardStyle, maxWidth: 1100 }}>
          <h1>Gerenciar Membros</h1>

          {editingId && (
            <p style={{ color: "#d8b4fe", marginTop: 8 }}>
              Voce esta editando um membro existente.
            </p>
          )}

          <p style={{ color: "#a78bfa", marginTop: 12, fontSize: 14 }}>
            * Campos obrigatorios para criar um card completo
          </p>

          <form onSubmit={salvarMembro} style={{ display: "grid", gap: 12, marginTop: 20 }}>
            <input
              style={inputStyle}
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />

            <input
              style={inputStyle}
              placeholder="Idade *"
              value={idade}
              onChange={(e) => setIdade(e.target.value)}
              required
            />

            <select
              style={inputStyle}
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              required
            >
              <option value="membro">Membro</option>
              <option value="veterano">Veterano</option>
              <option value="vice_lider">Vice lider</option>
              <option value="lider">Lider</option>
            </select>

            <input
              style={inputStyle}
              placeholder="Meta / subtitulo * (ex: Dominar, evoluir e ser estrela)"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
              required
            />

            <textarea
              style={textareaStyle}
              placeholder="Personalidade * (descricao do personagem)"
              value={personalidade}
              onChange={(e) => setPersonalidade(e.target.value)}
              required
            />

            <textarea
              style={textareaStyle}
              placeholder="Habitos"
              value={habitos}
              onChange={(e) => setHabitos(e.target.value)}
            />

            <textarea
              style={textareaStyle}
              placeholder="Gostos"
              value={gostos}
              onChange={(e) => setGostos(e.target.value)}
            />

            <textarea
              style={textareaStyle}
              placeholder="Hobbies"
              value={hobbies}
              onChange={(e) => setHobbies(e.target.value)}
            />

            <input
              style={inputStyle}
              placeholder="Tags * (separadas por | ) Ex: frio | misterioso | elegante | estrategica"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              required
            />

            <input
              style={inputStyle}
              placeholder="Stats (separadas por | ) Ex: Influencia:10 | Presenca:9 - MAX 100 CARACTERES"
              value={stats}
              maxLength={100}
              onChange={(e) => setStats(e.target.value)}
            />

            <input
              style={inputStyle}
              placeholder="Simbolo do card (sigil)"
              value={sigil}
              onChange={(e) => setSigil(e.target.value)}
            />

            <input
              style={inputStyle}
              type="file"
              accept="image/*"
              onChange={(e) => setImagemFile(e.target.files?.[0] || null)}
            />

            <input
              style={inputStyle}
              placeholder="Ou cole uma URL da imagem"
              value={imagemUrl}
              onChange={(e) => setImagemUrl(e.target.value)}
            />

            <input
              type="number"
              placeholder="Ordem de exibicao"
              value={ordem}
              onChange={(e) => setOrdem(Number(e.target.value))}
              style={inputStyle}
            />

            {(imagemFile || imagemUrl) && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={imagemFile ? URL.createObjectURL(imagemFile) : imagemUrl}
                  alt="Preview"
                  style={{
                    width: 180,
                    height: 220,
                    objectFit: "cover",
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,.08)",
                  }}
                />
              </div>
            )}
            <div style={galleryAdminWrapStyle}>
              <h3 style={{ margin: 0 }}>Galeria do membro</h3>
              <p style={{ margin: "4px 0 0", color: "#d8b4fe" }}>
                Voce pode adicionar ate 16 fotos. Pode usar upload ou URL.
              </p>

              <div style={galleryGridStyle}>
                {Array.from({ length: 16 }).map((_, index) => {
                  const previewSrc = galeriaFiles[index]
                    ? URL.createObjectURL(galeriaFiles[index] as File)
                    : galeria[index];

                  return (
                    <div key={index} style={galleryItemAdminStyle}>
                      <strong style={{ fontSize: 14 }}>Foto {index + 1}</strong>

                      <input
                        style={inputStyle}
                        type="file"
                        accept="image/*"
                        onChange={(e) => updateGaleriaFile(index, e.target.files?.[0] || null)}
                      />

                      <input
                        style={inputStyle}
                        placeholder={`URL da foto ${index + 1}`}
                        value={galeria[index] || ""}
                        onChange={(e) => updateGaleriaUrl(index, e.target.value)}
                      />
                      
                      {previewSrc ? (
                        <img
                          src={previewSrc}
                          alt={`Preview ${index + 1}`}
                          style={galleryPreviewStyle}
                          onClick={() => setPreviewImage(previewSrc)}
                        />
                        
                      ) : (
                        <div style={galleryEmptyPreviewStyle}>Sem imagem</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            {previewImage && (
              <div style={modalOverlayStyle} onClick={() => setPreviewImage(null)}>
                <img src={previewImage} alt="Preview da galeria" style={modalImageStyle} />
              </div>
            )}

            <input
              style={inputStyle}
              placeholder="Cor de destaque (hex ou nome: purple, gold, pink, cyan)"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
            />

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button type="submit" style={buttonStyle}>
                {uploading
                  ? "Enviando imagem..."
                  : editingId
                  ? "Salvar alteracoes"
                  : "Criar membro"}
              </button>

              {editingId && (
                <button type="button" style={buttonStyle} onClick={limparFormulario}>
                  Cancelar edicao
                </button>
              )}

              <button
                type="button"
                style={buttonStyle}
                onClick={() => (window.location.href = "/admin")}
              >
                Voltar
              </button>
            </div>
          </form>

          {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}

          <div style={{ marginTop: 28 }}>
            <h2>Membros cadastrados</h2>

            <div style={{ display: "grid", gap: 16, marginTop: 16 }}>
              {membros.map((membro) => (
                <div key={membro.id} style={itemCardStyle}>
                  <div>
                    <strong>{membro.nome}</strong>
                    <p style={mutedP}>Cargo: {membro.cargo}</p>
                    <p style={mutedP}>Ordem: {membro.ordem ?? 0}</p>
                    <p style={mutedP}>Meta: {membro.meta || "Sem meta"}</p>
                    <p style={mutedP}>Imagem: {membro.imagem_url || "Sem imagem"}</p>
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <button style={smallButtonStyle} onClick={() => moverMembro(membro.id, "up")}>Subir</button>

                    <button style={smallButtonStyle} onClick={() => moverMembro(membro.id, "down")}>Descer</button>

                    <button style={buttonStyle} onClick={() => editarMembro(membro)}>
                      Editar
                    </button>

                    <button style={deleteButtonStyle} onClick={() => excluirMembro(membro.id)}>
                      Excluir
                    </button>
                  </div>
                </div>
              ))}

              {membros.length === 0 && <p>Nenhum membro cadastrado ainda.</p>}
            </div>
          </div>
        </div>
    </AdminShell>
  );
}

const cardStyle: React.CSSProperties = {
  width: "100%",
  margin: "0 auto",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
  padding: "24px",
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
  minHeight: "100px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: "14px",
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  height: "46px",
  padding: "0 20px",
  borderRadius: "999px",
  border: "none",
  background: "#8b5cf6",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const smallButtonStyle: React.CSSProperties = {
  height: "42px",
  padding: "0 16px",
  borderRadius: "999px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
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

const itemCardStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  flexWrap: "wrap",
  gap: 16,
  padding: "18px",
  borderRadius: "16px",
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const mutedP: React.CSSProperties = {
  margin: "6px 0",
  color: "#d8b4fe",
};
const galleryAdminWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: 12,
  marginTop: 10,
};

const galleryGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: 18,
};

const galleryItemAdminStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(10px)",
};

const galleryPreviewStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  objectFit: "cover",
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  cursor: "pointer",
  transition: "0.2s",
};

const galleryEmptyPreviewStyle: React.CSSProperties = {
  width: "100%",
  aspectRatio: "3 / 4",
  borderRadius: 12,
  border: "1px dashed rgba(255,255,255,0.12)",
  display: "grid",
  placeItems: "center",
  color: "#d8b4fe",
  background: "rgba(255,255,255,0.02)",
};
const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  cursor: "zoom-out",
};

const modalImageStyle: React.CSSProperties = {
  maxWidth: "90%",
  maxHeight: "90%",
  borderRadius: 20,
  boxShadow: "0 0 40px rgba(168,85,247,.4)",
};

const contentLoadingStyle: React.CSSProperties = {
  minHeight: "46vh",
  display: "grid",
  placeItems: "center",
};



