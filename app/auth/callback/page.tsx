"use client";

import Spinner from "@/components/Spinner";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Finalizando login com Discord...");

  useEffect(() => {
    let mounted = true;

    async function finalizeLogin() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session) {
          if (mounted) {
            setMessage("Sessão inválida. Redirecionando para login...");
          }
          window.location.href = "/login";
          return;
        }

        await fetch("/api/profiles/ensure", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });

        window.location.href = "/painel";
      } catch {
        if (mounted) {
          setMessage("Não foi possível concluir o login. Redirecionando...");
        }
        window.location.href = "/login";
      }
    }

    finalizeLogin();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "radial-gradient(circle at 50% 20%, rgba(124,58,237,.18), transparent 35%), #090312",
        color: "#f5e9ff",
      }}
    >
      <div
        style={{
          width: "min(560px, 92vw)",
          border: "1px solid rgba(216,180,254,.18)",
          borderRadius: 18,
          padding: "28px 22px",
          background: "rgba(13,6,24,.88)",
          boxShadow: "0 18px 42px rgba(0,0,0,.35)",
          textAlign: "center",
        }}
      >
        <Spinner texto={message} />
      </div>
    </main>
  );
}
