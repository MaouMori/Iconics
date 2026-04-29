"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getSession();
      setIsLogged(!!data.session);
      setLoading(false);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLogged(!!session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 960) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="header">
      <nav className="navbar">
        <button
          type="button"
          className="nav-toggle"
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          {menuOpen ? "✕" : "☰"}
        </button>

        <div className={`nav-menu ${menuOpen ? "open" : ""}`}>
        <Link href="/" className="nav-link active">Home</Link>

        <div className="logo-wrap" aria-label="Logo ICONICS">
          <div className="logo-core"></div>
          <div className="logo-star">
            <span></span>
          </div>
        </div>

        <a href="#formulario" className="nav-link">Formulário</a>
        <Link href="/lore" className="nav-link">Lore</Link>
        <Link href="/mansao" className="nav-link">Mansão</Link>
        <Link href="/parcerias" className="nav-link">Parcerias</Link>
        <Link href="/rankings" className="nav-link">Rankings</Link>

        {!loading && !isLogged && (
          <Link href="/login" className="nav-link nav-login">
            Login
          </Link>
        )}

        {!loading && isLogged && (
          <>
            <NotificationBell className="nav-link nav-login nav-bell" compact />
            <Link href="/painel" className="nav-link nav-login">
              Painel
            </Link>
            <Link href="/missoes" className="nav-link nav-login">
              Missoes
            </Link>

            <button
              type="button"
              className="nav-link nav-logout"
              onClick={handleLogout}
            >
              Sair
            </button>
          </>
        )}
        </div>
      </nav>
    </header>
  );
}
