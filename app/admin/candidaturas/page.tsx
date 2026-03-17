"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/Topbar";

type Submission = {
  id: number;
  respostas: Record<string, string>;
  status: string;
  created_at: string;
};

export default function AdminCandidaturasPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [permitido, setPermitido] = useState(false);

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
        .from("recruitment_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      setItems((data as Submission[]) || []);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <main style={pageStyle}>Carregando...</main>;
  }

  if (!permitido) {
    return <main style={pageStyle}>Acesso negado.</main>;
  }

  return (
    <>
      <TopBar />
      <main style={pageStyle}>
        <div style={shellStyle}>
          <h1 style={titleStyle}>Candidaturas recebidas</h1>

          <div style={{ display: "grid", gap: 16 }}>
            {items.map((item) => (
              <div key={item.id} style={cardStyle}>
                <p style={smallStyle}>
                  {new Date(item.created_at).toLocaleString("pt-BR")}
                </p>

                {Object.entries(item.respostas || {}).map(([key, value]) => (
                  <p key={key} style={textStyle}>
                    <strong>{key}:</strong> {String(value)}
                  </p>
                ))}
              </div>
            ))}

            {items.length === 0 && <p>Nenhuma candidatura recebida.</p>}
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
  maxWidth: "1100px",
  margin: "0 auto",
};

const titleStyle: React.CSSProperties = {
  marginBottom: "20px",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "2.2rem",
};

const cardStyle: React.CSSProperties = {
  borderRadius: "20px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  padding: "20px",
};

const smallStyle: React.CSSProperties = {
  color: "#c99cff",
  marginBottom: "12px",
};

const textStyle: React.CSSProperties = {
  color: "#e9d5ff",
  lineHeight: 1.7,
  margin: "6px 0",
};