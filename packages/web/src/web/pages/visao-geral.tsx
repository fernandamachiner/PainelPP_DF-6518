import { ArrowRight, HeartPulse, MapPin, Users, UsersRound } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "wouter";
import { Casinha } from "../components/casinha";
import { Cabecalho, Carregando } from "../components/estado";
import { agruparPorGrupo, contar, corGrupo, nomeGrupo, type Pesquisador } from "../lib/pesquisadores";
import { useEu } from "../queries/acessos";
import { usePesquisadores } from "../queries/pesquisadores";

const surgir = (i: number) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.06, duration: 0.45 } });

export default function VisaoGeral() {
  const { data, isPending } = usePesquisadores();
  const { data: eu } = useEu();
  if (isPending || !data) return <Carregando />;
  const monitor = eu?.papel === "monitor";
  const grupos = agruparPorGrupo(data);
  const cidades = contar(data, (p) => p.cidade);
  const saude = data.filter((p) => p.profissionalSaude).length;
  const maior = Math.max(...grupos.map((g) => g.membros.length));

  const kpis = [
    { rotulo: "Pesquisadores", valor: data.length, Icone: Users, cor: "#1F4A2C" },
    monitor
      ? { rotulo: "Monitores no grupo", valor: grupos[0]?.monitores.length ?? 0, Icone: UsersRound, cor: "#5A9A3E" }
      : { rotulo: "Grupos", valor: grupos.filter((g) => g.grupo != null).length, Icone: UsersRound, cor: "#5A9A3E" },
    { rotulo: "RAs", valor: cidades.length, Icone: MapPin, cor: "#3E9CC9" },
    { rotulo: "Profissionais da saúde", valor: saude, Icone: HeartPulse, cor: "#D7262E" },
  ];

  return (
    <div className="mx-auto max-w-6xl">
      <Cabecalho
        titulo={monitor ? `Visão geral · Grupo ${eu?.grupo}` : "Visão geral"}
        sub={monitor ? "Você está vendo apenas os pesquisadores e pesquisadoras do seu grupo." : "Resumo dos pesquisadores e pesquisadoras populares por grupo e território."}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {kpis.map(({ rotulo, valor, Icone, cor }, i) => (
          <motion.div key={rotulo} {...surgir(i)} className="relative overflow-hidden rounded-2xl border bg-cartao p-4">
            <Icone className="h-5 w-5" style={{ color: cor }} />
            <p className="mt-3 font-display text-4xl font-extrabold leading-none" style={{ color: cor }}>{valor}</p>
            <p className="mt-1 text-xs text-suave">{rotulo}</p>
            <span className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-10" style={{ background: cor }} />
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <motion.section {...surgir(4)} className="rounded-2xl border bg-cartao p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-floresta">Pesquisadores por grupo</h2>
            <Link href={monitor ? `/grupos/${eu?.grupo}` : "/grupos"} className="inline-flex items-center gap-1 text-xs font-medium text-folha hover:underline">{monitor ? "Ver meu grupo" : "Ver grupos"} <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <ul className="space-y-2.5">
            {grupos.map((g) => (
              <li key={g.chave}>
                <Link href={`/grupos/${g.chave}`} className="group flex items-center gap-3">
                  <Casinha cor={corGrupo(g.grupo)} rotulo={g.grupo == null ? "–" : String(g.grupo)} className="h-9 w-8 text-sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2 text-sm">
                      <span className="truncate font-medium group-hover:text-floresta">{nomeGrupo(g.grupo)} <span className="font-normal text-suave">· {g.monitores.join(", ") || "sem monitor"}</span></span>
                      <span className="font-display font-bold">{g.membros.length}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-papel">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(g.membros.length / maior) * 100}%` }} transition={{ delay: 0.3, duration: 0.7 }}
                        className="h-2 rounded-full" style={{ background: corGrupo(g.grupo) }} />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </motion.section>

        <motion.section {...surgir(5)} className="rounded-2xl border bg-cartao p-5">
          <h2 className="mb-4 font-display text-xl font-bold text-floresta">Pesquisadores por RA</h2>
          <Barras itens={cidades.slice(0, 10)} cor="#3E9CC9" />
          {cidades.length > 10 && <p className="mt-3 text-xs text-suave">+ {cidades.length - 10} outras RAs</p>}
        </motion.section>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3 [&>*]:min-w-0">
        <Bloco titulo="Escolaridade" dados={data} chave={(p) => p.escolaridade} cor="#5A9A3E" i={6} />
        <Bloco titulo="Esfera de atuação" dados={data} chave={(p) => p.esfera} cor="#EFA92A" i={7} />
        <Bloco titulo="Formação ou ocupação" dados={data} chave={(p) => p.formacao} cor="#8E1B3F" i={8} limite={7} />
      </div>
    </div>
  );
}

function Bloco({ titulo, dados, chave, cor, i, limite = 8 }: { titulo: string; dados: Pesquisador[]; chave: (p: Pesquisador) => string; cor: string; i: number; limite?: number }) {
  return (
    <motion.section {...surgir(i)} className="rounded-2xl border bg-cartao p-5">
      <h2 className="mb-4 font-display text-lg font-bold text-floresta">{titulo}</h2>
      <Barras itens={contar(dados, chave).slice(0, limite)} cor={cor} />
    </motion.section>
  );
}

function Barras({ itens, cor }: { itens: [string, number][]; cor: string }) {
  const max = Math.max(1, ...itens.map((x) => x[1]));
  return (
    <ul className="space-y-2">
      {itens.map(([k, v]) => (
        <li key={k} className="text-sm">
          <div className="flex justify-between gap-2"><span className="truncate text-tinta/85">{k}</span><span className="font-semibold">{v}</span></div>
          <div className="mt-1 h-1.5 rounded-full bg-papel"><div className="h-1.5 rounded-full" style={{ width: `${(v / max) * 100}%`, background: cor }} /></div>
        </li>
      ))}
    </ul>
  );
}
