"use client";

import { useState } from "react";

type ViewState = {
  zoom: number;
  x: number;
  y: number;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

const MANSION = {
  x: 0.685,
  y: 0.442,
  label: "Mansao Iconics",
  district: "Vinewood Hills",
};

const MAP_IMAGE_CANDIDATES = ["/images/mapa-cidade-fivem.png", "/images/asdsa.png"];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function CityMap() {
  const [view, setView] = useState<ViewState>({ zoom: 2.35, x: 18, y: -40 });
  const [dragging, setDragging] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(true);
  const currentImage = MAP_IMAGE_CANDIDATES[imageIndex];

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
          <h2>Localizacao da Mansao</h2>
        </div>

        <div className="map-actions">
          <button type="button" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom + 0.2, MIN_ZOOM, MAX_ZOOM) }))}>+</button>
          <button type="button" onClick={() => setView((v) => ({ ...v, zoom: clamp(v.zoom - 0.2, MIN_ZOOM, MAX_ZOOM) }))}>-</button>
          <button type="button" onClick={() => setView({ zoom: 2.35, x: 18, y: -40 })}>Reset</button>
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
          <div className="map-image-shell">
            <img
              className="map-image"
              src={currentImage}
              alt="Mapa da cidade do servidor FiveM"
              onError={() => {
                const nextIndex = imageIndex + 1;
                if (nextIndex < MAP_IMAGE_CANDIDATES.length) {
                  setImageIndex(nextIndex);
                  setImageLoaded(true);
                } else {
                  setImageLoaded(false);
                }
              }}
              style={{ display: imageLoaded ? "block" : "none" }}
            />
            {!imageLoaded && (
              <div className="map-missing-image">
                Mapa real nao encontrado. Coloque um arquivo em <code>/public/images/mapa-cidade-fivem.png</code>
              </div>
            )}

            <div
              className="mansion-pin"
              style={{
                left: `${MANSION.x * 100}%`,
                top: `${MANSION.y * 100}%`,
              }}
            >
              <div className="mansion-pin-pulse" />
              <div className="mansion-pin-core" />
            </div>

            <div
              className="mansion-label"
              style={{
                left: `${MANSION.x * 100}%`,
                top: `${MANSION.y * 100}%`,
              }}
            >
              <strong>{MANSION.label}</strong>
              <span>{MANSION.district}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="map-hint">Arraste para navegar no mapa e use o scroll para zoom. Agora o zoom vai bem alem do tamanho original da imagem.</p>
    </section>
  );
}
