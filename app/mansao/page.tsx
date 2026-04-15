"use client";

import { useState } from "react";
import { useEffect } from "react";
import TopBar from "@/components/Topbar";
import CityMap from "@/components/mansao/CityMap";
import Mansion3DViewer from "@/components/mansao/Mansion3DViewer";
import "./mansao.css";

export default function MansaoPage() {
  const [viewerOpen, setViewerOpen] = useState(false);

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
          <h1>Mansao Iconics</h1>
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

          <button type="button" className="maps-open-3d" onClick={() => setViewerOpen(true)}>
            Abrir visualizacao 3D
          </button>
        </aside>

        <section className="maps-main">
          <CityMap onView3D={() => setViewerOpen(true)} />
        </section>
      </main>

      {viewerOpen && (
        <div className="maps-modal-backdrop" onClick={() => setViewerOpen(false)}>
          <div className="maps-modal" onClick={(event) => event.stopPropagation()}>
            <div className="maps-modal-top">
              <div>
                <p className="maps-kicker">Visao Orbital</p>
                <h2>Mansao em 3D</h2>
              </div>
              <button type="button" className="maps-close" onClick={() => setViewerOpen(false)}>
                Fechar
              </button>
            </div>
            <Mansion3DViewer minimal />
          </div>
        </div>
      )}
    </>
  );
}
