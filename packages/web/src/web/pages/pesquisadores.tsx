import { Download } from "lucide-react";
import { Redirect } from "wouter";
import { BarraFiltros, useFiltros } from "../components/filtros";
import { Cabecalho, Carregando } from "../components/estado";
import { PessoaLinha } from "../components/pessoa-linha";
import { exportarPlanilha } from "../lib/exportar";
import { useEu } from "../queries/acessos";
import { usePesquisadores } from "../queries/pesquisadores";

export default function Pesquisadores() {
  const { data, isPending } = usePesquisadores();
  const { filtrados, estado, ativos, limpar } = useFiltros(data ?? []);
  const { data: eu } = useEu();
  // Monitor não tem a seção "Pesquisadores": a lista dele fica em "Meu grupo"
  if (eu?.papel === "monitor") return <Redirect to={`/grupos/${eu.grupo}`} />;
  if (isPending || !data) return <Carregando />;
  return (
    <div className="mx-auto max-w-5xl">
      <Cabecalho
        titulo="Pesquisadores"
        sub="Todas as pessoas do curso. Use a busca e os filtros para encontrar quem acionar."
        acao={<BotaoExportar onClick={() => exportarPlanilha(filtrados, ativos ? "pesquisadores-filtrados" : "pesquisadores-todos")} />}
      />
      <BarraFiltros lista={data} f={estado} ativos={ativos} limpar={limpar} />
      <p className="mt-5 mb-2 text-sm text-suave">{filtrados.length} de {data.length} pessoas</p>
      <div className="space-y-2">
        {filtrados.map((p) => <PessoaLinha key={p.id} p={p} />)}
        {!filtrados.length && <p className="rounded-2xl border border-dashed p-10 text-center text-suave">Ninguém encontrado com esses filtros.</p>}
      </div>
    </div>
  );
}

export function BotaoExportar({ onClick, rotulo = "Exportar planilha" }: { onClick: () => void; rotulo?: string }) {
  return (
    <button onClick={onClick} className="inline-flex h-11 items-center gap-2 self-start rounded-xl bg-floresta px-4 text-sm font-semibold text-white transition hover:bg-floresta-2 md:self-auto">
      <Download className="h-4 w-4" /> {rotulo}
    </button>
  );
}
