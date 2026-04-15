"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type ViewState = {
  zoom: number;
  x: number;
  y: number;
};

type Point = {
  x: number;
  y: number;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

const DEFAULT_MANSION: Point = {
  x: 0.685,
  y: 0.442,
};

const MAP_IMAGE_CANDIDATES = ["/images/mapa-cidade-fivem.png", "/images/asdsa.png"];
const ALLOWED_MARK_ROLES = new Set(["admin", "lider", "vice_lider"]);

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function CityMap() {
  const [view, setView] = useState<ViewState>({ zoom: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [markMode, setMarkMode] = useState(false);
  const [mansionPos, setMansionPos] = useState<Point>(DEFAULT_MANSION);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(true);
  const [canMark, setCanMark] = useState(false);

  const currentImage = MAP_IMAGE_CANDIDATES[imageIndex];
  const stageRef = useRef<HTMLDivElement | null>(null);
  const movedRef = useRef(false);

  const clampView = (next: ViewState): ViewState => {
    const stage = stageRef.current;
    if (!stage) return next;

    const stageWidth = stage.clientWidth;
    const stageHeight = stage.clientHeight;
    const maxX = (stageWidth * (next.zoom - 1)) / 2;
    const maxY = (stageHeight * (next.zoom - 1)) / 2;

    return {
      zoom: next.zoom,
      x: clamp(next.x, -maxX, maxX),
      y: clamp(next.y, -maxY, maxY),
    };
  };

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    const direction = event.deltaY > 0 ? -0.13 : 0.13;
    setView((current) => {
      const zoom = clamp(current.zoom + direction, MIN_ZOOM, MAX_ZOOM);
      return clampView({ ...current, zoom });
    });
  };

  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (event) => {
    movedRef.current = false;
    setDragging(true);
    setLastPos({ x: event.clientX, y: event.clientY });
  };

  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (event) => {
    if (!dragging || !lastPos) return;

    const dx = event.clientX - lastPos.x;
    const dy = event.clientY - lastPos.y;

    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      movedRef.current = true;
    }

    setLastPos({ x: event.clientX, y: event.clientY });
    setView((current) => clampView({ ...current, x: current.x + dx, y: current.y + dy }));
  };

  const onPointerUp: React.PointerEventHandler<HTMLDivElement> = () => {
    setDragging(false);
    setLastPos(null);
  };

  const onMapClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    if (!markMode || !canMark) return;

    if (movedRef.current) {
      movedRef.current = false;
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);

    setMansionPos({ x, y });
    setSaveState("idle");
  };

  const copyCoords = async () => {
    const text = `x: ${mansionPos.x.toFixed(4)}, y: ${mansionPos.y.toFixed(4)}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore clipboard failures
    }
  };

  const saveLocation = async () => {
    setSaveState("saving");

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      setSaveState("error");
      return;
    }

    const response = await fetch("/api/mansion-location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(mansionPos),
    });

    setSaveState(response.ok ? "saved" : "error");
  };

  useEffect(() => {
    const onResize = () => setView((current) => clampView(current));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        const response = await fetch("/api/mansion-location", { cache: "no-store" });
        if (!response.ok) return;
        const point = (await response.json()) as Point;
        if (typeof point.x === "number" && typeof point.y === "number") {
          setMansionPos({ x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) });
        }
      } catch {
        // keep defaults
      }
    };

    loadLocation();
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("cargo")
        .eq("id", userId)
        .maybeSingle();

      const cargo = String(profile?.cargo || "").trim().toLowerCase();
      setCanMark(ALLOWED_MARK_ROLES.has(cargo));
    };

    checkAdmin();
  }, []);

  return (
    <section className="mansao-panel">
      <div className="mansao-panel-top">
        <div>
          <p className="mansao-kicker">Mapa da Cidade</p>
          <h2>Localizacao da Mansao</h2>
        </div>

        <div className="map-actions">
          <button type="button" onClick={() => setView((v) => clampView({ ...v, zoom: clamp(v.zoom + 0.2, MIN_ZOOM, MAX_ZOOM) }))}>+</button>
          <button type="button" onClick={() => setView((v) => clampView({ ...v, zoom: clamp(v.zoom - 0.2, MIN_ZOOM, MAX_ZOOM) }))}>-</button>
          {canMark && (
            <button type="button" onClick={() => setMarkMode((v) => !v)} className={markMode ? "map-action-active" : ""}>Marcar</button>
          )}
          {canMark && (
            <button type="button" onClick={copyCoords}>Copiar</button>
          )}
          {canMark && (
            <button type="button" onClick={saveLocation} disabled={saveState === "saving"}>
              {saveState === "saving" ? "Salvando..." : "Salvar"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setView({ zoom: 1, x: 0, y: 0 });
              if (canMark) {
                setMansionPos(DEFAULT_MANSION);
                setSaveState("idle");
              }
            }}
          >
            Reset
          </button>
        </div>
      </div>

      <div
        ref={stageRef}
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
          <div className="map-image-shell" onClick={onMapClick}>
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
                left: `${mansionPos.x * 100}%`,
                top: `${mansionPos.y * 100}%`,
              }}
            >
              <div className="mansion-pin-pulse" />
              <div className="mansion-pin-core" />
            </div>

            <div
              className="mansion-label"
              style={{
                left: `${mansionPos.x * 100}%`,
                top: `${mansionPos.y * 100}%`,
              }}
            >
              <strong>Mansao Iconics</strong>
              <span>Vinewood Hills</span>
            </div>
          </div>
        </div>
      </div>

      <p className="map-hint">
        Arraste para navegar e use o scroll para zoom.
        {canMark ? " Clique em Marcar e depois no mapa para posicionar." : ""}
      </p>
      {canMark && <p className="map-hint">Coordenadas atuais: x {mansionPos.x.toFixed(4)} | y {mansionPos.y.toFixed(4)}</p>}
      {canMark && saveState === "saved" && <p className="map-hint">Localizacao salva no banco com sucesso.</p>}
      {canMark && saveState === "error" && <p className="map-hint">Erro ao salvar localizacao. Verifique permissao admin e tabela no Supabase.</p>}
    </section>
  );
}
