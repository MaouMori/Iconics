"use client";

import { useState } from "react";
import Link from "next/link";
import TopBar from "@/components/Topbar";
import Toast from "@/components/Toast";
import { supabase } from "@/lib/supabase";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const redirectTo = `${window.location.origin}/login/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (error) {
        setMsg(error.message);
      } else {
        setMsg("Se o e-mail existir, enviamos o link de recuperação.");
      }
    } catch {
      setMsg("Erro inesperado ao enviar recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopBar showPainel={false} showLogout={false} />
      <main style={wrap}>
        <section style={card}>
          <h1 style={title}>Recuperar Senha</h1>
          <p style={text}>Informe seu e-mail para receber o link de redefinição.</p>

          <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Seu e-mail"
              style={input}
            />
            <button type="submit" disabled={loading} style={btn}>
              {loading ? "Enviando..." : "Enviar link"}
            </button>
          </form>

          <Link href="/login" style={back}>
            Voltar para login
          </Link>
        </section>
      </main>
      {msg && <Toast mensagem={msg} onClose={() => setMsg("")} />}
    </>
  );
}

const wrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg,#090012,#170028)",
  padding: 20,
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  border: "1px solid rgba(201,156,255,.3)",
  borderRadius: 18,
  background: "rgba(20,8,32,.9)",
  padding: 20,
  color: "#fff",
};

const title: React.CSSProperties = { margin: "0 0 8px", fontSize: 28 };
const text: React.CSSProperties = { margin: "0 0 14px", color: "#dccfff" };
const input: React.CSSProperties = {
  height: 46,
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,.15)",
  background: "rgba(255,255,255,.04)",
  color: "#fff",
  padding: "0 12px",
};
const btn: React.CSSProperties = {
  height: 44,
  borderRadius: 10,
  border: "1px solid rgba(201,156,255,.6)",
  background: "#4b1d80",
  color: "#fff",
  fontWeight: 700,
};
const back: React.CSSProperties = { display: "inline-block", marginTop: 14, color: "#d8b4fe" };

