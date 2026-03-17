"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/Topbar";

export default function LoginPage() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensagem("");
    setLoading(true);

    try {
      if (isRegister) {
 const { error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
    data: {
    nome,
    },
  },
});

  if (error) {
    setMensagem(traduzirErro(error.message));
    setLoading(false);
    return;
  }

  setMensagem("Cadastro realizado com sucesso.");
} else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });

        if (error) {
          setMensagem(traduzirErro(error.message));
          setLoading(false);
          return;
        }

        if (!data.session) {
          setMensagem("Não foi possível iniciar a sessão. Verifique seu e-mail e sua senha.");
          setLoading(false);
          return;
        }

        setMensagem("Login realizado com sucesso.");
        router.push("/painel");
        router.refresh();
      }
    } catch {
      setMensagem("Ocorreu um erro inesperado.");
    }

    setLoading(false);
  }

  function traduzirErro(error: string) {
    const erro = error.toLowerCase();

    if (erro.includes("email not confirmed")) {
      return "Seu e-mail ainda não foi confirmado.";
    }

    if (erro.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }

    if (erro.includes("user already registered")) {
      return "Este e-mail já está cadastrado.";
    }

    if (erro.includes("password should be at least")) {
      return "A senha precisa ter pelo menos 6 caracteres.";
    }

    return error;
  }

  return (
     <>
    <TopBar showPainel={false} showLogout={false} />
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #090012 0%, #140021 100%)",
        padding: "24px",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "24px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>{isRegister ? "Criar conta" : "Entrar"}</h1>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "12px" }}>
          {isRegister && (
            <input
              type="text"
              placeholder="Nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              style={inputStyle}
            />
          )}

          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              height: "48px",
              borderRadius: "999px",
              border: "none",
              background: "#8b5cf6",
              color: "white",
              fontWeight: 700,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Carregando..." : isRegister ? "Cadastrar" : "Entrar"}
          </button>
        </form>

        <button
          onClick={() => {
            setIsRegister(!isRegister);
            setMensagem("");
          }}
          style={{
            marginTop: "14px",
            background: "transparent",
            border: "none",
            color: "#d8b4fe",
            cursor: "pointer",
          }}
        >
          {isRegister ? "Já tenho conta" : "Quero criar conta"}
        </button>

        {mensagem && (
          <p style={{ marginTop: "16px", color: "#e9d5ff" }}>{mensagem}</p>
        )}
      </div>
      
    </main>
  </>  
  );
}

const inputStyle: React.CSSProperties = {
  height: "46px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  padding: "0 14px",
  outline: "none",
};