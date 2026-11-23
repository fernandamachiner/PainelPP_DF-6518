import { Loader2, LogOut, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Modal } from "./modal";

/** Texto do aviso de privacidade (LGPD). Curto e direto. */
export function TextoPrivacidade() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-tinta">
      <p>
        Este painel reúne <b>dados pessoais</b> dos pesquisadores e pesquisadoras populares do projeto: nome, telefone, e-mail,
        endereço, localização, escolaridade, ocupação e dados de atuação. Eles são tratados com base na Lei Geral de Proteção de
        Dados (LGPD, Lei nº 13.709/2018).
      </p>
      <ul className="list-disc space-y-1.5 pl-5">
        <li><b>Para que servem:</b> só para acompanhar e manter contato com as pessoas participantes do projeto.</li>
        <li><b>Quem vê:</b> a coordenação vê todos os dados. Cada monitor(a) vê apenas as pessoas do seu grupo.</li>
        <li><b>Registro de uso:</b> entradas, consultas, exportações e alterações ficam gravadas na auditoria, com nome, data e hora.</li>
        <li><b>Seu compromisso:</b> não compartilhar, copiar ou divulgar esses dados fora do projeto. Planilhas baixadas devem ser
          guardadas com cuidado e apagadas quando não forem mais necessárias.</li>
        <li><b>Direitos das pessoas:</b> quem estiver no cadastro pode pedir à coordenação para ver, corrigir ou remover seus dados.</li>
      </ul>
    </div>
  );
}

/** Aviso curto no login + botão para ler o texto completo. */
export function AvisoLogin() {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <p className="mt-4 flex gap-2 rounded-xl border bg-cartao p-3 text-xs leading-relaxed text-suave">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-folha" />
        <span>
          Este painel tem dados pessoais protegidos pela LGPD. O acesso é registrado e os dados só podem ser usados no projeto.{" "}
          <button type="button" onClick={() => setAberto(true)} className="font-semibold text-floresta underline underline-offset-2">Ler o aviso de privacidade</button>
        </span>
      </p>
      {aberto && (
        <Modal onFechar={() => setAberto(false)} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-cartao p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold text-floresta">Aviso de privacidade</h2>
              <button onClick={() => setAberto(false)} className="rounded-lg p-1.5 text-suave hover:bg-papel" aria-label="Fechar"><X className="h-5 w-5" /></button>
            </div>
            <TextoPrivacidade />
        </Modal>
      )}
    </>
  );
}

/** Tela obrigatória no primeiro acesso: só entra no painel depois de aceitar. */
export function AceitePrivacidade({ nome, onAceitar, onSair }: { nome: string; onAceitar: () => Promise<unknown>; onSair: () => void }) {
  const [marcado, setMarcado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  async function aceitar() {
    setEnviando(true);
    setErro("");
    try { await onAceitar(); } catch (e) { setErro((e as Error).message || "Não foi possível registrar. Tente de novo."); }
    setEnviando(false);
  }
  return (
    <div className="bg-organico grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-xl rounded-3xl border bg-cartao p-6 md:p-8">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-limao text-floresta"><ShieldCheck className="h-6 w-6" /></span>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-floresta">Antes de começar{nome ? `, ${nome.split(" ")[0]}` : ""}</h1>
        <p className="mt-1 text-sm text-suave">Leia o aviso de privacidade. Ele só aparece no primeiro acesso.</p>
        <div className="mt-5 rounded-2xl bg-papel p-4"><TextoPrivacidade /></div>
        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
          <input type="checkbox" aria-label="Li e concordo" checked={marcado} onChange={(e) => setMarcado(e.target.checked)} className="mt-0.5 h-5 w-5 accent-[var(--color-floresta)]" />
          <span>Li e concordo. Vou usar os dados só para o projeto e não vou compartilhá-los.</span>
        </label>
        {erro && <p className="mt-3 rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta">{erro}</p>}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onSair} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm text-suave hover:bg-papel"><LogOut className="h-4 w-4" /> Sair</button>
          <button disabled={!marcado || enviando} onClick={aceitar}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-floresta px-6 text-sm font-semibold text-white hover:bg-floresta-2 disabled:opacity-50">
            {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Aceitar e entrar
          </button>
        </div>
      </div>
    </div>
  );
}
