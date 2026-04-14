"use client";

import { useEffect, useCallback } from "react";

type ToastTipo = "sucesso" | "erro" | "info";

type ToastProps = {
  mensagem: string;
  tipo?: ToastTipo;
  duracao?: number;
  onClose: () => void;
};

const palavrasSucesso = ["sucesso", "atualizado", "atualizada", "criado", "criada", "excluído", "excluída", "salvo", "salva", "enviado", "enviada"];

function detectarTipo(mensagem: string): ToastTipo {
  const lower = mensagem.toLowerCase();
  if (palavrasSucesso.some((p) => lower.includes(p))) return "sucesso";
  if (lower.includes("erro") || lower.includes("inválid") || lower.includes("negado") || lower.includes("falha")) return "erro";
  return "info";
}

const cores: Record<ToastTipo, { bg: string; border: string; color: string }> = {
  sucesso: {
    bg: "rgba(34,197,94,0.14)",
    border: "1px solid rgba(34,197,94,0.35)",
    color: "#86efac",
  },
  erro: {
    bg: "rgba(239,68,68,0.14)",
    border: "1px solid rgba(239,68,68,0.35)",
    color: "#fca5a5",
  },
  info: {
    bg: "rgba(168,85,247,0.14)",
    border: "1px solid rgba(168,85,247,0.35)",
    color: "#d8b4fe",
  },
};

export default function Toast({
  mensagem,
  tipo,
  duracao = 4000,
  onClose,
}: ToastProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(handleClose, duracao);
    return () => clearTimeout(timer);
  }, [duracao, handleClose, mensagem]);

  if (!mensagem) return null;

  const tipoFinal = tipo || detectarTipo(mensagem);
  const cor = cores[tipoFinal];

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 14,
        background: cor.bg,
        border: cor.border,
        padding: "14px 42px 14px 16px",
        color: cor.color,
        fontSize: "0.95rem",
        lineHeight: 1.6,
        overflow: "hidden",
        marginTop: 12,
      }}
    >
      {mensagem}

      <button
        type="button"
        onClick={handleClose}
        style={{
          position: "absolute",
          top: 10,
          right: 12,
          background: "transparent",
          border: "none",
          color: cor.color,
          fontSize: "1.1rem",
          cursor: "pointer",
          padding: 0,
          lineHeight: 1,
        }}
        aria-label="Fechar"
      >
        ×
      </button>

      <div
        key={mensagem}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
          background: cor.color,
          animation: `toast-shrink ${duracao}ms linear forwards`,
        }}
      />
    </div>
  );
}
