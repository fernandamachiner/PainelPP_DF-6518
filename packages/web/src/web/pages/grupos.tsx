import { ArrowUpRight, MapPin } from "lucide-react";
import { motion } from "motion/react";
import { Link, Redirect } from "wouter";
import { Casinha } from "../components/casinha";
import { Cabecalho, Carregando } from "../components/estado";
import { agruparPorGrupo, contar, corGrupo, nomeGrupo } from "../lib/pesquisadores";
import { useEu } from "../queries/acessos";
import { useGruposInfo, usePesquisadores } from "../queries/pesquisadores";

export default function Grupos() {
  const { data, isPending } = usePesquisadores();
  const { data: eu } = useEu();
  const { data: info } = useGruposInfo();
  if (eu?.papel === "monitor") return <Redirect to={`/grupos/${eu.grupo}`} />;
  if (isPending || !data) return <Carregando />;
  const grupos = agruparPorGrupo(data);
  return (
    <div className="mx-auto max-w-6xl">
      <Cabecalho titulo="Grupos" sub="Cada grupo tem seus monitores de referência. Abra o grupo para ver a lista, o mapa e exportar a planilha." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {grupos.map((g, i) => {
          const cor = corGrupo(g.grupo);
          const cidades = contar(g.membros, (p) => p.cidade);
          return (
            <motion.div key={g.chave} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/grupos/${g.chave}`} className="group relative block h-full overflow-hidden rounded-2xl border bg-cartao p-5 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgb(31_74_44/.5)]">
                <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: cor }} />
                <div className="flex items-start justify-between">
                  <Casinha cor={cor} rotulo={g.grupo == null ? "–" : String(g.grupo)} className="h-14 w-12 text-xl" />
                  <ArrowUpRight className="h-5 w-5 text-suave transition group-hover:text-floresta" />
                </div>
                <h2 className="mt-3 font-display text-2xl font-extrabold" style={{ color: cor }}>{nomeGrupo(g.grupo)}</h2>
                <p className="text-sm text-suave"><span className="font-display text-lg font-bold text-tinta">{g.membros.length}</span> pesquisadores</p>
                {info?.get(g.chave) && <p className="mt-2 text-xs leading-snug text-suave">{info.get(g.chave)}</p>}
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-suave">Monitores</p>
                  <p className="mt-0.5 text-sm font-medium">{g.monitores.length ? g.monitores.join(" · ") : <span className="text-alerta">A definir pela coordenação</span>}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {cidades.slice(0, 4).map(([c, n]) => (
                    <span key={c} className="inline-flex items-center gap-1 rounded-full bg-papel px-2 py-0.5 text-xs text-suave"><MapPin className="h-3 w-3" />{c} <b className="text-tinta">{n}</b></span>
                  ))}
                  {cidades.length > 4 && <span className="rounded-full bg-papel px-2 py-0.5 text-xs text-suave">+{cidades.length - 4}</span>}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
