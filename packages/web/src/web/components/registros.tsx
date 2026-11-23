import { Loader2, Mail, MapPin, MessageCircle, NotebookPen, Phone, Trash2 } from "lucide-react";
import { useState } from "react";
import { cn } from "../lib/utils";
import { useAdicionarRegistro, useRegistros, useRemoverRegistro } from "../queries/pesquisadores";

const TIPOS = [
  { v: "ligacao", r: "Ligação", Icone: Phone },
  { v: "whatsapp", r: "WhatsApp", Icone: MessageCircle },
  { v: "email", r: "E-mail", Icone: Mail },
  { v: "visita", r: "Visita", Icone: MapPin },
  { v: "observacao", r: "Observação", Icone: NotebookPen },
] as const;
const RESULTADOS = [
  { v: "atendeu", r: "Atendeu / respondeu", cor: "bg-folha/15 text-[#2f5d1f]" },
  { v: "nao_atendeu", r: "Não atendeu", cor: "bg-alerta/10 text-alerta" },
  { v: "retornar", r: "Retornar depois", cor: "bg-[#EFA92A]/20 text-[#7a4f00]" },
] as const;
type Tipo = (typeof TIPOS)[number]["v"];
type Resultado = (typeof RESULTADOS)[number]["v"] | "";

/** Histórico de contatos com a pessoa + formulário para registrar um novo. */
export function RegistrosContato({ pesquisadorId, eu }: { pesquisadorId: number; eu: { email: string; papel: string } }) {
  const { data, isPending } = useRegistros(pesquisadorId);
  const add = useAdicionarRegistro();
  const rem = useRemoverRegistro();
  const [tipo, setTipo] = useState<Tipo>("ligacao");
  const [resultado, setResultado] = useState<Resultado>("");
  const [texto, setTexto] = useState("");
  const comResultado = tipo !== "observacao";

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    add.mutate(
      { pesquisadorId, tipo, resultado: comResultado ? resultado : "", texto },
      { onSuccess: () => { setTexto(""); setResultado(""); } },
    );
  }

  return (
    <section className="rounded-2xl border bg-cartao p-5">
      <h2 className="font-display text-lg font-bold text-floresta">Registro de contato</h2>
      <p className="text-xs text-suave">Anote ligações, mensagens, visitas e observações. Quem é do grupo e a coordenação veem o histórico.</p>

      <form onSubmit={enviar} className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {TIPOS.map(({ v, r, Icone }) => (
            <button key={v} type="button" onClick={() => setTipo(v)}
              className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition", tipo === v ? "border-floresta bg-floresta text-white" : "bg-cartao text-suave hover:text-floresta")}>
              <Icone className="h-3.5 w-3.5" /> {r}
            </button>
          ))}
        </div>
        {comResultado && (
          <div className="flex flex-wrap gap-1.5">
            {RESULTADOS.map(({ v, r }) => (
              <button key={v} type="button" onClick={() => setResultado(resultado === v ? "" : v)}
                className={cn("rounded-full border px-3 py-1.5 text-xs transition", resultado === v ? "border-folha bg-limao font-semibold text-floresta" : "bg-cartao text-suave hover:text-floresta")}>
                {r}
              </button>
            ))}
          </div>
        )}
        <textarea aria-label="Texto do registro" value={texto} onChange={(e) => setTexto(e.target.value)} rows={3} maxLength={2000}
          placeholder={tipo === "observacao" ? "Escreva a observação…" : "O que foi conversado? (opcional)"}
          className="w-full rounded-xl border bg-papel/50 px-3 py-2.5 text-sm outline-none focus:border-folha focus:ring-3 focus:ring-folha/20" />
        {add.error && <p className="rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta">{add.error.message}</p>}
        <div className="flex justify-end">
          <button disabled={add.isPending || (!texto.trim() && !resultado)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-floresta px-5 text-sm font-semibold text-white hover:bg-floresta-2 disabled:opacity-50">
            {add.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Registrar
          </button>
        </div>
      </form>

      <div className="mt-5 border-t pt-4">
        {isPending ? (
          <p className="flex items-center gap-2 text-sm text-suave"><Loader2 className="h-4 w-4 animate-spin" /> Carregando histórico…</p>
        ) : !data?.length ? (
          <p className="text-sm text-suave">Nenhum contato registrado ainda.</p>
        ) : (
          <ol className="space-y-3">
            {data.map((r) => {
              const t = TIPOS.find((x) => x.v === r.tipo) ?? TIPOS[4];
              const res = RESULTADOS.find((x) => x.v === r.resultado);
              const podeApagar = r.autorEmail === eu.email.toLowerCase() || eu.papel === "coordenacao";
              return (
                <li key={r.id} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-limao text-floresta"><t.Icone className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold">{t.r}</span>
                      {res && <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", res.cor)}>{res.r}</span>}
                      <time className="ml-auto text-xs text-suave">{new Date(r.quando).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time>
                    </div>
                    {r.texto && <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-tinta/90">{r.texto}</p>}
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-suave">por {r.autorNome || r.autorEmail}</p>
                      {podeApagar && (
                        <button onClick={() => { if (confirm("Apagar este registro?")) rem.mutate({ id: r.id }); }}
                          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-0.5 text-xs text-suave hover:bg-alerta/10 hover:text-alerta">
                          <Trash2 className="h-3.5 w-3.5" /> Apagar
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {rem.error && <p className="mt-2 text-sm text-alerta">{rem.error.message}</p>}
      </div>
    </section>
  );
}
