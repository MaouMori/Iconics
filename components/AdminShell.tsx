"use client";

import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { ReactNode } from "react";

type AdminKey =
  | "dashboard"
  | "eventos"
  | "membros"
  | "usuarios"
  | "parcerias"
  | "vinculos"
  | "candidaturas"
  | "formulario";

type AdminShellProps = {
  active: AdminKey;
  title: string;
  kicker?: string;
  description?: string;
  userName?: string;
  children: ReactNode;
};

const NAV_ITEMS: Array<{ key: AdminKey; label: string; href: string }> = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "eventos", label: "Eventos", href: "/admin/eventos" },
  { key: "membros", label: "Membros", href: "/admin/membros" },
  { key: "usuarios", label: "Usuarios", href: "/admin/usuarios" },
  { key: "parcerias", label: "Parcerias", href: "/admin/parcerias" },
  { key: "vinculos", label: "Vinculos", href: "/admin/vinculos" },
];

export default function AdminShell({
  active,
  title,
  kicker = "Administracao da Fraternidade",
  description,
  userName,
  children,
}: AdminShellProps) {
  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <main className="admin-dashboard-page">
      <div className="admin-bg-stars" />
      <div className="admin-bg-glow" />

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">IO</div>
          <div className="admin-brand-name">ICONICS</div>
        </div>

        <nav className="admin-nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`admin-nav-item ${item.key === active ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-user-chip">
          <span>{(userName || "I").charAt(0).toUpperCase()}</span>
          <p>{userName || "Iconics"}</p>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-top-actions">
          <Link href="/" className="admin-top-btn">
            Voltar ao site
          </Link>
          <Link href="/painel" className="admin-top-btn">
            Painel
          </Link>
          <button onClick={handleLogout} className="admin-top-btn danger">
            Sair
          </button>
        </header>

        <section className="admin-hero">
          <p className="admin-kicker">{kicker}</p>
          <h1>{title}</h1>
          {description ? <p className="admin-meta admin-meta-text">{description}</p> : null}
        </section>

        <section className="admin-content-shell">{children}</section>
      </section>
    </main>
  );
}
