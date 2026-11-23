import { ArrowLeft, Download, Eye, FileUp, KeyRound, MessageSquareText, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Cabecalho, Carregando } from "../components/estado";
import { cn } from "../lib/utils";
import { useAuditoria } from "../queries/acessos";

type Tipo = "leitura" | "exportacao" | "acesso" | "dados" | "contato";
const ACOES: Record<string, { rotulo: string; tipo: Tipo }> = {
  exportacao: { rotulo: "Baixou planilha", tipo: "exportacao" },
  aceite_privacidade: { rotulo: "Aceitou o aviso de privacidade", tipo: "acesso" },
  link_senha_gerado: { rotulo: "Gerou link de nova senha", tipo: "acesso" },
  contato_registrado: { rotulo: "Registrou contato", tipo: "contato" },
  contato_apagado: { rotulo: "Apagou registro de contato", tipo: "contato" },
  listar_pesquisadores: { rotulo: "Consultou pesquisadores", tipo: "leitura" },
  acesso_liberado: { rotulo: "Acesso liberado", tipo: "acesso" },
  acesso_alterado: { rotulo: "Acesso alterado", tipo: "acesso" },
  acesso_removido: { rotulo: "Acesso removido", tipo: "acesso" },
  importacao_planilha: { rotulo: "Planilha importada", tipo: "dados" },
  pesquisador_alterado: { rotulo: "Pesquisador alterado", tipo: "dados" },
  pesquisador_excluido: { rotulo: "Pesquisador excluído", tipo: "dados" },
};
const ICONE = { leitura: Eye, exportacao: Download, acesso: KeyRound, dados: FileUp, contato: MessageSquareText };
const FILTROS = [
  { v: "todos", r: "Tudo" },
  { v: "leitura", r: "Consultas" },
  { v: "exportacao", r: "Exportações" },
  { v: "contato", r: "Contatos" },
  { v: "acesso", r: "Acessos" },
  { v: "dados", r: "Dados" },
] as const;

export default function Auditoria() {
  const { data, isPending } = useAuditoria();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["v"]>("todos");
  const linhas = useMemo(
    () => (data ?? []).filter((l) => filtro === "todos" || (ACOES[l.acao]?.tipo ?? "dados") === filtro),
    [data, filtro],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/acessos" className="mb-3 inline-flex items-center gap-1 text-sm text-suave hover:text-floresta">
        <ArrowLeft className="h-4 w-4" /> Acessos
      </Link>
      <Cabecalho
        titulo="Auditoria"
        sub="Registro gravado pelo próprio banco de dados. Mostra quem consultou ou baixou a base, quantos registros recebeu, os contatos registrados e cada mudança de acesso ou cadastro. Não pode ser alterado nem apagado."
      />

      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-floresta/15 bg-limao/60 p-4 text-sm text-floresta">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          Quem decide o que cada pessoa vê é o banco de dados: monitor só recebe as linhas do seu grupo, e a coordenação recebe todas.
          Gatilhos no banco bloqueiam escrita fora do grupo e alterações de acesso feitas por quem não é da coordenação.
        </p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button key={f.v} onClick={() => setFiltro(f.v)}
            className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", filtro === f.v ? "border-floresta bg-floresta text-white" : "bg-cartao text-suave hover:text-floresta")}>
            {f.r}
          </button>
        ))}
      </div>

      {isPending ? <Carregando /> : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-cartao">
          {linhas.length === 0 && <li className="p-5 text-sm text-suave">Nenhum registro.</li>}
          {linhas.map((l) => {
            const a = ACOES[l.acao] ?? { rotulo: l.acao, tipo: "dados" as Tipo };
            const Icone = ICONE[a.tipo];
            const quem = l.email === "sistema" ? "Sistema (importação)" : l.email ?? "—";
            const papel = l.papel === "coordenacao" ? "Coordenação" : l.papel === "monitor" ? `Monitor(a) · Grupo ${l.grupo}` : null;
            return (
              <li key={l.id} className="flex gap-3 p-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-limao text-floresta"><Icone className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p className="text-sm font-semibold text-tinta">
                      {a.rotulo}
                      {l.registros != null && (a.tipo === "leitura" || a.tipo === "exportacao") && <span className="font-normal text-suave"> · {l.registros} registros</span>}
                    </p>
                    <time className="text-xs text-suave">{new Date(l.quando).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time>
                  </div>
                  <p className="truncate text-xs text-suave">{quem}{papel && ` · ${papel}`}</p>
                  {l.detalhe && <p className="mt-0.5 break-words text-xs text-tinta/80">{l.detalhe}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
