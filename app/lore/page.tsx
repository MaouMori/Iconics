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

          <h1>ICONICS ? Conventus Nycis</h1>
          <h2>Os Arquivos da Fraternidade</h2>

          <p>
            Na Universidade de Orleans, onde festas iluminam os corredores,
            c?meras registram cada momento e novas tend?ncias nascem a cada
            semestre, existe uma fraternidade que domina tanto os holofotes
            quanto as sombras.
          </p>

          <div className="hero-actions">
            <Link href="/" className="hero-btn">Voltar Ã  p?gina inicial</Link>
          </div>
        </div>
      </header>

      <main className="lore-shell">
        <aside className="sidebar-card">
          <div className="ornament ornament-top"></div>

          <h3>Sum?rio</h3>

          <nav className="sidebar-nav">
            {[
              { id: "origem", label: "Origem e Forma??o" },
              { id: "simbolos", label: "S?mbolos e Est?tica" },
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

          <div className="mini-title">Arquivo visual da mans?o</div>

          <div className="image-slot portrait paper-slot">
            <img
                  src="/images/mansao.png"
                  alt="Origem da ICONICS"
                  className="slot-image"
                />
          </div>

          <div className="divider"></div>

          <div className="mini-title">Registro simb?lico</div>

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
              <h2>Origem e Forma??o</h2>
            </div>

            <div className="two-col">
              <div className="text-col">
                <p>
                  A ICONICS nasceu dentro da Universidade de Orleans quando
                  alguns estudantes perceberam que a nova gera??o j? n?o
                  conquistava poder apenas por cargos, t?tulos ou tradi??es.
                  O verdadeiro dom?nio havia mudado de forma: agora ele vivia
                  na capacidade de moldar narrativas, criar tend?ncias e
                  influenciar multid?es com uma ?nica ideia.
                </p>

                <p>
                  Desde o in?cio, a fraternidade passou a atrair pessoas que
                  n?o apenas participavam da cultura do campus, mas a definiam.
                  Fot?grafos, estilistas, streamers, artistas digitais,
                  m?sicos, performers e comunicadores encontraram na ICONICS
                  um espa?o onde est?tica, presen?a e ambi??o se transformavam
                  em for?a coletiva.
                </p>

                <p>
                  Para o restante da universidade, elas sempre pareceram ser
                  apenas o que mostravam ao mundo: influenciadoras, artistas,
                  criadoras de tend?ncias e presen?as inesquec?veis. Mas por
                  tr?s da imagem impec?vel, a ICONICS cresceu como algo maior ?
                  uma irmandade em que carisma, criatividade e poder caminham
                  lado a lado com algo mais antigo e mais dif?cil de explicar.
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
              <h2>S?mbolos e Est?tica</h2>
            </div>

            <div className="two-col reverse">
              <div className="image-slot square">
                <img
                  src="/images/simbolo.png"
                  alt="S?mbolos da ICONICS"
                  className="slot-image"
                />
              </div>

              <div className="text-col">
                <p>
                  A identidade da ICONICS ? constru?da sobre s?mbolos que falam
                  tanto de influ?ncia quanto de mist?rio. O roxo ? sua cor:
                  intenso, noturno, elegante e imposs?vel de ignorar. A c?mera
                  ? seu emblema principal, representando imagem, narrativa,
                  visibilidade e controle sobre aquilo que o mundo v?.
                </p>

                <p>
                  Sua mans?o, conhecida por muitos como um verdadeiro est?dio
                  criativo, vive cercada por luzes, grava??es, sess?es de foto
                  e festas lend?rias. Mas entre a decora??o sofisticada e o
                  glamour cuidadosamente montado, h? detalhes que poucos notam:
                  s?mbolos discretos espalhados pelos ambientes, objetos
                  antigos, velas esquecidas e tra?os de uma heran?a que parece
                  existir al?m da est?tica.
                </p>

                <blockquote>
                  â€œInflu?ncia, Criatividade e Poder.?
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
                  A filosofia da ICONICS se apoia em tr?s pilares fundamentais:
                  influ?ncia, criatividade e poder. Influ?ncia, porque suas
                  integrantes compreendem que presen?a ? uma forma de dom?nio.
                  Criatividade, porque tudo que nasce dentro da fraternidade
                  precisa ter assinatura, est?tica e impacto. E poder, porque
                  a verdadeira lideran?a n?o precisa ser anunciada quando j?
                  ? sentida por todos ao redor.
                </p>

                <p>
                  Dentro da fraternidade, h? quem acredite que isso tudo seja
                  apenas resultado de estrat?gia, talento e carisma. Mas outras
                  integrantes aprendem cedo que existe algo mais profundo em
                  jogo. A sensa??o de que algumas presen?as alteram a atmosfera
                  de um ambiente. A impress?o de que certas ideias se espalham
                  r?pido demais para serem apenas coincid?ncia. A certeza de que
                  fasc?nio tamb?m pode ser uma for?a.
                </p>

                <p>
                  Na ICONICS, est?tica n?o ? s? apar?ncia. Performance n?o ? s?
                  entretenimento. Tend?ncia n?o ? s? moda. Tudo pode se tornar
                  linguagem, influ?ncia e marca. E, para algumas, isso ? apenas
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
                <h4>Presen?a</h4>
                <p>
                  Dizem que quando uma integrante da ICONICS entra em uma sala,
                  os olhares se voltam naturalmente. Alguns chamam isso de
                  carisma. Outros preferem n?o tentar explicar.
                </p>
              </div>

              <div className="curiosity-note">
                <h4>Mans?o</h4>
                <p>
                  A sede da fraternidade ? famosa por suas festas, grava??es e
                  encontros criativos. Ainda assim, muitos juram que a atmosfera
                  muda completamente quando a noite cai.
                </p>
              </div>

              <div className="curiosity-note">
                <h4>Sussurro</h4>
                <p>
                  Entre os membros mais antigos, uma frase sempre retorna como
                  aviso, lembran?a ou maldi??o. Um nome envolto em sombras,
                  raramente dito em voz alta: â€œMaldita seja Nyx.?
                </p>
              </div>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}

