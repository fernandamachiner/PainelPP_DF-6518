import { ArrowLeft, List, Map as MapIcon } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Casinha } from "../components/casinha";
import { BarraFiltros, useFiltros } from "../components/filtros";
import { Carregando, ForaDoAcesso } from "../components/estado";
import { Mapa } from "../components/mapa";
import { PessoaLinha } from "../components/pessoa-linha";
import { exportarPlanilha } from "../lib/exportar";
import { agruparPorGrupo, contar, corGrupo, nomeGrupo } from "../lib/pesquisadores";
import { cn } from "../lib/utils";
import { useEu } from "../queries/acessos";
import { useGruposInfo, usePesquisadores } from "../queries/pesquisadores";
import { BotaoExportar } from "./pesquisadores";

export default function Grupo({ params }: { params: { id: string } }) {
  const { data, isPending } = usePesquisadores();
  const g = agruparPorGrupo(data ?? []).find((x) => x.chave === params.id);
  const { filtrados, estado, ativos, limpar } = useFiltros(g?.membros ?? []);
  const [vista, setVista] = useState<"lista" | "mapa">("lista");
  const { data: eu } = useEu();
  const { data: info } = useGruposInfo();
  if (isPending || !data) return <Carregando />;
  if (!g) return <ForaDoAcesso eu={eu} oque="grupo" />;
  const cor = corGrupo(g.grupo);
  const cidades = contar(g.membros, (p) => p.cidade);

  return (
    <div className="mx-auto max-w-5xl">
      {eu?.papel === "coordenacao" && (
        <Link href="/grupos" className="mb-4 inline-flex items-center gap-1 text-sm text-suave hover:text-floresta"><ArrowLeft className="h-4 w-4" /> Grupos</Link>
      )}

      <section className="relative overflow-hidden rounded-3xl p-6 text-white md:p-8" style={{ background: cor }}>
        <div className="absolute -right-10 -bottom-12 opacity-20"><Casinha cor="#fff" className="h-56 w-48" /></div>
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/75">{g.membros.length} pesquisadores · {cidades.length} RAs</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold md:text-5xl">{nomeGrupo(g.grupo)}</h1>
            {info?.get(g.chave) && <p className="mt-1 max-w-xl text-sm text-white/85">{info.get(g.chave)}</p>}
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-white/75">Monitores</p>
            <p className="text-lg font-medium">{g.monitores.length ? g.monitores.join(" · ") : "A definir pela coordenação"}</p>
          </div>
          <button onClick={() => exportarPlanilha(g.membros, `${nomeGrupo(g.grupo).toLowerCase().replace(/\s/g, "-")}-pesquisadores`)}
            className="inline-flex h-11 items-center gap-2 self-start rounded-xl bg-white px-4 text-sm font-semibold transition hover:bg-white/90" style={{ color: cor }}>
            Exportar planilha do grupo
          </button>
        </div>
      </section>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-limao/70 p-1 text-sm">
          {([["lista", "Lista", List], ["mapa", "Mapa", MapIcon]] as const).map(([v, r, I]) => (
            <button key={v} onClick={() => setVista(v)} className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium", vista === v ? "bg-cartao text-floresta shadow-sm" : "text-suave")}>
              <I className="h-4 w-4" /> {r}
            </button>
          ))}
        </div>
        {ativos > 0 && <BotaoExportar rotulo="Exportar filtrados" onClick={() => exportarPlanilha(filtrados, "grupo-filtrado")} />}
      </div>

      <div className="mt-4"><BarraFiltros lista={g.membros} f={estado} ativos={ativos} limpar={limpar} semGrupos /></div>

      {vista === "mapa" ? (
        <div className="relative isolate mt-4 h-[60vh] min-h-[400px] overflow-hidden rounded-2xl border">
          <Mapa pessoas={filtrados} areas={[g.grupo]} />
          <div className="pointer-events-none absolute bottom-3 left-3 z-[400] inline-flex items-center gap-1.5 rounded-xl bg-cartao/95 px-3 py-2 text-[11px] shadow">
            <span className="h-3 w-3.5 rounded-[3px] border-[1.5px]" style={{ borderColor: cor, background: `${cor}40` }} />
            Território do {nomeGrupo(g.grupo)}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {filtrados.map((p) => <PessoaLinha key={p.id} p={p} mostrarGrupo={false} />)}
          {!filtrados.length && <p className="rounded-2xl border border-dashed p-10 text-center text-suave">Ninguém encontrado.</p>}
        </div>
      )}
    </div>
  );
}
