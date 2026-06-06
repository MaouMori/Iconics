"use client";

import AdminShell from "@/components/AdminShell";
import Spinner from "@/components/Spinner";
import Toast from "@/components/Toast";
import { hasAdminAccess, normalizeRole } from "@/lib/roles";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type ManagedPage = {
  key: string;
  label: string;
  path: string;
  description: string;
  match: "exact" | "prefix";
};

export default function AdminPaginasPage() {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [token, setToken] = useState("");
  const [pages, setPages] = useState<ManagedPage[]>([]);
  const [visibility, setVisibility] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || "";
      setToken(accessToken);

      const { data: profile } = await supabase
        .from("profiles")
        .select("cargo")
        .eq("id", userData.user.id)
        .single();

      if (!hasAdminAccess(normalizeRole(profile?.cargo))) {
        setLoading(false);
        return;
      }

      setPermitido(true);
      const response = await fetch("/api/admin/page-visibility", {
        headers: { Authorization: `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const payload = await response.json().catch(() => ({}));
      setPages(Array.isArray(payload.pages) ? payload.pages : []);
      setVisibility(payload.visibility || {});
      setLoading(false);
    }

    load();
  }, []);

  function togglePage(key: string) {
    setVisibility((current) => ({ ...current, [key]: current[key] === false }));
  }

  async function save() {
    setSaving(true);
    setMensagem("");

    const response = await fetch("/api/admin/page-visibility", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ visibility }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMensagem(payload.error || "Erro ao salvar paginas.");
      setSaving(false);
      return;
    }

    setVisibility(payload.visibility || visibility);
    setSaving(false);
    setMensagem("Configuracao de paginas salva.");
  }

  if (loading) {
    return (
      <AdminShell active="paginas" title="Paginas do site">
        <div className="admin-page-loader"><Spinner texto="Carregando paginas..." /></div>
      </AdminShell>
    );
  }

  if (!permitido) {
    return (
      <AdminShell active="paginas" title="Paginas do site">
        <section className="admin-denied">Acesso negado.</section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="paginas"
      title="Paginas do site"
      description="Habilite ou desabilite paginas sem remover conteudo do banco."
    >
      <section className="admin-page-control-head">
        <div>
          <strong>{pages.length}</strong>
          <span> paginas monitoradas</span>
        </div>
        <button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar alteracoes"}</button>
      </section>

      <section className="admin-page-control-grid">
        {pages.map((page) => {
          const enabled = visibility[page.key] !== false;
          return (
            <article key={page.key} className={`admin-page-toggle-card ${enabled ? "enabled" : "disabled"}`}>
              <div>
                <h2>{page.label}</h2>
                <p>{page.description}</p>
                <code>{page.path}{page.match === "prefix" ? "/*" : ""}</code>
              </div>
              <button onClick={() => togglePage(page.key)}>
                {enabled ? "Ativa" : "Desativada"}
              </button>
            </article>
          );
        })}
      </section>

      {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}
    </AdminShell>
  );
}
