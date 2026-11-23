import { Loader2, ShieldX } from "lucide-react";
import { Link } from "wouter";

export function Carregando({ texto = "Carregando…" }: { texto?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-suave">
      <Loader2 className="h-5 w-5 animate-spin" /> {texto}
    </div>
  );
}

export function Cabecalho({ titulo, sub, acao }: { titulo: React.ReactNode; sub?: React.ReactNode; acao?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-floresta md:text-4xl">{titulo}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-suave">{sub}</p>}
      </div>
      {acao}
    </header>
  );
}

/** Mostrado quando o banco não devolveu o registro pedido (fora do grupo do monitor ou inexistente). */
export function ForaDoAcesso({ eu, oque }: { eu?: { papel: string; grupo: number | null }; oque: "grupo" | "pessoa" }) {
  const monitor = eu?.papel === "monitor";
  return (
    <div className="mx-auto mt-6 max-w-md rounded-3xl border bg-cartao p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-limao text-floresta"><ShieldX className="h-7 w-7" /></span>
      <h1 className="mt-4 font-display text-2xl font-extrabold text-floresta">
        {monitor ? "Fora do seu acesso" : oque === "grupo" ? "Grupo não encontrado" : "Pessoa não encontrada"}
      </h1>
      <p className="mt-2 text-sm text-suave">
        {monitor
          ? `Seu acesso é ao Grupo ${eu?.grupo}. O banco de dados não entrega registros de outros grupos para monitores, por isso nada é exibido aqui.`
          : "Esse registro não existe ou foi removido da base."}
      </p>
      <Link href={monitor ? `/grupos/${eu?.grupo}` : oque === "grupo" ? "/grupos" : "/pesquisadores"}
        className="mt-5 inline-flex h-11 items-center rounded-xl bg-floresta px-5 text-sm font-semibold text-white hover:bg-floresta-2">
        {monitor ? `Ir para o Grupo ${eu?.grupo}` : "Voltar"}
      </Link>
    </div>
  );
}
