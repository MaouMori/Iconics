"use client";

import { useMemo, useState } from "react";

type ViewState = {
  zoom: number;
  x: number;
  y: number;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3.2;

const MANSION = {
  x: 774,
  y: 356,
  label: "Mansão Iconics",
  district: "Orleans Hills",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function CityMap() {
  const [view, setView] = useState<ViewState>({ zoom: 1.25, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const svg = useMemo(
    () => (
      <svg viewBox="0 0 1200 800" role="img" aria-label="Mapa da cidade de Orleans com marcador da Mansão Iconics">
        <defs>
          <linearGradient id="water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0e172f" />
            <stop offset="100%" stopColor="#152650" />
          </linearGradient>
          <linearGradient id="land" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1f2b1d" />
            <stop offset="100%" stopColor="#233a2a" />
          </linearGradient>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          </pattern>
        </defs>

        <rect width="1200" height="800" fill="url(#water)" />
        <path d="M35,88 C260,40 500,90 730,60 C975,26 1110,110 1170,250 C1140,430 1080,520 1175,760 L32,760 C120,540 85,350 35,88 Z" fill="url(#land)" />

        <rect x="0" y="0" width="1200" height="800" fill="url(#grid)" />

        <g stroke="rgba(235,228,255,0.2)" strokeWidth="16" strokeLinecap="round" fill="none">
          <path d="M120 640 C300 540 520 530 730 490 C850 466 990 405 1120 280" />
          <path d="M180 160 C300 235 470 270 640 240 C850 200 970 250 1100 360" />
          <path d="M310 730 C370 610 430 500 510 420 C610 322 720 300 880 330" />
        </g>

        <g stroke="rgba(255,255,255,0.08)" strokeWidth="8" strokeLinecap="round" fill="none">
          <path d="M225 310 L380 365 L520 350 L680 375 L880 420" />
          <path d="M430 140 L462 250 L490 340 L560 430 L620 620" />
          <path d="M730 150 L760 250 L810 360 L865 460 L960 590" />
        </g>

        <g>
          <circle cx={MANSION.x} cy={MANSION.y} r="44" fill="rgba(224,166,255,0.16)" />
          <circle cx={MANSION.x} cy={MANSION.y} r="22" fill="#f7c8ff" />
          <circle cx={MANSION.x} cy={MANSION.y} r="10" fill="#63156e" />
          <path d={`M ${MANSION.x} ${MANSION.y - 70} L ${MANSION.x - 16} ${MANSION.y - 30} L ${MANSION.x + 16} ${MANSION.y - 30} Z`} fill="#f4d9ff" />
          <text x={MANSION.x + 58} y={MANSION.y - 22} fill="#f9dbff" fontSize="28" fontWeight="700">{MANSION.label}</text>
          <text x={MANSION.x + 58} y={MANSION.y + 12} fill="#ddc5f3" fontSize="20">Distrito: {MANSION.district}</text>
        </g>
      </svg>
    ),
    []
  );

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.13 : 0.13;
    setView((current) => ({ ...current, zoom: clamp(current.zoom + direction, MIN_ZOOM, MAX_ZOOM) }));
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    setDragging(true);
    setLastPos({ x: event.clientX, y: event.clientY });
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!dragging || !lastPos) return;

    const dx = event.clientX - lastPos.x;
    const dy = event.clientY - lastPos.y;
    setLastPos({ x: event.clientX, y: event.clientY });
    setView((current) => ({ ...current, x: current.x + dx, y: current.y + dy }));
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = () => {
    setDragging(false);
    setLastPos(null);
  };

  return (
    <section className="mansao-panel">
      <div className="mansao-panel-top">
        <div>
          <p className="mansao-kicker">Mapa da Cidade</p>
          <h2>Localização da Mansão</h2>
        </div>

        <div className="map-actions">
          <button type="button" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom + 0.2, MIN_ZOOM, MAX_ZOOM) }))}>+</button>
          <button type="button" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom - 0.2, MIN_ZOOM, MAX_ZOOM) }))}>-</button>
          <button type="button" onClick={() => setView({ zoom: 1.25, x: 0, y: 0 })}>Reset</button>
        </div>
      </div>

      <div
        className={`map-stage ${dragging ? "dragging" : ""}`}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="map-canvas"
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
        >
          {svg}
        </div>
      </div>

      <p className="map-hint">Arraste para navegar no mapa e use o scroll para zoom.</p>
    </section>
  );
}
