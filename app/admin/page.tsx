"use client";

import Spinner from "@/components/Spinner";
import AdminShell from "@/components/AdminShell";
import { supabase } from "@/lib/supabase";
import { getRoleLabel, hasAdminAccess } from "@/lib/roles";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import "./admin-dashboard.css";

type Submission = {
  id: number;
  status: string;
  created_at: string;
  respostas: Record<string, string>;
};

export default function AdminPage() {
  const router = useRouter();
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

      if (!hasAdminAccess(cargoNormalizado)) {
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

  const cargoLabel = useMemo(() => {
    return getRoleLabel(cargo);
  }, [cargo]);

  if (loading) {
    return (
      <AdminShell
        active="dashboard"
        title="Painel Iconics"
        description="Carregando dados do painel..."
      >
        <div style={contentLoadingStyle}>
          <Spinner texto="Carregando painel..." />
        </div>
      </AdminShell>
    );
  }

  if (!permitido) {
    return (
      <AdminShell active="dashboard" title="Painel Iconics">
        <section className="admin-denied">
          <h1>Acesso negado</h1>
          <p>Somente lideranca pode acessar este painel.</p>
        </section>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      active="dashboard"
      title={`Bem-vindo de volta, ${nome}`}
      description={`${cargoLabel} • Controle total ativo`}
      userName={nome}
    >
      <section className="admin-cards">
        <article className="admin-card highlight">
          <h3>🚀 Candidaturas</h3>
          <p className="admin-card-value">{novasCandidaturas}</p>
          <button onClick={() => router.push("/admin/candidaturas")}>Ver candidaturas</button>
        </article>

        <article className="admin-card">
          <h3>⚙️ Formulario</h3>
          <p className="admin-card-icon">◉</p>
          <button onClick={() => router.push("/admin/formulario")}>Abrir editor</button>
        </article>

        <article className="admin-card">
          <h3>👁️ Visualizar</h3>
          <p className="admin-card-icon">◎</p>
          <button onClick={() => router.push("/recrutamento")}>Ver formulario</button>
        </article>
      </section>

      <section className="admin-table-wrap">
        <div className="admin-table-head">
          <h2>📄 Candidaturas recentes</h2>
          <button onClick={() => router.push("/admin/candidaturas")}>Ver todas</button>
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
              "Sem identificacao";

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
    </AdminShell>
  );
}

const contentLoadingStyle: React.CSSProperties = {
  minHeight: "46vh",
  display: "grid",
  placeItems: "center",
};
