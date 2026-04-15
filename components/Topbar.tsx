"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TopBarProps = {
  showPainel?: boolean;
  showLogout?: boolean;
};

export default function TopBar({
  showPainel = true,
  showLogout = true,
}: TopBarProps) {
  const [isLogged, setIsLogged] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 680 : false
  );

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      setIsLogged(!!data.session);
      setLoading(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLogged(!!session);
      setLoading(false);
    });

    const onResize = () => setIsMobile(window.innerWidth <= 680);
    window.addEventListener("resize", onResize);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div
      style={{
        position: "fixed",
        top: isMobile ? 10 : 18,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 100,
        width: "min(96vw, 760px)",
      }}
    >
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 8,
          padding: isMobile ? "8px 10px" : "10px 14px",
          borderRadius: isMobile ? 18 : 999,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(10,8,18,.72)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 40px rgba(91,33,182,.18)",
          width: "100%",
        }}
      >
        <Link href="/" style={linkStyle}>
          Voltar ao site
        </Link>

        {!loading && isLogged && showPainel && (
          <Link href="/painel" style={linkStyle}>
            Painel
          </Link>
        )}

        {!loading && isLogged && showLogout && (
          <button onClick={handleLogout} style={buttonStyle}>
            Sair
          </button>
        )}

        {!loading && !isLogged && (
          <Link href="/login" style={linkStyle}>
            Login
          </Link>
        )}
      </nav>
    </div>
  );
}

const linkStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 999,
  color: "white",
  textDecoration: "none",
  background: "rgba(255,255,255,.05)",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 999,
  color: "white",
  background: "rgba(220,38,38,.18)",
  border: "1px solid rgba(255,255,255,.06)",
  cursor: "pointer",
};
