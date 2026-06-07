import Link from "next/link";
import { notFound } from "next/navigation";
import TopBar from "@/components/Topbar";
import PartnersBar from "@/components/PartnersBar";
import { NewsContentBlock, NewsItem, getNewsBySlug, getPublishedNews } from "@/lib/newsData";
import { loadNewsItems } from "@/lib/newsStore";

export const dynamic = "force-dynamic";

export default async function NoticiaDetalhePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const allNews = getPublishedNews(await loadNewsItems());
  const news = getNewsBySlug(allNews, slug);

  if (!news) notFound();

  const currentIndex = allNews.findIndex((item) => item.slug === news.slug);
  const previousNews = currentIndex > 0 ? allNews[currentIndex - 1] : allNews[allNews.length - 1];
  const nextNews = currentIndex < allNews.length - 1 ? allNews[currentIndex + 1] : allNews[0];
  const readingMinutes = Math.max(3, Math.ceil(getArticleText(news).split(/\s+/).filter(Boolean).length / 180));

  return (
    <>
      <TopBar />
      <PartnersBar />

      <main className="news-article-page">
        <header className="news-article-banner">
          <img src="/images/iconics_emblem_main.png" alt="" />
          <div>
            <span>ICONICS NEWS</span>
            <strong>Onde os icones se tornam historia.</strong>
          </div>
        </header>

        <article className="news-article">
          <Link href="/noticias" className="news-back-link">Voltar para noticias</Link>

          <p className="news-kicker">{news.category}</p>
          <h1>{news.title}</h1>
          <p className="news-subtitle">{news.subtitle}</p>

          <section className="news-meta-bar">
            <div className="news-author-mark" aria-hidden="true">I</div>
            <div>
              <span>Por <strong>{news.author}</strong> - {news.location}</span>
              <span>{news.time}</span>
              <span>{readingMinutes} min de leitura</span>
            </div>
            <div className="news-share">
              <span>Compartilhar</span>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=/noticias/${news.slug}`} aria-label="Compartilhar no Facebook">f</a>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(news.title)}`} aria-label="Compartilhar no X">x</a>
              <a href={`/noticias/${news.slug}`} aria-label="Copiar link">link</a>
            </div>
          </section>

          <figure className="news-hero-figure">
            <img src={news.image} alt={news.imageAlt} />
            {news.caption ? <figcaption>{news.caption}</figcaption> : null}
          </figure>

          {news.summary.length > 0 ? (
            <section className="news-summary-card">
              <strong>Resumo da materia</strong>
              <ul>
                {news.summary.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </section>
          ) : null}

          <div className="news-content-flow">
            {(news.contentBlocks || []).map((block, index) => renderBlock(block, news, index))}
          </div>

          <section className="news-final-note">
            A cobertura segue em atualizacao conforme novos registros chegam ao arquivo da fraternidade.
          </section>

          <footer className="news-article-footer">
            <section className="news-reactions">
              <strong>O que achou desta noticia?</strong>
              <span>Chama 24</span>
              <span>Coroa 17</span>
              <span>Registro 31</span>
              <span>Iconico 89</span>
            </section>
            <section className="news-footer-share">
              <strong>Compartilhar</strong>
              <span>Discord</span>
              <span>Instagram</span>
              <span>Copiar link</span>
            </section>
          </footer>

          <nav className="news-neighbor-nav" aria-label="Noticias relacionadas">
            {previousNews && previousNews.slug !== news.slug ? (
              <Link href={`/noticias/${previousNews.slug}`}>
                <span>Noticia anterior</span>
                <strong>Anterior - {previousNews.title}</strong>
              </Link>
            ) : <span />}
            <img src="/images/iconics_emblem_main.png" alt="" />
            {nextNews && nextNews.slug !== news.slug ? (
              <Link href={`/noticias/${nextNews.slug}`}>
                <span>Proxima noticia</span>
                <strong>{nextNews.title} - Proxima</strong>
              </Link>
            ) : <span />}
          </nav>
        </article>
      </main>

      <style>{articleCss}</style>
    </>
  );
}

