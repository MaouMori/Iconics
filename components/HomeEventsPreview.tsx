import { supabase } from "@/lib/supabase";

type EventItem = {
  id: number;
  titulo: string;
  descricao: string | null;
  data_evento: string;
  horario: string | null;
  local: string | null;
  imagem_url: string | null;
};

export default async function HomeEventsPreview() {
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("data_evento", { ascending: true })
    .limit(4);

  const events = (data || []) as EventItem[];

  return (
    <section
      style={{
        width: "min(1240px, 100%)",
        margin: "0 auto",
        padding: "90px 24px 50px",
        position: "relative",
        zIndex: 4,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 26 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: 'Georgia,"Times New Roman",serif',
            fontSize: "clamp(2.3rem,4vw,3.4rem)",
            color: "#fff",
          }}
        >
          Eventos em destaque
        </h2>

        <p style={{ marginTop: 10, color: "#d8cceb" }}>
          Eventos criados pelo painel administrativo aparecem aqui automaticamente.
        </p>
      </div>

      <div
        style={{
          border: "1px solid rgba(230,210,255,.14)",
          background: "rgba(14,10,24,.72)",
          borderRadius: 28,
          boxShadow: "0 24px 80px rgba(77,23,124,.35)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: "100%",
            height: 120,
            background:
              "radial-gradient(circle at center, rgba(168,85,247,.20), transparent 28%), linear-gradient(90deg, transparent, rgba(216,180,254,.18), transparent), linear-gradient(180deg, rgba(25,18,38,.95), rgba(12,10,18,.95))",
          }}
        />

        <div
          style={{
            padding: 24,
            display: "grid",
            gridTemplateColumns: "repeat(2,minmax(0,1fr))",
            gap: 18,
          }}
        >
          {events.length > 0 ? (
            events.map((event) => (
              <div
                key={event.id}
                style={{
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.08)",
                  borderRadius: 18,
                  padding: 18,
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    marginBottom: 10,
                    color: "#d8b4fe",
                    fontSize: ".9rem",
                  }}
                >
                  {formatBRDate(event.data_evento)} • {event.horario || "Sem horário"}
                </span>

                <h4 style={{ margin: 0, fontSize: "1.1rem", color: "white" }}>
                  {event.titulo}
                </h4>

                <p style={{ margin: ".55rem 0 0", color: "#d8cceb" }}>
                  {event.local || "Sem local"}
                </p>
              </div>
            ))
          ) : (
            <div style={{ color: "#d8cceb", padding: 24 }}>
              Nenhum evento cadastrado ainda.
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "center", padding: "0 24px 24px" }}>
          <a
            href="/calendario"
            style={{
              minHeight: 48,
              padding: "0 24px",
              borderRadius: 999,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(90deg, rgba(39,23,64,.96), rgba(82,35,126,.98), rgba(39,23,64,.96))",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Ver calendário completo
          </a>
        </div>
      </div>
    </section>
  );
}

function formatBRDate(dateString: string) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}