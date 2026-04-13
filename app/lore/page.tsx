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
            Na Universidade de Orleans, onde festas iluminam os corredores,
            câmeras registram cada momento e novas tendências nascem a cada
            semestre, existe uma fraternidade que domina tanto os holofotes
            quanto as sombras.
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
              { id: "curiosidades", label: "Curiosidades e Segredos" },
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

          <div className="mini-title">Arquivo visual da mansão</div>

          <div className="image-slot portrait paper-slot">
            <img
                  src="/images/mansao.png"
                  alt="Origem da ICONICS"
                  className="slot-image"
                />
          </div>

          <div className="divider"></div>

          <div className="mini-title">Registro simbólico</div>

          <div className="image-slot landscape">
            <img
                  src="/images/logo.png"
                  alt="Origem da ICONICS"
                  className="slot-image"
                />
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
                  A ICONICS nasceu dentro da Universidade de Orleans quando
                  alguns estudantes perceberam que a nova geração já não
                  conquistava poder apenas por cargos, títulos ou tradições.
                  O verdadeiro domínio havia mudado de forma: agora ele vivia
                  na capacidade de moldar narrativas, criar tendências e
                  influenciar multidões com uma única ideia.
                </p>

                <p>
                  Desde o início, a fraternidade passou a atrair pessoas que
                  não apenas participavam da cultura do campus, mas a definiam.
                  Fotógrafos, estilistas, streamers, artistas digitais,
                  músicos, performers e comunicadores encontraram na ICONICS
                  um espaço onde estética, presença e ambição se transformavam
                  em força coletiva.
                </p>

                <p>
                  Para o restante da universidade, elas sempre pareceram ser
                  apenas o que mostravam ao mundo: influenciadoras, artistas,
                  criadoras de tendências e presenças inesquecíveis. Mas por
                  trás da imagem impecável, a ICONICS cresceu como algo maior —
                  uma irmandade em que carisma, criatividade e poder caminham
                  lado a lado com algo mais antigo e mais difícil de explicar.
                </p>
              </div>

              <div className="image-slot square">
                <img
                  src="/images/origem.png"
                  alt="Origem da ICONICS"
                  className="slot-image"
                />
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
                <img
                  src="/images/simbolo.png"
                  alt="Símbolos da ICONICS"
                  className="slot-image"
                />
              </div>

              <div className="text-col">
                <p>
                  A identidade da ICONICS é construída sobre símbolos que falam
                  tanto de influência quanto de mistério. O roxo é sua cor:
                  intenso, noturno, elegante e impossível de ignorar. A câmera
                  é seu emblema principal, representando imagem, narrativa,
                  visibilidade e controle sobre aquilo que o mundo vê.
                </p>

                <p>
                  Sua mansão, conhecida por muitos como um verdadeiro estúdio
                  criativo, vive cercada por luzes, gravações, sessões de foto
                  e festas lendárias. Mas entre a decoração sofisticada e o
                  glamour cuidadosamente montado, há detalhes que poucos notam:
                  símbolos discretos espalhados pelos ambientes, objetos
                  antigos, velas esquecidas e traços de uma herança que parece
                  existir além da estética.
                </p>

                <blockquote>
                  “Influência, Criatividade e Poder.”
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
                  A filosofia da ICONICS se apoia em três pilares fundamentais:
                  influência, criatividade e poder. Influência, porque suas
                  integrantes compreendem que presença é uma forma de domínio.
                  Criatividade, porque tudo que nasce dentro da fraternidade
                  precisa ter assinatura, estética e impacto. E poder, porque
                  a verdadeira liderança não precisa ser anunciada quando já
                  é sentida por todos ao redor.
                </p>

                <p>
                  Dentro da fraternidade, há quem acredite que isso tudo seja
                  apenas resultado de estratégia, talento e carisma. Mas outras
                  integrantes aprendem cedo que existe algo mais profundo em
                  jogo. A sensação de que algumas presenças alteram a atmosfera
                  de um ambiente. A impressão de que certas ideias se espalham
                  rápido demais para serem apenas coincidência. A certeza de que
                  fascínio também pode ser uma força.
                </p>

                <p>
                  Na ICONICS, estética não é só aparência. Performance não é só
                  entretenimento. Tendência não é só moda. Tudo pode se tornar
                  linguagem, influência e marca. E, para algumas, isso é apenas
                  a primeira camada de algo muito maior.
                </p>
              </div>

              <div className="image-slot square">
                <img
                  src="/images/valores.png"
                  alt="Origem da ICONICS"
                  className="slot-image"
                />
              </div>
            </div>
          </article>

          {/* CURIOSIDADES */}
          <article className="section-card" id="curiosidades">
            <div className="section-heading">
              <h2>Curiosidades e Segredos</h2>
            </div>

            <div className="curiosity-grid">
              <div className="curiosity-note">
                <h4>Presença</h4>
                <p>
                  Dizem que quando uma integrante da ICONICS entra em uma sala,
                  os olhares se voltam naturalmente. Alguns chamam isso de
                  carisma. Outros preferem não tentar explicar.
                </p>
              </div>

              <div className="curiosity-note">
                <h4>Mansão</h4>
                <p>
                  A sede da fraternidade é famosa por suas festas, gravações e
                  encontros criativos. Ainda assim, muitos juram que a atmosfera
                  muda completamente quando a noite cai.
                </p>
              </div>

              <div className="curiosity-note">
                <h4>Sussurro</h4>
                <p>
                  Entre os membros mais antigos, uma frase sempre retorna como
                  aviso, lembrança ou maldição. Um nome envolto em sombras,
                  raramente dito em voz alta: “Maldita seja Nyx.”
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}