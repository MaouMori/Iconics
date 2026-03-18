"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import TopBar from "@/components/Topbar";
import "./login.css";

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
            data: { nome },
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

      <main className="login-page">
        <div className="login-bg-core" />
        <div className="login-bg-fog" />
        <div className="login-bg-noise" />

        <div className="login-light login-light-left" />
        <div className="login-light login-light-right" />

        <div className="login-column login-column-left" />
        <div className="login-column login-column-right" />

        <div className="login-steps" />

        <section className="login-shell">
          <div className="login-brand">
            <div className="login-emblem-orbit">
              <div className="login-emblem-ring">
                <img
                  src="/images/logo.png"
                  alt="Logo ICONICS"
                  className="login-emblem"
                />
              </div>
            </div>

            <h1 className="login-title">ICONICS</h1>
            <p className="login-subtitle">Bem-vindo de volta.</p>
          </div>

          <div className="login-panel">
            <div className="login-panel-crown" />

            <div className="login-panel-top">
              <h2>{isRegister ? "Criar Conta" : "Entrar"}</h2>
              <p>
                {isRegister
                  ? "Crie seu acesso ao portal da fraternidade."
                  : "Acesse o portal exclusivo da fraternidade."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {isRegister && (
                <div className="field-wrap">
                  <span className="field-icon">✦</span>
                  <input
                    type="text"
                    placeholder="Nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    className="login-input"
                  />
                </div>
              )}

              <div className="field-wrap">
                <span className="field-icon">✉</span>
                <input
                  type="email"
                  placeholder="E-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="login-input"
                />
              </div>

              <div className="field-wrap">
                <span className="field-icon">🔒</span>
                <input
                  type="password"
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="login-input"
                />
              </div>

              <div className="login-links">
                <button
                  type="button"
                  className="link-ghost"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setMensagem("");
                  }}
                >
                  {isRegister ? "Já tenho conta" : "Quero criar conta"}
                </button>

                {!isRegister && (
                  <span className="forgot-text">Esqueceu a senha?</span>
                )}
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading ? "Carregando..." : isRegister ? "Cadastrar" : "Entrar"}
              </button>
            </form>

            {mensagem && <p className="login-message">{mensagem}</p>}
          </div>
        </section>
      </main>
    </>
  );
}