"use client";

import { useState } from "react";
import TopBar from "@/components/Topbar";
import "./lore.css";

export default function LorePage() {
  const [active, setActive] = useState("");

  function handleClick(id: string) {
    setActive(id);
  }

  return (
    <>
      <TopBar />

      <div className="page-bg" />
      <div className="noise" />

      <header className="lore-hero">
        <div className="hero-overlay"></div>

        <div className="hero-inner">
          <div className="hero-emblem">
            <img src="/images/logo.png" alt="Logo Iconics" />
          </div>

          <h1>ICONICS — Conventus Nycis</h1>
          <h2>Os Arquivos da Fraternidade</h2>

          <p>
            Na Universidade de Orleans, onde luzes de festas iluminam o campus e milhares de câmeras
            registram cada momento, existe uma fraternidade que domina tanto os holofotes quanto as sombras.
          </p>

          <div className="hero-actions">
            <a href="/" className="hero-btn">Voltar à página inicial</a>
          </div>
        </div>
      </header>

      <main className="lore-shell">
        <aside className="sidebar-card">
          <div className="ornament ornament-top"></div>

          <h3>Sumário</h3>

          <nav className="sidebar-nav">
            {[
              { id: "origem", label: "Origem e Formação" },
              { id: "simbolos", label: "Símbolos e Estética" },
              { id: "valores", label: "Valores e Filosofia" },
              { id: "curiosidades", label: "Curiosidades" },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={() => handleClick(item.id)}
                className={active === item.id ? "active" : ""}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="mini-title">De manuscritos antigos da</div>

          <div className="image-slot portrait paper-slot">
            <span>Imagem vertical</span>
          </div>

          <div className="divider"></div>

          <div className="mini-title">De manuscritos antigos</div>

          <div className="image-slot landscape">
            <span>Imagem horizontal</span>
          </div>

          <div className="ornament ornament-bottom"></div>
        </aside>

        <section className="content-area">
          {/* ORIGEM */}
          <article className="section-card" id="origem">
            <div className="section-heading">
              <h2>Origem e Formação</h2>
            </div>

            <div className="two-col">
              <div className="text-col">
                <p>
                  A fraternidade ICONICS nasceu da convergência entre ambição, estética e influência...
                </p>
                <p>
                  Seus primeiros nomes foram marcados por personalidade forte...
                </p>
              </div>

              <div className="image-slot">
                <span>Imagem horizontal</span>
              </div>
            </div>
          </article>

          {/* SIMBOLOS */}
          <article className="section-card" id="simbolos">
            <div className="section-heading">
              <h2>Símbolos e Estética</h2>
            </div>

            <div className="two-col reverse">
              <div className="image-slot square">
                <span>Logo</span>
              </div>

              <div className="text-col">
                <p>
                  A identidade visual da ICONICS é marcada por tons escuros...
                </p>

                <blockquote>
                  “Sob as luzes da noite e nas sombras do desconhecido, somos um.”
                </blockquote>
              </div>
            </div>
          </article>

          {/* VALORES */}
          <article className="section-card" id="valores">
            <div className="section-heading">
              <h2>Valores e Filosofia</h2>
            </div>

            <div className="two-col">
              <div className="text-col">
                <p>
                  A filosofia da ICONICS se apoia em três pilares...
                </p>
              </div>

              <div className="image-slot landscape">
                <span>Imagem</span>
              </div>
            </div>
          </article>

          {/* CURIOSIDADES */}
          <article className="section-card" id="curiosidades">
            <div className="section-heading">
              <h2>Curiosidades</h2>
            </div>

            <div className="curiosity-grid">
              <div className="curiosity-note">
                <h4>Curiosidades</h4>
                <p>Registros secretos e rituais...</p>
              </div>

              <div className="curiosity-note">
                <h4>Registro</h4>
                <p>Datas importantes e eventos...</p>
              </div>

              <div className="curiosity-note">
                <h4>Arquivo</h4>
                <p>Rumores e histórias lendárias...</p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}