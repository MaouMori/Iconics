"use client";

type SpinnerProps = {
  texto?: string;
};

export default function Spinner({ texto = "Carregando..." }: SpinnerProps) {
  return (
    <div style={wrapStyle}>
      <div style={spinnerStyle} />
      {texto && <p style={textStyle}>{texto}</p>}
    </div>
  );
}

const wrapStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 16,
  padding: "60px 20px",
};

const spinnerStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "3px solid rgba(168,85,247,0.18)",
  borderTopColor: "#a855f7",
  animation: "iconics-spin 0.7s linear infinite",
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: "#d8b4fe",
  fontSize: "0.95rem",
  letterSpacing: "0.04em",
};
