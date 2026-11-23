import { AlertTriangle, ArrowLeft, Copy, HeartPulse, MapPinOff, Pencil } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { BotoesContato } from "../components/contato";
import { EditarPesquisador } from "../components/editar-pesquisador";
import { RegistrosContato } from "../components/registros";
import { Carregando, ForaDoAcesso } from "../components/estado";
import { Mapa } from "../components/mapa";
import { agruparPorGrupo, chaveGrupo, corGrupo, iniciais, nomeGrupo } from "../lib/pesquisadores";
import { useEu } from "../queries/acessos";
import { usePesquisadores } from "../queries/pesquisadores";

export default function Pesquisador({ params }: { params: { id: string } }) {
  const { data, isPending } = usePesquisadores();
  const [copiado, setCopiado] = useState("");
  const { data: eu } = useEu();
  const [editando, setEditando] = useState(false);
  if (isPending || !data) return <Carregando />;
  const p = data.find((x) => x.id === Number(params.id));
  if (!p) return <ForaDoAcesso eu={eu} oque="pessoa" />;
  const cor = corGrupo(p.grupo);
  const g = agruparPorGrupo(data).find((x) => x.chave === chaveGrupo(p.grupo));
  const enderecoCompleto = `${p.endereco}, ${p.cidade} - ${p.estado}, CEP ${p.cep}`;
  const copiar = (t: string, k: string) => { navigator.clipboard?.writeText(t); setCopiado(k); setTimeout(() => setCopiado(""), 1500); };

  const dados: [string, string][] = [
    ["Sexo", p.sexo], ["Escolaridade", p.escolaridade], ["Formação ou ocupação", p.formacao],
    ["Atuação profissional", p.atuacaoProfissional], ["Local de atuação", p.atuacaoLocal], ["Esfera de atuação", p.esfera],
    ["Profissional da saúde", p.profissionalSaude ? "Sim" : "Não"],
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button onClick={() => history.back()} className="inline-flex items-center gap-1 text-sm text-suave hover:text-floresta"><ArrowLeft className="h-4 w-4" /> Voltar</button>
        {eu?.papel === "coordenacao" && (
          <button onClick={() => setEditando(true)} className="inline-flex h-10 items-center gap-2 rounded-xl border bg-cartao px-4 text-sm font-semibold text-floresta hover:bg-limao">
            <Pencil className="h-4 w-4" /> Editar cadastro
          </button>
        )}
      </div>
      {editando && <EditarPesquisador p={p} onFechar={() => setEditando(false)} />}

      <section className="rounded-3xl border bg-cartao p-5 md:p-7">
        <div className="flex items-start gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-xl font-bold text-white md:h-20 md:w-20 md:text-2xl" style={{ background: cor }}>{iniciais(p.nome)}</span>
          <div className="min-w-0">
            <Link href={`/grupos/${chaveGrupo(p.grupo)}`} className="text-xs font-semibold uppercase tracking-wider hover:underline" style={{ color: cor }}>{nomeGrupo(p.grupo)}</Link>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-floresta md:text-3xl">{p.nome}</h1>
            <p className="mt-1 text-sm text-suave">Monitores: <span className="text-tinta">{g?.monitores.join(" · ") || "a definir"}</span></p>
            {p.profissionalSaude && <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-alerta/10 px-2.5 py-0.5 text-xs font-medium text-alerta"><HeartPulse className="h-3.5 w-3.5" /> Profissional da saúde</span>}
          </div>
        </div>
        {p.observacao && (
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#EFA92A]/15 px-3 py-2 text-sm text-[#7a4f00]">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Dados a revisar: {p.observacao}
          </p>
        )}
        <div className="mt-5"><BotoesContato p={p} /></div>
      </section>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <section className="space-y-5">
          <div className="rounded-2xl border bg-cartao p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-floresta">Contato</h2>
            <Linha rotulo="Celular" valor={p.celular} onCopiar={() => copiar(p.celular, "cel")} copiado={copiado === "cel"} />
            <Linha rotulo="E-mail" valor={p.email} onCopiar={() => copiar(p.email, "email")} copiado={copiado === "email"} />
            <Linha rotulo="Endereço" valor={enderecoCompleto} onCopiar={() => copiar(enderecoCompleto, "end")} copiado={copiado === "end"} />
          </div>
          <div className="rounded-2xl border bg-cartao p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-floresta">Perfil</h2>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
              {dados.map(([k, v]) => (
                <div key={k}><dt className="text-xs text-suave">{k}</dt><dd className="text-sm font-medium">{v || "—"}</dd></div>
              ))}
            </dl>
          </div>
        </section>
        <section className="h-[360px] overflow-hidden rounded-2xl border lg:h-auto lg:min-h-[420px]">
          {p.latitude != null && p.longitude != null ? (
            <Mapa pessoas={[p]} selecionado={p.id} />
          ) : (
            <div className="grid h-full place-items-center bg-cartao p-6 text-center text-sm text-suave">
              <div><MapPinOff className="mx-auto mb-2 h-6 w-6" />Sem coordenadas na planilha.<br />Use o botão “Rota” para buscar pelo endereço.</div>
            </div>
          )}
        </section>
      </div>

      {eu && <div className="mt-5"><RegistrosContato pesquisadorId={p.id} eu={eu} /></div>}
    </div>
  );
}

function Linha({ rotulo, valor, onCopiar, copiado }: { rotulo: string; valor: string; onCopiar: () => void; copiado: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-2.5 last:border-0">
      <div className="min-w-0"><p className="text-xs text-suave">{rotulo}</p><p className="break-words text-sm font-medium">{valor || "—"}</p></div>
      {valor && (
        <button onClick={onCopiar} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-suave hover:bg-papel" aria-label={`Copiar ${rotulo}`}>
          <Copy className="h-3.5 w-3.5" /> {copiado ? "Copiado" : "Copiar"}
        </button>
      )}
    </div>
  );
}
