"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import TopBar from "@/components/Topbar";
import Toast from "@/components/Toast";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [isRegister, setIsRegister] = useState(false);
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [identificador, setIdentificador] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  async function ensureProfile(token: string) {
    await fetch("/api/profiles/ensure", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async function resolveIdentifierToEmail(value: string) {
    const raw = value.trim().toLowerCase();
    if (!raw) return "";
    if (raw.includes("@")) return raw;

    const response = await fetch(`/api/auth/resolve?identifier=${encodeURIComponent(raw)}`);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.email) {
      throw new Error(payload?.error || "Usuario nao encontrado.");
    }
    return String(payload.email).toLowerCase();
  }

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
            data: { nome, usuario },
          },
        });

        if (error) {
          setMensagem(traduzirErro(error.message));
          setLoading(false);
          return;
        }

        setMensagem("Cadastro realizado com sucesso.");
      } else {
        const loginEmail = await resolveIdentifierToEmail(identificador);

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: senha,
        });

        if (error) {
          setMensagem(traduzirErro(error.message));
          setLoading(false);
          return;
        }

        if (!data.session) {
          setMensagem("Nao foi possivel iniciar a sessao. Verifique seu login e senha.");
          setLoading(false);
          return;
        }

        await ensureProfile(data.session.access_token);

        setMensagem("Login realizado com sucesso.");
        router.push("/painel");
        router.refresh();
      }
    } catch (error) {
      if (error instanceof Error && error.message) {
        setMensagem(error.message);
      } else {
        setMensagem("Ocorreu um erro inesperado.");
      }
    }

    setLoading(false);
  }

  async function handleDiscordLogin() {
    setMensagem("");
    setLoading(true);
    try {
      const redirectTo =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/callback`
          : undefined;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: { redirectTo },
      });

      if (error) {
        setMensagem(traduzirErro(error.message));
        setLoading(false);
      }
    } catch {
      setMensagem("Ocorreu um erro inesperado ao iniciar login com Discord.");
      setLoading(false);
    }
  }

  function traduzirErro(error: string) {
    const erro = error.toLowerCase();

    if (erro.includes("email not confirmed")) return "Seu e-mail ainda nao foi confirmado.";
    if (erro.includes("invalid login credentials")) return "Login ou senha incorretos.";
    if (erro.includes("user already registered")) return "Este e-mail ja esta cadastrado.";
    if (erro.includes("password should be at least")) return "A senha precisa ter pelo menos 6 caracteres.";

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
                <img src="/images/logo.png" alt="Logo ICONICS" className="login-emblem" />
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
                  <span className="field-icon">*</span>
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

              {isRegister && (
                <div className="field-wrap">
                  <span className="field-icon">@</span>
                  <input
                    type="text"
                    placeholder="Usuario (login sem @)"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="login-input"
                  />
                </div>
              )}

              {isRegister ? (
                <div className="field-wrap">
                  <span className="field-icon">@</span>
                  <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="login-input"
                  />
                </div>
              ) : (
                <div className="field-wrap">
                  <span className="field-icon">@</span>
                  <input
                    type="text"
                    placeholder="E-mail ou usuario"
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    required
                    className="login-input"
                  />
                </div>
              )}

              <div className="field-wrap">
                <span className="field-icon">#</span>
                <input
                  type={mostrarSenha ? "text" : "password"}
                  placeholder="Senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="login-input"
                />
                <button
                  type="button"
                  className="toggle-senha"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? "🙈" : "👁"}
                </button>
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
                  {isRegister ? "Ja tenho conta" : "Quero criar conta"}
                </button>

                {!isRegister && (
                  <Link href="/login/esqueci-senha" className="forgot-text">
                    Esqueci minha senha
                  </Link>
                )}
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading ? "Carregando..." : isRegister ? "Cadastrar" : "Entrar"}
              </button>

              {!isRegister && (
                <button
                  type="button"
                  disabled={loading}
                  className="login-discord"
                  onClick={handleDiscordLogin}
                >
                  Entrar com Discord
                </button>
              )}
            </form>

            {mensagem && <Toast mensagem={mensagem} onClose={() => setMensagem("")} />}
          </div>
        </section>
      </main>
    </>
  );
}
