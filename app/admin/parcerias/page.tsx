"use client";

import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { hasAdminAccess, normalizeRole } from "@/lib/roles";
import { uploadPublicImage } from "@/lib/uploadImage";
import { useEffect, useState } from "react";
import "../admin-dashboard.css";

type Partner = {
  id: number;
  nome: string;
  logo_url: string | null;
  descricao: string | null;
  beneficios: string | null;
  discord_link: string | null;
  codigo_desconto: string | null;
  cor_destaque: string | null;
  ativo: boolean;
  ordem: number | null;
};

export default function AdminParceriasPage() {
  const [permitido, setPermitido] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [nome, setNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [descricao, setDescricao] = useState("");
  const [beneficios, setBeneficios] = useState("");
  const [discordLink, setDiscordLink] = useState("");
  const [codigoDesconto, setCodigoDesconto] = useState("");
  const [corDestaque, setCorDestaque] = useState("#7c3aed");
  const [ativo, setAtivo] = useState(true);
  const [ordem, setOrdem] = useState(0);

  const [parcerias, setParcerias] = useState<Partner[]>([]);

  useEffect(() => {
    async function init() {
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

      const cargo = normalizeRole(profile?.cargo);
      if (hasAdminAccess(cargo)) {
        setPermitido(true);
        await carregarParcerias();
      }

      setLoading(false);
    }

    init();
  }, []);

  async function carregarParcerias() {
    const { data, error } = await supabase
      .from("partners")
      .select("*")
      .order("ordem", { ascending: true });

    if (error) {
      setMensagem(error.message);
      return;
    }

    setParcerias((data as Partner[]) || []);
  }

  function limpar() {
    setEditingId(null);
    setNome("");
    setLogoUrl("");
    setLogoFile(null);
    setDescricao("");
    setBeneficios("");
    setDiscordLink("");
    setCodigoDesconto("");
    setCorDestaque("#7c3aed");
    setAtivo(true);
    setOrdem(0);
  }

  function editar(p: Partner) {
    setEditingId(p.id);
    setNome(p.nome);
    setLogoUrl(p.logo_url || "");
    setDescricao(p.descricao || "");
    setBeneficios(p.beneficios || "");
    setDiscordLink(p.discord_link || "");
    setCodigoDesconto(p.codigo_desconto || "");
    setCorDestaque(p.cor_destaque || "#7c3aed");
    setAtivo(p.ativo);
    setOrdem(p.ordem ?? 0);
    setLogoFile(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");

    let finalLogoUrl = logoUrl;

    if (logoFile) {
      try {
        setUploading(true);
        finalLogoUrl = await uploadPublicImage(logoFile, "member-images");
      } catch (error) {
        setUploading(false);
        setMensagem(error instanceof Error ? error.message : "Erro ao enviar logo.");
        return;
      } finally {
        setUploading(false);
      }
    }

    const payload = {
      nome,
      logo_url: finalLogoUrl || null,
      descricao: descricao || null,
      beneficios: beneficios || null,
      discord_link: discordLink || null,
      codigo_desconto: codigoDesconto || null,
      cor_destaque: corDestaque || "#7c3aed",
      ativo,
      ordem,
    };

    let error = null;

    if (editingId) {
      const result = await supabase
        .from("partners")
        .update(payload)
        .eq("id", editingId);
      error = result.error;
    } else {
      const result = await supabase.from("partners").insert(payload);
      error = result.error;
    }

    if (error) {
      setMensagem(error.message);
      return;
    }

    setMensagem(editingId ? "Parceria atualizada com sucesso." : "Parceria criada com sucesso.");
    limpar();
    await carregarParcerias();
  }

  async function excluir(id: number) {
    if (!window.confirm("Excluir esta parceria?")) return;

    const { error } = await supabase.from("partners").delete().eq("id", id);
    if (error) {
      setMensagem(error.message);
      return;
    }

    if (editingId === id) limpar();
    setMensagem("Parceria excluída.");
    await carregarParcerias();
  }

  if (loading) {
    return (
      <AdminShell
        active="parcerias"
        title="Gerenciar Parcerias"
        description="Cadastre, edite e organize as parcerias exibidas no site."
      >
        <div style={contentLoadingStyle}>
          <Spinner texto="Carregando parcerias..." />
        </div>
      </AdminShell>
    );
  }

  if (!permitido) {
    return (
      <AdminShell
        active="parcerias"
        title="Gerenciar Parcerias"
        description="Cadastre, edite e organize as parcerias exibidas no site."
      >
        <section className="admin-denied">
          <h2>Acesso negado</h2>
          <p>Somente lideranca pode gerenciar parcerias.</p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="parcerias"
      title="Gerenciar Parcerias"
      description="Cadastre, edite e organize as parcerias exibidas no site."
    >
      <div style={panelStyle}>
          {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}

          <div style={twoCol}>
            <div>
              <h2 style={subTitle}>{editingId ? "Editar parceria" : "Nova parceria"}</h2>

              <form onSubmit={salvar} style={{ display: "grid", gap: 12 }}>
                <input style={inputStyle} placeholder="Nome da empresa" value={nome} onChange={(e) => setNome(e.target.value)} required />

                <input style={inputStyle} type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
                <input style={inputStyle} placeholder="Ou URL do logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />

                {(logoFile || logoUrl) && (
                  <img
                    src={logoFile ? URL.createObjectURL(logoFile) : logoUrl}
                    alt="Preview"
                    style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,.08)" }}
                  />
                )}

                <textarea style={textareaStyle} placeholder="Descrição da empresa" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                <textarea style={textareaStyle} placeholder="Benefícios (1 por linha)" value={beneficios} onChange={(e) => setBeneficios(e.target.value)} />

                <input style={inputStyle} placeholder="Link do Discord" value={discordLink} onChange={(e) => setDiscordLink(e.target.value)} />
                <input style={inputStyle} placeholder="Código de desconto" value={codigoDesconto} onChange={(e) => setCodigoDesconto(e.target.value)} />
                <input style={inputStyle} placeholder="Cor de destaque (hex)" value={corDestaque} onChange={(e) => setCorDestaque(e.target.value)} />
                <input style={inputStyle} type="number" placeholder="Ordem" value={ordem} onChange={(e) => setOrdem(Number(e.target.value))} />

                <label style={checkWrap}>
                  <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
                  Parceria ativa
                </label>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button type="submit" style={primaryBtn}>
                    {uploading ? "Enviando..." : editingId ? "Salvar alterações" : "Criar parceria"}
                  </button>
                  {editingId && (
                    <button type="button" style={secondaryBtn} onClick={limpar}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div>
              <h2 style={subTitle}>Parcerias ({parcerias.length})</h2>

              <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 700, overflowY: "auto" }}>
                {parcerias.map((p) => (
                  <div key={p.id} style={itemCard}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {p.logo_url ? (
                        <img src={p.logo_url} alt={p.nome} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(168,85,247,.15)", display: "grid", placeItems: "center", color: "#d8b4fe", fontWeight: 900 }}>
                          {p.nome.charAt(0)}
                        </div>
                      )}
                      <div>
                        <strong>{p.nome}</strong>
                        <p style={mutedP}>{p.ativo ? "Ativa" : "Inativa"} · Ordem: {p.ordem ?? 0}</p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button style={smallBtn} onClick={() => editar(p)}>Editar</button>
                      <button style={deleteBtn} onClick={() => excluir(p.id)}>Excluir</button>
                    </div>
                  </div>
                ))}

                {parcerias.length === 0 && <p style={{ color: "#d8b4fe" }}>Nenhuma parceria cadastrada.</p>}
              </div>
            </div>
          </div>
      </div>
    </AdminShell>
  );
}

const panelStyle: React.CSSProperties = {
  maxWidth: 1400,
  margin: "0 auto",
  borderRadius: 26,
  border: "1px solid rgba(201,156,255,.12)",
  background: "linear-gradient(180deg, rgba(18,7,30,.92), rgba(10,3,20,.92))",
  boxShadow: "0 24px 80px rgba(0,0,0,.35)",
  padding: 28,
};


const subTitle: React.CSSProperties = {
  margin: "0 0 16px",
  fontFamily: 'Georgia,"Times New Roman",serif',
  fontSize: "1.4rem",
};

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 32,
};

const inputStyle: React.CSSProperties = {
  height: 46,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: "0 14px",
  outline: "none",
};

const textareaStyle: React.CSSProperties = {
  minHeight: 100,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: 14,
  outline: "none",
};

const checkWrap: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  color: "#e9d5ff",
};

const primaryBtn: React.CSSProperties = {
  height: 46,
  padding: "0 20px",
  borderRadius: 999,
  border: "none",
  background: "#8b5cf6",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  height: 46,
  padding: "0 20px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const itemCard: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  padding: 16,
  borderRadius: 16,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
};

const mutedP: React.CSSProperties = {
  margin: "4px 0 0",
  color: "#d8b4fe",
  fontSize: "0.88rem",
};

const smallBtn: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,.08)",
  background: "rgba(255,255,255,.04)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const deleteBtn: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  borderRadius: 999,
  border: "none",
  background: "#dc2626",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const contentLoadingStyle: React.CSSProperties = {
  minHeight: "46vh",
  display: "grid",
  placeItems: "center",
};
