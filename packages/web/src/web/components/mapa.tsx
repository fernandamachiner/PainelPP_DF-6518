import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import type { FeatureCollection, Geometry } from "geojson";
import { useEffect, useMemo } from "react";
import { CircleMarker, GeoJSON, MapContainer, Pane, Popup, TileLayer, useMap } from "react-leaflet";
import { Link } from "wouter";
import { corGrupo, nomeGrupo, type Pesquisador } from "../lib/pesquisadores";
import { BotoesContato } from "./contato";

function Enquadrar({ pontos, foco }: { pontos: [number, number][]; foco?: [number, number] | null }) {
  const map = useMap();
  const chave = JSON.stringify(pontos);
  const chaveFoco = foco ? foco.join(",") : "";
  useEffect(() => {
    const todos = JSON.parse(chave) as [number, number][];
    // Enquadra no DF e Entorno; pessoas muito distantes não "afastam" o mapa
    const noDF = todos.filter(([la, lo]) => la > -16.6 && la < -15.0 && lo > -48.8 && lo < -47.0);
    const pts = noDF.length ? noDF : todos;
    if (chaveFoco) { map.flyTo(chaveFoco.split(",").map(Number) as [number, number], 15, { duration: 0.8 }); return; }
    if (pts.length === 1) map.setView(pts[0], 14);
    else if (pts.length) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14 });
  }, [map, chave, chaveFoco]);
  return null;
}

type Areas = FeatureCollection<Geometry, { nome: string; grupo: number | null }>;

/** Regiões Administrativas do DF (IDE-DF) com o grupo de cada uma. Arquivo estático em /data. */
export function useAreas() {
  return useQuery({
    queryKey: ["areas-df"],
    queryFn: async () => {
      const r = await fetch("/data/ras-df.geojson");
      if (!r.ok) throw new Error("Não foi possível carregar as áreas");
      return (await r.json()) as Areas;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

/** Pinta as RAs na cor do grupo. `grupos` = quais grupos mostrar ("todos" ou uma lista). */
function CamadaAreas({ grupos }: { grupos: "todos" | (number | null)[] }) {
  const { data } = useAreas();
  const chave = grupos === "todos" ? "todos" : grupos.join(",");
  const filtrado = useMemo(() => {
    if (!data) return null;
    if (grupos === "todos") return data;
    return { ...data, features: data.features.filter((f) => grupos.includes(f.properties.grupo)) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, chave]);
  if (!filtrado || !filtrado.features.length) return null;
  return (
    <Pane name="areas" style={{ zIndex: 350 }}>
      <GeoJSON
        key={chave}
        data={filtrado}
        interactive={false}
        style={(f) => {
          const cor = corGrupo(f?.properties.grupo ?? null);
          return { color: cor, weight: 1.5, opacity: 0.9, fillColor: cor, fillOpacity: 0.22 };
        }}
      />
    </Pane>
  );
}

export function Mapa({ pessoas, foco, selecionado, className, areas }: {
  pessoas: Pesquisador[];
  foco?: [number, number] | null;
  selecionado?: number | null;
  className?: string;
  /** Mostrar as áreas dos grupos: "todos" ou a lista de grupos. Omitido = sem áreas. */
  areas?: "todos" | (number | null)[];
}) {
  const comCoord = pessoas.filter((p) => p.latitude != null && p.longitude != null);
  const pontos = comCoord.map((p) => [p.latitude!, p.longitude!] as [number, number]);
  return (
    <MapContainer center={[-15.79, -47.88]} zoom={10} scrollWheelZoom className={className ?? "h-full w-full"}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {areas && <CamadaAreas grupos={areas} />}
      <Enquadrar pontos={pontos} foco={foco} />
      {comCoord.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.latitude!, p.longitude!]}
          radius={selecionado === p.id ? 11 : 7}
          pathOptions={{ color: "#fff", weight: 2, fillColor: corGrupo(p.grupo), fillOpacity: 0.95 }}
        >
          <Popup minWidth={240}>
            <div className="font-sans">
              <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: corGrupo(p.grupo) }}>{nomeGrupo(p.grupo)}</p>
              <Link href={`/pesquisadores/${p.id}`} className="block font-display text-base font-bold !text-floresta hover:underline">{p.nome}</Link>
              <p className="!my-1 text-xs text-suave">{p.endereco} · {p.cidade}</p>
              <p className="!my-1 text-xs text-tinta">{p.celular}</p>
              <div className="mt-2"><BotoesContato p={p} compacto /></div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
