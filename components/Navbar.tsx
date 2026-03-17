"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Navbar() {
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);

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

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="header">
      <nav className="navbar">
        <a href="/" className="nav-link active">Home</a>

        <div className="logo-wrap" aria-label="Logo ICONICS">
          <div className="logo-core"></div>
          <div className="logo-star">
            <span></span>
          </div>
        </div>

        <a href="#formulario" className="nav-link">Formulario</a>
        <Link href="/lore" className="nav-link">Lore</Link>

        {!loading && !isLogged && (
          <Link href="/login" className="nav-link nav-login">
            Login
          </Link>
        )}

        {!loading && isLogged && (
          <>
            <Link href="/painel" className="nav-link nav-login">
              Painel
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
      </nav>
    </header>
  );
}