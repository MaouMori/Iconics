"use client";

import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useEffect, useMemo, useState } from "react";
import "./admin-dashboard.css";

type Submission = {
  id: number;
  status: string;
  created_at: string;
  respostas: Record<string, string>;
};

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", active: true },
  { label: "Eventos", href: "/admin/eventos" },
  { label: "Membros", href: "/admin/membros" },
  { label: "Usuários", href: "/admin/usuarios" },
  { label: "Parcerias", href: "/admin/parcerias" },
  { label: "Vínculos", href: "/admin/vinculos" },
];

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [novasCandidaturas, setNovasCandidaturas] = useState(0);
  const [ultimasCandidaturas, setUltimasCandidaturas] = useState<Submission[]>([]);

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nome, cargo")
        .eq("id", userData.user.id)
        .single();

      const cargoNormalizado = String(profile?.cargo || "").trim().toLowerCase();

      if (
        cargoNormalizado !== "lider" &&
        cargoNormalizado !== "vice_lider" &&
        cargoNormalizado !== "admin" &&
        cargoNormalizado !== "staff"
      ) {
        setLoading(false);
        return;
      }

      setPermitido(true);
      setNome(profile?.nome || "Admin");
      setCargo(cargoNormalizado);

      const { data: submissions } = await supabase
        .from("recruitment_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      const lista = (submissions as Submission[]) || [];
      setUltimasCandidaturas(lista.slice(0, 4));
      setNovasCandidaturas(lista.filter((item) => item.status === "novo").length);
      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const cargoLabel = useMemo(() => {
    if (cargo === "lider") return "Líder";
    if (cargo === "vice_lider") return "Vice-líder";
    if (cargo === "admin") return "Admin";
    if (cargo === "staff") return "Staff";
    return cargo || "Membro";
  }, [cargo]);

  if (loading) {
    return (
      <main className="admin-page-loader">
        <Spinner texto="Carregando painel..." />
      </main>
    );
  }

  if (!permitido) {
    return (
      <main className="admin-page-loader">
        <section className="admin-denied">
          <h1>Acesso negado</h1>
          <p>Somente liderança/admin/staff podem acessar este painel.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-bg-stars" />
      <div className="admin-bg-glow" />

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">IO</div>
          <div className="admin-brand-name">ICONICS</div>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              className={`admin-nav-item ${item.active ? "active" : ""}`}
              onClick={() => (window.location.href = item.href)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="admin-user-chip">
          <span>{nome?.charAt(0).toUpperCase() || "I"}</span>
          <p>{nome || "Iconics"}</p>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-top-actions">
          <button onClick={() => (window.location.href = "/")} className="admin-top-btn">
            Voltar ao site
          </button>
          <button onClick={() => (window.location.href = "/painel")} className="admin-top-btn">
            Painel
          </button>
          <button onClick={handleLogout} className="admin-top-btn danger">
            Sair
          </button>
        </header>

        <section className="admin-hero">
          <p className="admin-kicker">Painel Iconics</p>
          <h1>Bem-vindo de volta, {nome}</h1>
          <p className="admin-meta">
            {cargoLabel} • Controle total ativo <span>{cargoLabel}</span>
          </p>
        </section>

        <section className="admin-cards">
          <article className="admin-card highlight">
            <h3>🚀 Candidaturas</h3>
            <p className="admin-card-value">{novasCandidaturas}</p>
            <button onClick={() => (window.location.href = "/admin/candidaturas")}>Ver candidaturas</button>
          </article>

          <article className="admin-card">
            <h3>⚙️ Formulário</h3>
            <p className="admin-card-icon">◉</p>
            <button onClick={() => (window.location.href = "/admin/formulario")}>Abrir editor</button>
          </article>

          <article className="admin-card">
            <h3>👁️ Visualizar</h3>
            <p className="admin-card-icon">◎</p>
            <button onClick={() => (window.location.href = "/recrutamento")}>Ver formulário</button>
          </article>
        </section>

        <section className="admin-table-wrap">
          <div className="admin-table-head">
            <h2>📄 Candidaturas recentes</h2>
            <button onClick={() => (window.location.href = "/admin/candidaturas")}>Ver todas</button>
          </div>

          <div className="admin-table">
            <div className="admin-row admin-row-header">
              <span>Nome</span>
              <span>Data</span>
              <span>Status</span>
            </div>

            {ultimasCandidaturas.length === 0 && (
              <div className="admin-row">
                <span>Nenhuma candidatura recente.</span>
                <span>-</span>
                <span>-</span>
              </div>
            )}

            {ultimasCandidaturas.map((item) => {
              const nomeCandidato =
                item.respostas?.nome ||
                item.respostas?.Nome ||
                item.respostas?.instagram ||
                "Sem identificação";

              return (
                <div key={item.id} className="admin-row">
                  <span>{String(nomeCandidato)}</span>
                  <span>{new Date(item.created_at).toLocaleDateString("pt-BR")}</span>
                  <span className={`status ${item.status === "novo" ? "novo" : "lido"}`}>
                    {item.status === "novo" ? "Novo" : "Lido"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
