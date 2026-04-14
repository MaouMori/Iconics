"use client";

import { useState } from "react";
import Link from "next/link";
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

          <h1>ICONICS â€” Conventus Nycis</h1>
          <h2>Os Arquivos da Fraternidade</h2>

          <p>
            Na Universidade de Orleans, onde festas iluminam os corredores,
            cÃ¢meras registram cada momento e novas tendÃªncias nascem a cada
            semestre, existe uma fraternidade que domina tanto os holofotes
            quanto as sombras.
          </p>

          <div className="hero-actions">
            <Link href="/" className="hero-btn">Voltar Ã  pÃ¡gina inicial</Link>
          </div>
        </div>
      </header>

      <main className="lore-shell">
        <aside className="sidebar-card">
          <div className="ornament ornament-top"></div>

          <h3>SumÃ¡rio</h3>

          <nav className="sidebar-nav">
            {[
              { id: "origem", label: "Origem e FormaÃ§Ã£o" },
              { id: "simbolos", label: "SÃ­mbolos e EstÃ©tica" },
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

          <div className="mini-title">Arquivo visual da mansÃ£o</div>

          <div className="image-slot portrait paper-slot">
            <img
                  src="/images/mansao.png"
                  alt="Origem da ICONICS"
                  className="slot-image"
                />
          </div>

          <div className="divider"></div>

          <div className="mini-title">Registro simbÃ³lico</div>

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
              <h2>Origem e FormaÃ§Ã£o</h2>
            </div>

            <div className="two-col">
              <div className="text-col">
                <p>
                  A ICONICS nasceu dentro da Universidade de Orleans quando
                  alguns estudantes perceberam que a nova geraÃ§Ã£o jÃ¡ nÃ£o
                  conquistava poder apenas por cargos, tÃ­tulos ou tradiÃ§Ãµes.
                  O verdadeiro domÃ­nio havia mudado de forma: agora ele vivia
                  na capacidade de moldar narrativas, criar tendÃªncias e
                  influenciar multidÃµes com uma Ãºnica ideia.
                </p>

                <p>
                  Desde o inÃ­cio, a fraternidade passou a atrair pessoas que
                  nÃ£o apenas participavam da cultura do campus, mas a definiam.
                  FotÃ³grafos, estilistas, streamers, artistas digitais,
                  mÃºsicos, performers e comunicadores encontraram na ICONICS
                  um espaÃ§o onde estÃ©tica, presenÃ§a e ambiÃ§Ã£o se transformavam
                  em forÃ§a coletiva.
                </p>

                <p>
                  Para o restante da universidade, elas sempre pareceram ser
                  apenas o que mostravam ao mundo: influenciadoras, artistas,
                  criadoras de tendÃªncias e presenÃ§as inesquecÃ­veis. Mas por
                  trÃ¡s da imagem impecÃ¡vel, a ICONICS cresceu como algo maior â€”
                  uma irmandade em que carisma, criatividade e poder caminham
                  lado a lado com algo mais antigo e mais difÃ­cil de explicar.
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
              <h2>SÃ­mbolos e EstÃ©tica</h2>
            </div>

            <div className="two-col reverse">
              <div className="image-slot square">
                <img
                  src="/images/simbolo.png"
                  alt="SÃ­mbolos da ICONICS"
                  className="slot-image"
                />
              </div>

              <div className="text-col">
                <p>
                  A identidade da ICONICS Ã© construÃ­da sobre sÃ­mbolos que falam
                  tanto de influÃªncia quanto de mistÃ©rio. O roxo Ã© sua cor:
                  intenso, noturno, elegante e impossÃ­vel de ignorar. A cÃ¢mera
                  Ã© seu emblema principal, representando imagem, narrativa,
                  visibilidade e controle sobre aquilo que o mundo vÃª.
                </p>

                <p>
                  Sua mansÃ£o, conhecida por muitos como um verdadeiro estÃºdio
                  criativo, vive cercada por luzes, gravaÃ§Ãµes, sessÃµes de foto
                  e festas lendÃ¡rias. Mas entre a decoraÃ§Ã£o sofisticada e o
                  glamour cuidadosamente montado, hÃ¡ detalhes que poucos notam:
                  sÃ­mbolos discretos espalhados pelos ambientes, objetos
                  antigos, velas esquecidas e traÃ§os de uma heranÃ§a que parece
                  existir alÃ©m da estÃ©tica.
                </p>

                <blockquote>
                  â€œInfluÃªncia, Criatividade e Poder.â€
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
                  A filosofia da ICONICS se apoia em trÃªs pilares fundamentais:
                  influÃªncia, criatividade e poder. InfluÃªncia, porque suas
                  integrantes compreendem que presenÃ§a Ã© uma forma de domÃ­nio.
                  Criatividade, porque tudo que nasce dentro da fraternidade
                  precisa ter assinatura, estÃ©tica e impacto. E poder, porque
                  a verdadeira lideranÃ§a nÃ£o precisa ser anunciada quando jÃ¡
                  Ã© sentida por todos ao redor.
                </p>

                <p>
                  Dentro da fraternidade, hÃ¡ quem acredite que isso tudo seja
                  apenas resultado de estratÃ©gia, talento e carisma. Mas outras
                  integrantes aprendem cedo que existe algo mais profundo em
                  jogo. A sensaÃ§Ã£o de que algumas presenÃ§as alteram a atmosfera
                  de um ambiente. A impressÃ£o de que certas ideias se espalham
                  rÃ¡pido demais para serem apenas coincidÃªncia. A certeza de que
                  fascÃ­nio tambÃ©m pode ser uma forÃ§a.
                </p>

                <p>
                  Na ICONICS, estÃ©tica nÃ£o Ã© sÃ³ aparÃªncia. Performance nÃ£o Ã© sÃ³
                  entretenimento. TendÃªncia nÃ£o Ã© sÃ³ moda. Tudo pode se tornar
                  linguagem, influÃªncia e marca. E, para algumas, isso Ã© apenas
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
                <h4>PresenÃ§a</h4>
                <p>
                  Dizem que quando uma integrante da ICONICS entra em uma sala,
                  os olhares se voltam naturalmente. Alguns chamam isso de
                  carisma. Outros preferem nÃ£o tentar explicar.
                </p>
              </div>

              <div className="curiosity-note">
                <h4>MansÃ£o</h4>
                <p>
                  A sede da fraternidade Ã© famosa por suas festas, gravaÃ§Ãµes e
                  encontros criativos. Ainda assim, muitos juram que a atmosfera
                  muda completamente quando a noite cai.
                </p>
              </div>

              <div className="curiosity-note">
                <h4>Sussurro</h4>
                <p>
                  Entre os membros mais antigos, uma frase sempre retorna como
                  aviso, lembranÃ§a ou maldiÃ§Ã£o. Um nome envolto em sombras,
                  raramente dito em voz alta: â€œMaldita seja Nyx.â€
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}

