"use client";

import { useState } from "react";
import { useEffect } from "react";
import TopBar from "@/components/Topbar";
import CityMap from "@/components/mansao/CityMap";
import Mansion3DViewer from "@/components/mansao/Mansion3DViewer";
import "./mansao.css";

export default function MansaoPage() {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerMode, setViewerMode] = useState<"3d" | "foto">("3d");

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return (
    <>
      <TopBar />
      <main className="maps-app">
        <aside className="maps-sidebar">
          <p className="maps-kicker">Fraternidade FiveM</p>
          <h1>Mansão Iconics</h1>
          <p>
            Explore o mapa da cidade com estilo de navegação livre. Clique no marcador da mansão para abrir
            detalhes e visualizar a propriedade no modo 3D.
          </p>

          <div className="maps-card">
            <h3>Como usar</h3>
            <ul>
              <li>Arraste para mover o mapa</li>
              <li>Use scroll para zoom</li>
              <li>Clique na casa para abrir ações</li>
            </ul>
          </div>

          <button
            type="button"
            className="maps-open-3d"
            onClick={() => {
              setViewerMode("3d");
              setViewerOpen(true);
            }}
          >
            Abrir visualização 3D
          </button>
        </aside>

        <section className="maps-main">
          <CityMap
            onView3D={() => {
              setViewerMode("3d");
              setViewerOpen(true);
            }}
          />
        </section>
      </main>

      {viewerOpen && (
        <div className="maps-modal-backdrop" onClick={() => setViewerOpen(false)}>
          <div className="maps-modal" onClick={(event) => event.stopPropagation()}>
            <div className="maps-modal-top">
              <div>
                <p className="maps-kicker">Visão Orbital</p>
                <h2>{viewerMode === "3d" ? "Mansão em 3D" : "Foto da Mansão"}</h2>
              </div>
              <div className="maps-modal-actions">
                <button
                  type="button"
                  className={`maps-tab ${viewerMode === "3d" ? "active" : ""}`}
                  onClick={() => setViewerMode("3d")}
                >
                  3D
                </button>
                <button
                  type="button"
                  className={`maps-tab ${viewerMode === "foto" ? "active" : ""}`}
                  onClick={() => setViewerMode("foto")}
                >
                  Foto
                </button>
              </div>
              <button type="button" className="maps-close" onClick={() => setViewerOpen(false)}>
                Fechar
              </button>
            </div>
            {viewerMode === "3d" ? (
              <Mansion3DViewer minimal />
            ) : (
              <div className="maps-photo-view">
                <img src="/images/mansao.png" alt="Foto de referência da mansão" />
                <p className="map-hint">
                  Para usar a foto exata que você me enviou, substitua o arquivo em <code>/public/images/mansao.png</code>.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
