import { Loader2, X } from "lucide-react";
import { useState } from "react";
import type { Pesquisador } from "../lib/pesquisadores";
import { Modal } from "./modal";
import { useAtualizarPesquisador, useGruposInfo } from "../queries/pesquisadores";

type Campos = Omit<Pesquisador, "id">;
const TEXTO: [keyof Campos, string, string?][] = [
  ["nome", "Nome completo"], ["celular", "Celular", "tel"], ["email", "E-mail", "email"],
  ["endereco", "Endereço"], ["cidade", "RA / cidade"], ["estado", "Estado"], ["cep", "CEP"],
  ["sexo", "Sexo"], ["escolaridade", "Escolaridade"], ["formacao", "Formação ou ocupação"],
  ["atuacaoProfissional", "Atuação profissional"], ["atuacaoLocal", "Local de atuação"], ["esfera", "Esfera de atuação"],
  ["monitores", "Monitores (texto da planilha)"],
];

/** Formulário de edição do cadastro — aparece só para a coordenação. */
export function EditarPesquisador({ p, onFechar }: { p: Pesquisador; onFechar: () => void }) {
  const { id: _id, ...inicial } = p;
  const [f, setF] = useState<Campos>(inicial);
  const [lat, setLat] = useState(p.latitude?.toString() ?? "");
  const [lng, setLng] = useState(p.longitude?.toString() ?? "");
  const salvar = useAtualizarPesquisador();
  const { data: info } = useGruposInfo();
  const grupos = info ? [...info.keys()].map(Number).sort((a, b) => a - b) : [];
  const set = <K extends keyof Campos>(k: K, v: Campos[K]) => setF((x) => ({ ...x, [k]: v }));
  const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
  const coordInvalida = [lat, lng].some((s) => s.trim() !== "" && Number.isNaN(Number(s.replace(",", "."))));

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (coordInvalida) return;
    salvar.mutate({ id: p.id, ...f, latitude: num(lat), longitude: num(lng) }, { onSuccess: onFechar });
  }

  return (
    <Modal onFechar={onFechar} baixo className="w-full max-w-2xl">
      <form onSubmit={enviar} className="flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-cartao sm:rounded-3xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-extrabold text-floresta">Editar cadastro</h2>
            <p className="text-xs text-suave">A alteração fica registrada na auditoria.</p>
          </div>
          <button type="button" onClick={onFechar} className="rounded-lg p-1.5 text-suave hover:bg-papel" aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid flex-1 gap-3 overflow-y-auto px-5 py-4 sm:grid-cols-2">
          <Campo rotulo="Grupo">
            <select aria-label="Grupo" value={f.grupo ?? ""} onChange={(e) => set("grupo", e.target.value === "" ? null : Number(e.target.value))} className={inp}>
              <option value="">Sem grupo</option>
              {grupos.map((n) => <option key={n} value={n}>Grupo {n}</option>)}
            </select>
          </Campo>
          <Campo rotulo="Profissional da saúde">
            <select aria-label="Profissional da saúde" value={f.profissionalSaude ? "s" : "n"} onChange={(e) => set("profissionalSaude", e.target.value === "s")} className={inp}>
              <option value="n">Não</option><option value="s">Sim</option>
            </select>
          </Campo>
          {TEXTO.map(([k, rotulo, tipo]) => (
            <Campo key={k} rotulo={rotulo} largo={k === "nome" || k === "endereco" || k === "monitores"}>
              <input aria-label={rotulo} type={tipo ?? "text"} value={String(f[k] ?? "")} required={k === "nome"}
                onChange={(e) => set(k, e.target.value as never)} className={inp} />
            </Campo>
          ))}
          <Campo rotulo="Latitude"><input aria-label="Latitude" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="-15.79" className={inp} /></Campo>
          <Campo rotulo="Longitude"><input aria-label="Longitude" inputMode="decimal" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-47.88" className={inp} /></Campo>
          <Campo rotulo="Dados a revisar (deixe em branco quando estiver tudo certo)" largo>
            <input aria-label="Dados a revisar" value={f.observacao} onChange={(e) => set("observacao", e.target.value)} placeholder="Ex.: CEP inválido" className={inp} />
          </Campo>
        </div>
        <div className="border-t px-5 py-4">
          {(salvar.error || coordInvalida) && (
            <p className="mb-3 rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta">{coordInvalida ? "Latitude e longitude precisam ser números." : salvar.error?.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onFechar} className="h-11 rounded-xl px-4 text-sm text-suave hover:bg-papel">Cancelar</button>
            <button disabled={salvar.isPending} className="inline-flex h-11 items-center gap-2 rounded-xl bg-floresta px-6 text-sm font-semibold text-white hover:bg-floresta-2 disabled:opacity-60">
              {salvar.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

const inp = "h-11 w-full rounded-xl border bg-papel/50 px-3 text-sm outline-none focus:border-folha focus:ring-3 focus:ring-folha/20";
function Campo({ rotulo, largo, children }: { rotulo: string; largo?: boolean; children: React.ReactNode }) {
  return <label className={largo ? "block sm:col-span-2" : "block"}><span className="mb-1 block text-xs font-medium text-suave">{rotulo}</span>{children}</label>;
}
