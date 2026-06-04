"use client";

import Link from "next/link";
import TopBar from "@/components/Topbar";
import "./lore.css";

export default function LorePage() {
  return (
    <>
      <TopBar />

      <div className="page-bg" />
      <div className="noise" />

      <main className="lore-shell lore-empty-shell" aria-label="Pagina sem conteudo">
        <Link href="/" className="hero-btn" aria-label="Voltar para a pagina inicial">
          Voltar
        </Link>
      </main>
    </>
  );
}
