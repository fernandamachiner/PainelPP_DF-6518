import { Copy, KeyRound, Loader2, MessageCircle, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { Cabecalho, Carregando } from "../components/estado";
import { Modal } from "../components/modal";
import { corGrupo } from "../lib/pesquisadores";
import { cn } from "../lib/utils";
import { useAcessos, useAdicionarAcesso, useAtualizarAcesso, useEu, useLinkSenha, useRemoverAcesso } from "../queries/acessos";
import { useGruposInfo } from "../queries/pesquisadores";

type Papel = "monitor" | "coordenacao";

export default function Acessos() {
  const { data, isPending } = useAcessos();
  const eu = useEu();
  const { data: info } = useGruposInfo();
  const add = useAdicionarAcesso();
  const upd = useAtualizarAcesso();
  const rem = useRemoverAcesso();
  const linkSenha = useLinkSenha();
  const [link, setLink] = useState<{ link: string; email: string; nome: string } | null>(null);
  const [copiado, setCopiado] = useState(false);
  const gerarLink = (a: Acesso) => {
    if (!confirm(`Gerar um link para ${a.nome || a.email} criar uma nova senha? O link vale por 24 horas e só pode ser usado uma vez.`)) return;
    linkSenha.mutate({ id: a.id }, { onSuccess: (r) => { setCopiado(false); setLink({ ...r, nome: a.nome }); } });
  };
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");
  const [papel, setPapel] = useState<Papel>("monitor");
  const [grupo, setGrupo] = useState("");
  const numeros = info ? [...info.keys()].map(Number).sort((a, b) => a - b) : [1, 2, 3, 4, 5, 6, 7];

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    add.mutate(
      { email, nome, papel, grupo: papel === "monitor" && grupo ? Number(grupo) : null },
      { onSuccess: () => { setEmail(""); setNome(""); setGrupo(""); } },
    );
  }

  const coord = data?.filter((a) => a.papel === "coordenacao") ?? [];
  const monitores = data?.filter((a) => a.papel === "monitor") ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <Cabecalho
        titulo="Acessos"
        sub="A coordenação vê todos os grupos. Cada monitor(a) vê apenas o seu grupo. Depois de liberado, a pessoa entra em “Primeiro acesso” e cria a própria senha."
        acao={
          <Link href="/auditoria" className="inline-flex h-10 items-center gap-2 self-start rounded-xl border bg-cartao px-4 text-sm font-semibold text-floresta hover:bg-limao">
            <ShieldCheck className="h-4 w-4" /> Auditoria
          </Link>
        }
      />

      <form onSubmit={enviar} className="grid gap-3 rounded-2xl border bg-cartao p-5 md:grid-cols-[1fr_1.2fr_auto_auto_auto] md:items-end">
        <Campo rotulo="Nome"><input aria-label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Camila Rabello" className={inp} /></Campo>
        <Campo rotulo="E-mail"><input aria-label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@email.com" className={inp} /></Campo>
        <Campo rotulo="Papel">
          <select value={papel} onChange={(e) => setPapel(e.target.value as Papel)} className={inp}>
            <option value="monitor">Monitor(a)</option>
            <option value="coordenacao">Coordenação</option>
          </select>
        </Campo>
        <Campo rotulo="Grupo">
          <select value={papel === "coordenacao" ? "" : grupo} onChange={(e) => setGrupo(e.target.value)} disabled={papel === "coordenacao"} required={papel === "monitor"} className={cn(inp, "disabled:opacity-50")}>
            <option value="">{papel === "coordenacao" ? "Todos" : "Escolha…"}</option>
            {numeros.map((n) => <option key={n} value={n}>Grupo {n}</option>)}
          </select>
        </Campo>
        <button disabled={add.isPending} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-floresta px-4 text-sm font-semibold text-white hover:bg-floresta-2 disabled:opacity-60">
          {add.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Liberar
        </button>
        {add.error && <p className="text-sm text-alerta md:col-span-5">{add.error.message}</p>}
      </form>
      {(upd.error || rem.error || linkSenha.error) && <p className="mt-3 text-sm text-alerta">{(upd.error ?? rem.error ?? linkSenha.error)?.message}</p>}
      {link && (
        <Modal onFechar={() => setLink(null)} className="w-full max-w-md rounded-3xl bg-cartao p-6">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-xl font-extrabold text-floresta">Link de nova senha</h2>
              <button onClick={() => setLink(null)} className="rounded-lg p-1.5 text-suave hover:bg-papel" aria-label="Fechar"><X className="h-5 w-5" /></button>
            </div>
            <p className="mt-1 text-sm text-suave">Envie só para <b className="text-tinta">{link.nome || link.email}</b>. Vale por 24 horas e funciona uma única vez.</p>
            <p className="mt-4 break-all rounded-xl bg-papel p-3 font-mono text-xs">{link.link}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button onClick={() => { navigator.clipboard?.writeText(link.link); setCopiado(true); }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold text-floresta hover:bg-limao">
                <Copy className="h-4 w-4" /> {copiado ? "Copiado" : "Copiar"}
              </button>
              <a target="_blank" rel="noreferrer"
                href={`https://wa.me/?text=${encodeURIComponent(`Olá${link.nome ? `, ${link.nome.split(" ")[0]}` : ""}! Use este link para criar uma nova senha no Painel Pesquisadores Populares (vale por 24h): ${link.link}`)}`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-[#0b3d1f] hover:brightness-95">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </div>
        </Modal>
      )}

      {isPending ? <Carregando /> : (
        <>
          <Secao titulo="Coordenação" sub="Acesso a todas as telas e grupos" n={coord.length} />
          <Lista>
            {coord.map((a) => (
              <Item key={a.id} a={a} souEu={a.email === eu.data?.email.toLowerCase()} numeros={numeros}
                onChange={(d) => upd.mutate({ id: a.id, nome: a.nome, ...d })} onRemove={() => rem.mutate({ id: a.id })} onLink={() => gerarLink(a)} />
            ))}
          </Lista>
          <Secao titulo="Monitores" sub="Cada um vê apenas o grupo indicado" n={monitores.length} />
          <Lista>
            {monitores.map((a) => (
              <Item key={a.id} a={a} souEu={false} numeros={numeros}
                onChange={(d) => upd.mutate({ id: a.id, nome: a.nome, ...d })} onRemove={() => rem.mutate({ id: a.id })} onLink={() => gerarLink(a)} />
            ))}
            {!monitores.length && <li className="px-4 py-6 text-center text-sm text-suave">Nenhum monitor liberado.</li>}
          </Lista>
        </>
      )}
    </div>
  );
}

interface Acesso { id: number; email: string; nome: string; papel: Papel; grupo: number | null }

function Item({ a, souEu, numeros, onChange, onRemove, onLink }: {
  a: Acesso; souEu: boolean; numeros: number[];
  onChange: (d: { papel: Papel; grupo: number | null }) => void; onRemove: () => void; onLink: () => void;
}) {
  const cor = a.papel === "monitor" && a.grupo != null ? corGrupo(a.grupo) : "#1F4A2C";
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: cor }}>
        {a.papel === "monitor" && a.grupo != null ? <b className="font-display">{a.grupo}</b> : <ShieldCheck className="h-4 w-4" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{a.nome || a.email}{souEu && <span className="ml-1 text-xs text-suave">(você)</span>}</p>
        <p className="truncate text-xs text-suave">{a.email}</p>
      </div>
      {!souEu && (
        <div className="flex items-center gap-2">
          <select aria-label="Papel" value={a.papel} onChange={(e) => {
            const papel = e.target.value as Papel;
            onChange({ papel, grupo: papel === "coordenacao" ? null : a.grupo ?? numeros[0] ?? 1 });
          }} className="h-9 rounded-lg border bg-cartao px-2 text-xs">
            <option value="monitor">Monitor(a)</option>
            <option value="coordenacao">Coordenação</option>
          </select>
          {a.papel === "monitor" && (
            <select aria-label="Grupo" value={a.grupo ?? ""} onChange={(e) => onChange({ papel: "monitor", grupo: Number(e.target.value) })}
              className="h-9 rounded-lg border bg-cartao px-2 text-xs font-semibold" style={{ color: cor }}>
              {numeros.map((n) => <option key={n} value={n}>Grupo {n}</option>)}
            </select>
          )}
          <button onClick={onLink} title="Gerar link de nova senha"
            className="rounded-lg p-2 text-suave hover:bg-limao hover:text-floresta" aria-label="Gerar link de nova senha">
            <KeyRound className="h-4 w-4" />
          </button>
          <button onClick={() => { if (confirm(`Remover o acesso de ${a.email}?`)) onRemove(); }}
            className="rounded-lg p-2 text-suave hover:bg-alerta/10 hover:text-alerta" aria-label="Remover acesso">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </li>
  );
}

function Secao({ titulo, sub, n }: { titulo: string; sub: string; n: number }) {
  return (
    <div className="mt-7 mb-2 flex items-baseline justify-between">
      <h2 className="font-display text-lg font-bold text-floresta">{titulo} <span className="text-sm font-medium text-suave">· {n}</span></h2>
      <p className="text-xs text-suave">{sub}</p>
    </div>
  );
}
const Lista = ({ children }: { children: React.ReactNode }) => <ul className="divide-y overflow-hidden rounded-2xl border bg-cartao">{children}</ul>;

const inp = "h-11 w-full rounded-xl border bg-papel/50 px-3 text-sm outline-none focus:border-folha focus:ring-3 focus:ring-folha/20";
function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1 block text-xs font-medium text-suave">{rotulo}</span>{children}</label>;
}
