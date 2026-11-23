import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../lib/utils";
import { agruparPorGrupo, chaveGrupo, contar, corGrupo, normalizar, type Pesquisador } from "../lib/pesquisadores";

export function useFiltros(lista: Pesquisador[]) {
  const [busca, setBusca] = useState("");
  const [grupos, setGrupos] = useState<string[]>([]);
  const [cidade, setCidade] = useState("");

  const filtrados = useMemo(() => {
    const b = normalizar(busca.trim());
    return lista.filter((p) =>
      (!grupos.length || grupos.includes(chaveGrupo(p.grupo))) &&
      (!cidade || p.cidade === cidade) &&
      (!b || normalizar(`${p.nome} ${p.email} ${p.celular} ${p.endereco} ${p.cidade} ${p.monitores}`).includes(b)),
    );
  }, [lista, busca, grupos, cidade]);

  const ativos = grupos.length + (cidade ? 1 : 0) + (busca ? 1 : 0);
  const limpar = () => { setBusca(""); setGrupos([]); setCidade(""); };
  return { filtrados, ativos, limpar, estado: { busca, setBusca, grupos, setGrupos, cidade, setCidade } };
}

type Estado = ReturnType<typeof useFiltros>["estado"];

export function BarraFiltros({ lista, f, ativos, limpar, semGrupos }: { lista: Pesquisador[]; f: Estado; ativos: number; limpar: () => void; semGrupos?: boolean }) {
  const grupos = agruparPorGrupo(lista);
  const cidades = contar(lista, (p) => p.cidade).map((x) => x[0]).sort((a, b) => a.localeCompare(b, "pt-BR"));
  const alternar = (k: string) => f.setGrupos(f.grupos.includes(k) ? f.grupos.filter((x) => x !== k) : [...f.grupos, k]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-suave" />
        <input value={f.busca} onChange={(e) => f.setBusca(e.target.value)} aria-label="Buscar" placeholder="Buscar por nome, telefone, e-mail, endereço…"
          className="h-12 w-full rounded-xl border bg-cartao pl-10 pr-10 text-[15px] outline-none focus:border-folha focus:ring-3 focus:ring-folha/20" />
        {f.busca && (
          <button onClick={() => f.setBusca("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-suave" aria-label="Limpar busca"><X className="h-4 w-4" /></button>
        )}
      </div>
      {!semGrupos && grupos.length > 1 && (
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {grupos.map((g) => {
            const on = f.grupos.includes(g.chave);
            const cor = corGrupo(g.grupo);
            return (
              <button key={g.chave} onClick={() => alternar(g.chave)}
                className={cn("inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition", on ? "text-white" : "bg-cartao text-tinta hover:border-tinta/30")}
                style={on ? { background: cor, borderColor: cor } : undefined}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: on ? "#fff" : cor }} />
                {g.grupo == null ? "Sem grupo" : `G${g.grupo}`}
                <span className={cn("text-xs", on ? "text-white/80" : "text-suave")}>{g.membros.length}</span>
              </button>
            );
          })}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Select valor={f.cidade} onChange={f.setCidade} vazio="Todas as RAs" opcoes={cidades} />
        {ativos > 0 && (
          <button onClick={limpar} className="inline-flex h-10 items-center gap-1 px-2 text-sm text-suave hover:text-tinta"><X className="h-4 w-4" /> Limpar filtros</button>
        )}
      </div>
    </div>
  );
}

function Select({ valor, onChange, vazio, opcoes }: { valor: string; onChange: (v: string) => void; vazio: string; opcoes: string[] }) {
  return (
    <select value={valor} onChange={(e) => onChange(e.target.value)}
      className={cn("h-10 max-w-[48%] rounded-xl border bg-cartao px-3 text-sm outline-none focus:border-folha md:max-w-none", valor && "border-folha text-floresta font-medium")}>
      <option value="">{vazio}</option>
      {opcoes.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