function renderBlock(block: NewsContentBlock, news: NewsItem, index: number) {
  if (block.type === "heading") {
    return <h2 key={block.id} className="news-section-heading">{block.title}</h2>;
  }

  if (block.type === "titled_text") {
    return (
      <section key={block.id} className="news-two-column-text">
        <h2>{block.title}</h2>
        <p>{block.body}</p>
      </section>
    );
  }

  if (block.type === "callout") {
    return (
      <blockquote key={block.id} className="news-callout">
        <span>*</span>
        <p>{block.body}</p>
      </blockquote>
    );
  }

  if (block.type === "media") {
    return (
      <section key={block.id} className={`news-media-block ${block.align === "right" ? "image-right" : "image-left"}`}>
        <div className="news-media-copy">
          {block.title ? <h2>{block.title}</h2> : null}
          {block.body ? block.body.split("\n").filter(Boolean).map((line) => <p key={line}>{line}</p>) : null}
        </div>
        <figure>
          <img src={block.image || news.image} alt={block.imageAlt || news.title} />
          {block.caption ? <figcaption>{block.caption}</figcaption> : null}
        </figure>
      </section>
    );
  }

  if (block.type === "image") {
    return (
      <figure key={block.id} className={`news-inline-image ${index % 2 === 0 ? "wide" : ""}`}>
        <img src={block.image || news.image} alt={block.imageAlt || news.title} />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }

  return (
    <div key={block.id} className="news-paragraph-block">
      {block.body?.split("\n").filter(Boolean).map((line) => <p key={line}>{line}</p>)}
    </div>
  );
}

function getArticleText(news: NewsItem) {
  return [
    news.title,
    news.subtitle,
    ...news.summary,
    ...(news.contentBlocks || []).flatMap((block) => [block.title || "", block.body || "", block.caption || ""]),
  ].join(" ");
}

const articleCss = `
.news-article-page {
  min-height: 100vh;
  padding: 116px 22px 54px;
  color: #f8f1ff;
  background:
    radial-gradient(circle at 10% 8%, rgba(126, 34, 206, .28), transparent 30%),
    radial-gradient(circle at 90% 26%, rgba(168, 85, 247, .22), transparent 28%),
    linear-gradient(180deg, #06020d, #0d0118 42%, #040109);
}

.news-article-banner,
.news-article {
  width: min(1180px, 100%);
  margin-inline: auto;
}

.news-article-banner {
  min-height: 148px;
  display: grid;
  grid-template-columns: 210px 1fr;
  align-items: center;
  margin-bottom: 28px;
  border: 1px solid rgba(168, 85, 247, .38);
  background:
    linear-gradient(90deg, rgba(5, 2, 12, .7), rgba(25, 4, 45, .34), rgba(5, 2, 12, .5)),
    url("/images/portal_scene_secondary.png") center/cover;
  box-shadow: 0 0 42px rgba(126, 34, 206, .22);
}

.news-article-banner img {
  width: 116px;
  height: 116px;
  object-fit: contain;
  justify-self: center;
  filter: drop-shadow(0 0 22px rgba(192, 132, 252, .7));
}

.news-article-banner div {
  text-align: center;
  letter-spacing: .26em;
  text-transform: uppercase;
}

.news-article-banner span {
  display: block;
  color: #f8f1ff;
  font-size: 26px;
  font-weight: 950;
}

.news-article-banner strong {
  color: #f5d0fe;
  font-size: 12px;
}

.news-article {
  display: flow-root;
}

.news-back-link {
  display: inline-flex;
  margin: 4px 0 30px;
  color: #d946ef;
  font-weight: 900;
  text-decoration: none;
}

.news-kicker {
  margin: 0 0 10px;
  color: #d946ef;
  font-weight: 950;
  letter-spacing: .12em;
  text-transform: uppercase;
}

.news-article h1 {
  max-width: 860px;
  margin: 0;
  color: #fff;
  font-size: clamp(2.8rem, 7vw, 5.8rem);
  line-height: .95;
  text-shadow: 0 4px 26px rgba(0, 0, 0, .8);
}

.news-subtitle {
  max-width: 880px;
  margin: 20px 0 0;
  color: #e9d5ff;
  font-size: 20px;
  line-height: 1.55;
}

.news-meta-bar {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  margin: 28px 0 32px;
}

.news-author-mark {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgba(216, 180, 254, .38);
  background: radial-gradient(circle, rgba(168, 85, 247, .45), rgba(5, 2, 12, .92));
  color: #f5d0fe;
  font-weight: 950;
}

.news-meta-bar div:nth-child(2) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  color: #cbb8e8;
}

.news-share {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #d8b4fe;
}

.news-share a {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  border: 1px solid rgba(216, 180, 254, .28);
  color: #d946ef;
  text-decoration: none;
  font-weight: 950;
}

.news-hero-figure,
.news-inline-image {
  margin: 0 0 36px;
}

.news-hero-figure img,
.news-inline-image img,
.news-media-block img {
  width: 100%;
  display: block;
  object-fit: cover;
  border: 1px solid rgba(192, 132, 252, .42);
  box-shadow: 0 24px 70px rgba(0, 0, 0, .36);
}

.news-hero-figure img {
  max-height: 520px;
  aspect-ratio: 16 / 7;
}

.news-inline-image {
  width: min(760px, 100%);
}

.news-inline-image.wide {
  width: min(920px, 100%);
}

.news-inline-image img {
  max-height: 440px;
  aspect-ratio: 16 / 8;
}

.news-hero-figure figcaption,
.news-inline-image figcaption,
.news-media-block figcaption {
  margin-top: 8px;
  color: #a78bfa;
  font-size: 14px;
}

.news-summary-card {
  width: min(640px, 100%);
  margin: 0 0 38px;
  padding: 22px 26px;
  border: 1px solid rgba(216, 180, 254, .24);
  background: linear-gradient(135deg, rgba(88, 28, 135, .18), rgba(5, 2, 12, .78));
  color: #f5d0fe;
}

.news-summary-card strong {
  color: #fff;
  text-transform: uppercase;
  letter-spacing: .1em;
}

.news-summary-card li {
  margin-top: 8px;
  line-height: 1.45;
}

.news-content-flow {
  display: grid;
  gap: 34px;
}

.news-paragraph-block {
  max-width: 620px;
  color: #f3e8ff;
  font-size: 21px;
  line-height: 1.62;
}

.news-paragraph-block p {
  margin: 0 0 18px;
}

.news-section-heading,
.news-media-copy h2,
.news-two-column-text h2 {
  margin: 0;
  color: #d946ef;
  font-size: clamp(1.8rem, 3vw, 2.7rem);
  line-height: 1.05;
  text-transform: uppercase;
}

.news-two-column-text {
  display: grid;
  grid-template-columns: minmax(220px, .62fr) minmax(0, 1fr);
  gap: 34px;
  align-items: start;
}

.news-two-column-text p,
.news-media-copy p {
  margin: 0 0 18px;
  color: #f3e8ff;
  font-size: 19px;
  line-height: 1.68;
}

.news-callout {
  width: min(560px, 100%);
  margin: 0;
  padding: 28px 34px;
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 16px;
  border: 1px solid rgba(192, 132, 252, .42);
  background:
    linear-gradient(135deg, rgba(88, 28, 135, .3), rgba(5, 2, 12, .82)),
    radial-gradient(circle at top right, rgba(217, 70, 239, .26), transparent 36%);
  color: #e879f9;
  box-shadow: inset 0 0 34px rgba(126, 34, 206, .18);
}

.news-callout span {
  color: #f0abfc;
  font-size: 28px;
}

.news-callout p {
  margin: 0;
  font-size: 26px;
  line-height: 1.38;
}

.news-media-block {
  display: grid;
  grid-template-columns: minmax(240px, .62fr) minmax(0, 1fr);
  gap: 34px;
  align-items: start;
}

.news-media-block.image-right {
  grid-template-columns: minmax(0, .62fr) minmax(240px, 1fr);
}

.news-media-block.image-left figure {
  order: -1;
}

.news-media-block figure {
  margin: 0;
}

.news-media-block img {
  aspect-ratio: 16 / 9;
}

.news-final-note {
  margin-top: 42px;
  padding-top: 26px;
  border-top: 1px solid rgba(216, 180, 254, .22);
  color: #bba7d8;
  font-size: 18px;
}

.news-article-footer {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(0, 1fr);
  gap: 28px;
  margin-top: 32px;
}

.news-reactions,
.news-footer-share {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 28px;
  align-items: center;
  padding: 20px;
  border: 1px solid rgba(216, 180, 254, .24);
  background: rgba(255, 255, 255, .035);
}

.news-reactions strong,
.news-footer-share strong {
  width: 100%;
  color: #c4b5fd;
  text-transform: uppercase;
  letter-spacing: .12em;
}

.news-neighbor-nav {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 110px minmax(0, 1fr);
  gap: 28px;
  align-items: center;
  margin-top: 28px;
}

.news-neighbor-nav a {
  min-height: 100px;
  padding: 18px 22px;
  display: grid;
  align-content: center;
  border: 1px solid rgba(216, 180, 254, .22);
  background: rgba(255, 255, 255, .035);
  color: #f5d0fe;
  text-decoration: none;
}

.news-neighbor-nav span {
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: .08em;
  font-size: 12px;
}

.news-neighbor-nav img {
  width: 90px;
  height: 90px;
  object-fit: contain;
  justify-self: center;
  filter: drop-shadow(0 0 24px rgba(168, 85, 247, .8));
}

@media (max-width: 860px) {
  .news-article-page {
    padding-inline: 14px;
  }

  .news-article-banner,
  .news-meta-bar,
  .news-two-column-text,
  .news-media-block,
  .news-media-block.image-right,
  .news-article-footer,
  .news-neighbor-nav {
    grid-template-columns: 1fr;
  }

  .news-article-banner {
    padding: 22px;
  }

  .news-share {
    justify-content: flex-start;
  }

  .news-hero-figure img,
  .news-inline-image img,
  .news-media-block img {
    aspect-ratio: 16 / 10;
  }
}
`;
