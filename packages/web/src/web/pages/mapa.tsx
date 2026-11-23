import { MapPin } from "lucide-react";
import { useState } from "react";
import { BarraFiltros, useFiltros } from "../components/filtros";
import { Cabecalho, Carregando } from "../components/estado";
import { Mapa } from "../components/mapa";
import { agruparPorGrupo, corGrupo, nomeGrupo } from "../lib/pesquisadores";
import { useEu } from "../queries/acessos";
import { usePesquisadores } from "../queries/pesquisadores";

export default function PaginaMapa() {
  const { data, isPending } = usePesquisadores();
  const { filtrados, estado, ativos, limpar } = useFiltros(data ?? []);
  const [sel, setSel] = useState<{ id: number; foco: [number, number] } | null>(null);
  const { data: eu } = useEu();
  if (isPending || !data) return <Carregando />;
  // Coordenação vê as áreas de todos os grupos; monitor, só as do próprio grupo
  const areas = !eu ? undefined : eu.papel === "coordenacao" ? ("todos" as const) : eu.grupo != null ? [eu.grupo] : undefined;
  const legenda = eu?.papel === "coordenacao" ? [1, 2, 3, 4, 5, 6, 7] : agruparPorGrupo(data).map((g) => g.grupo);
  const semCoord = filtrados.filter((p) => p.latitude == null || p.longitude == null).length;

  return (
    <div className="mx-auto max-w-7xl">
      <Cabecalho titulo="Mapa dos territórios" sub="As áreas coloridas são as Regiões Administrativas de cada grupo. Cada ponto é um(a) pesquisador(a). Toque no ponto para ver contatos e abrir a rota." />
      <BarraFiltros lista={data} f={estado} ativos={ativos} limpar={limpar} />

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="relative isolate h-[62vh] min-h-[420px] overflow-hidden rounded-2xl border bg-cartao lg:h-[calc(100vh-300px)]">
          <Mapa pessoas={filtrados} foco={sel?.foco} selecionado={sel?.id} areas={areas} />
          {legenda.length > 0 && <div className="pointer-events-none absolute bottom-3 left-3 z-[400] flex max-w-[calc(100%-1.5rem)] flex-wrap gap-x-3 gap-y-1 rounded-xl bg-cartao/95 px-3 py-2 text-[11px] shadow">
            {legenda.map((g) => (
              <span key={String(g)} className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3.5 rounded-[3px] border-[1.5px]" style={{ borderColor: corGrupo(g), background: `${corGrupo(g)}40` }} />
                {g == null ? "Sem grupo" : `G${g}`}
              </span>
            ))}
          </div>}
        </div>

        <aside className="rounded-2xl border bg-cartao lg:h-[calc(100vh-300px)] lg:overflow-y-auto">
          <p className="sticky top-0 border-b bg-cartao px-4 py-3 text-sm font-semibold text-floresta">
            {filtrados.length} {filtrados.length === 1 ? "pessoa" : "pessoas"}
            {semCoord > 0 && <span className="block text-xs font-normal text-[#9a6a00]">{semCoord} sem coordenadas (não aparecem no mapa)</span>}
          </p>
          <ul className="max-h-[50vh] divide-y overflow-y-auto lg:max-h-none">
            {filtrados.map((p) => (
              <li key={p.id}>
                <button
                  aria-label={`Ver ${p.nome} no mapa`}
                  onClick={() => { if (p.latitude != null && p.longitude != null) { setSel({ id: p.id, foco: [p.latitude, p.longitude] }); window.scrollTo({ top: 0, behavior: "smooth" }); } }}
                  className={`flex w-full items-start gap-2.5 px-4 py-2.5 text-left transition hover:bg-papel ${sel?.id === p.id ? "bg-limao/60" : ""}`}>
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: corGrupo(p.grupo) }} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{p.nome}</span>
                    <span className="flex items-center gap-1 text-xs text-suave"><MapPin className="h-3 w-3" />{p.cidade} · {nomeGrupo(p.grupo)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
