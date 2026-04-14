import TopBar from "@/components/Topbar";
import CityMap from "@/components/mansao/CityMap";
import Mansion3DViewer from "@/components/mansao/Mansion3DViewer";
import "./mansao.css";

export default function MansaoPage() {
  return (
    <>
      <TopBar />
      <main className="mansao-page">
        <section className="mansao-hero">
          <div className="mansao-hero-glow" />
          <p className="mansao-tag">Fraternidade FiveM</p>
          <h1>Mansão Iconics</h1>
          <p>
            Localização estratégica em Orleans Hills com vista completa da cidade. Nesta página você visualiza
            o ponto exato no mapa e explora uma cena 3D navegável da mansão.
          </p>
        </section>

        <section className="mansao-grid">
          <CityMap />
          <Mansion3DViewer />
        </section>
      </main>
    </>
  );
}
