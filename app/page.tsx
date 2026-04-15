import Script from "next/script";
import "@/styles/style.css";
import "@/styles/calendar.css";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <div className="bg-grid"></div>
      <div className="bg-nebula"></div>
      <div className="particles" id="particles"></div>
      <div className="mouse-glow" id="mouseGlow"></div>
      <div className="cinema-transition" id="cinemaTransition"></div>

     <Navbar /> 

      <main className="site">
        <section className="hero" id="home">
          <div className="hero-overlay"></div>
          <div className="hero-castles left"></div>
          <div className="hero-castles right"></div>
          <div className="hero-moon"></div>
          <div className="hero-fog fog-1"></div>
          <div className="hero-fog fog-2"></div>
          <div className="hero-rune rune-left"></div>
          <div className="hero-rune rune-right"></div>

          <div className="hero-guards">
            <div className="guardian left">
              <div className="guardian-body"></div>
              <div className="guardian-staff"></div>
            </div>
            <div className="guardian right">
              <div className="guardian-body"></div>
              <div className="guardian-staff"></div>
            </div>
          </div>

          <div className="hero-content">
            <div className="hero-top-symbol-wrap">
              <img
                src="/images/olho.png"
                alt="Simbolo superior da Iconics"
                className="hero-top-symbol"
              />
            </div>

            <h1>ICONICS</h1>

            <div className="portal-showcase">
              <div className="portal-steps"></div>
              <div className="portal-arch"></div>
              <div className="portal-thorns thorns-left"></div>
              <div className="portal-thorns thorns-right"></div>
              <div className="portal-ring outer"></div>
              <div className="portal-ring middle"></div>
              <div className="portal-ring inner"></div>
              <div className="portal-core"></div>
              <div className="portal-energy"></div>
              <div className="portal-smoke smoke-a"></div>
              <div className="portal-smoke smoke-b"></div>
              <div className="portal-smoke smoke-c"></div>

              <div className="hero-center-logo-wrap">
                <img
                  src="/images/logo.png"
                  alt="Logo central da Iconics"
                  className="hero-center-logo"
                />
              </div>
            </div>

            <button className="portal-btn2" id="goMembers">
              Explore o Portal da ICONICS
            </button>
          </div>
        </section>

        <section className="members" id="members">
          <div className="members-bg-gallery">
            <div
              className="bg-slide active"
              style={{ backgroundImage: "url('/images/foto1.png')" }}
            ></div>
            <div
              className="bg-slide"
              style={{ backgroundImage: "url('/images/foto2.png')" }}
            ></div>
            <div
              className="bg-slide"
              style={{ backgroundImage: "url('/images/foto3.png')" }}
            ></div>
            <div
              className="bg-slide"
              style={{ backgroundImage: "url('/images/foto4.png')" }}
            ></div>
          </div>

          <div className="members-bg-overlay"></div>

          <div className="members-content">
            <div className="section-title">
              <h2>Membros em destaque</h2>
              <p>Conheca nossos membros e venha se tornar um deles</p>
            </div>

            <div className="members-wrapper">
              <div className="member-main-panel" id="memberMainPanel">
                <div className="member-info-panel">
                  <span className="member-badge">Membro das Iconics</span>
                  <h3 id="memberName">Carregando...</h3>
                  <p className="member-role" id="memberRole"></p>
                  <p className="member-meta" id="memberMeta"></p>

                  <div className="tag-list" id="memberTags"></div>
                  <div className="stats-list" id="memberStats"></div>

                  <button className="discord-btn">
                    Saiba Mais Sobre o Membro
                  </button>
                </div>

                <div className="member-art-panel">
                  <div className="member-frame-ornament frame-top-left"></div>
                  <div className="member-frame-ornament frame-top-right"></div>
                  <div className="member-frame-ornament frame-bottom-left"></div>
                  <div className="member-frame-ornament frame-bottom-right"></div>

                  <div className="member-character-stage">
                    <div className="member-glow" id="memberGlow"></div>

                    <div className="member-character-card">
                      <div className="member-card-moon"></div>
                      <div className="member-card-stars"></div>
                      <div className="member-card-city"></div>

                      <div className="member-sigil" id="memberSigil">
                        <span></span>
                      </div>

                      <img
                        id="memberImage"
                        className="member-image hidden"
                        src=""
                        alt="Imagem do membro"
                      />

                      <div className="member-silhouette" id="memberSilhouette"></div>
                      <div className="member-cloak" id="memberCloak"></div>
                      <div className="member-accent" id="memberAccent"></div>
                      <div className="member-weapon" id="memberWeapon"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="carousel-shell">
                <button className="carousel-nav" id="prevMembers">{"<"}</button>

                <div className="carousel-viewport">
                  <div className="carousel-track" id="membersTrack"></div>
                </div>

                <button className="carousel-nav" id="nextMembers">{">"}</button>
              </div>
            </div>
          </div>
        </section>

        <section className="lore-hero">
          <div className="lore-bg"></div>
          <div className="lore-overlay"></div>
          <div className="lore-particles"></div>

          <div className="lore-content">
            <span className="lore-badge">Arquivos da Fraternidade</span>

            <h2 className="lore-title">Lore</h2>
            <h3 className="lore-subtitle">ICONICS - Conventus Nycis</h3>

            <div className="lore-divider"></div>

            <p className="lore-text">
              Na Universidade de Orleans, onde luzes de festas iluminam o campus e milhares de cameras
              registram cada momento, existe uma fraternidade que domina tanto os holofotes quanto as sombras.
            </p>

            <a href="/lore" className="lore-btn">Explorar Arquivos</a>
          </div>
        </section>

        <section className="iconics-calendar-section" id="calendario">
          <div className="calendar-bg-particles"></div>

          <div className="calendar-shell">
            <div className="calendar-frame">
              <div className="calendar-top-ornament"></div>

              <header className="calendar-header">
                <p className="calendar-kicker">Arquivos da Fraternidade</p>
                <h2>Calendario</h2>
                <p className="calendar-subtitle">Eventos e movimentacoes da ICONICS</p>
              </header>

              <div className="calendar-custom-image emblem-real-image">
                <img src="/images/emblema.png" alt="Emblema Iconics" />
              </div>

              <div className="calendar-month-bar">
                <button className="calendar-nav-btn" id="prevMonth" aria-label="Mes anterior">{"<"}</button>
                <h3 id="calendarMonthLabel">Abril 2025</h3>
                <button className="calendar-nav-btn" id="nextMonth" aria-label="Proximo mes">{">"}</button>
              </div>

              <div className="calendar-grid-wrapper">
                <div className="calendar-weekdays">
                  <span>DOM</span>
                  <span>SEG</span>
                  <span>TER</span>
                  <span>QUA</span>
                  <span>QUI</span>
                  <span>SEX</span>
                  <span>SAB</span>
                </div>

                <div className="calendar-grid" id="calendarGrid"></div>
              </div>

              <div className="calendar-legend">
                <div className="legend-item">
                  <span className="legend-dot event-dot"></span>
                  <span>Evento marcado</span>
                </div>

                <div className="legend-item">
                  <span className="legend-dot today-dot"></span>
                  <span>Data atual</span>
                </div>

                <div className="legend-item">
                  <span className="legend-dot selected-dot"></span>
                  <span>Dia selecionado</span>
                </div>
              </div>

              <div className="events-section">
                <div className="events-title-row">
                  <span className="events-line"></span>
                  <h3>Eventos</h3>
                  <span className="events-line"></span>
                </div>

                <div className="events-list" id="eventsList"></div>
              </div>

              <div className="calendar-footer-action">
                <a href="/calendario" className="calendar-main-btn">Ver calendario completo</a>
              </div>
            </div>
          </div>
        </section>

        <section className="formulario" id="formulario">
          <div className="form-box">
            <h2>Quer entrar para a ICONICS?</h2>
            <p>Abra o formulario e envie sua candidatura.</p>
            <div className="botao"><Link href="/recrutamento" className="portal-btn">
              Abrir formulario</Link></div>
          </div>
        </section>
        <section className="login-preview" id="login-preview">
  <div className="login-preview-glow"></div>

  <div className="login-preview-card">
    <span className="login-preview-badge">Area Interna</span>

    <h2>Ja faz parte da ICONICS?</h2>

    <p>
      Entre na area interna para acessar seu painel, acompanhar eventos,
      visualizar sua hierarquia e gerenciar conteudos da fraternidade.
    </p>

    <div className="login-preview-actions">
      <a href="/login" className="login-preview-btn primary">
        Entrar no sistema
      </a>

      <a href="/painel" className="login-preview-btn secondary">
        Ir para o painel
      </a>
    </div>
  </div>
</section>

        <section className="formulario" id="parcerias-preview" style={{ textAlign: "center", padding: "80px 24px" }}>
          <div className="form-box">
            <h2>Nossos Parceiros</h2>
            <p>Conheca as empresas e comunidades que caminham ao lado da Iconics.</p>
            <div className="botao"><Link href="/parcerias" className="portal-btn">
              Ver parcerias
            </Link></div>
          </div>
        </section>

        <footer className="footer">
          <div className="footer-mist"></div>

          <div className="footer-content">
            <h2>ICONICS</h2>

            <div className="footer-links">
              <a href="https://www.instagram.com/frat.iconics/">Instagram</a>
              <a href="https://discord.gg/6E99APZefD">Discord</a>
              <a href="#">TikTok</a>
              <a href="#">Contato</a>
            </div>

            <p>(c) ICONICS - estetica, presenca e influencia.</p>
          </div>
        </footer>
      </main>

      <div className="modal" id="loreModal"></div>

      

      <div className="toast" id="toast"></div>

      <Script src="/script.js" strategy="afterInteractive" />
      <Script src="/calendar.js" strategy="afterInteractive" />
      
    </>
  );
}
