import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, Loader2, MailCheck } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { AvisoLogin } from "../components/privacidade";
import { marcarAtividade } from "../hooks/use-inatividade";
import { authClient } from "../lib/auth";
import { useOpcoes } from "../queries/acessos";
import { cn } from "../lib/utils";

export default function Entrar() {
  const [modo, setModo] = useState<"entrar" | "criar" | "esqueci">("entrar");
  const [enviado, setEnviado] = useState(false);
  const { data: opcoes } = useOpcoes();
  const [inatividade] = useState(() => sessionStorage.getItem("ppi_motivo_saida") === "inatividade");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [, navegar] = useLocation();
  const qc = useQueryClient();
  const { data: session } = authClient.useSession();
  if (session) return <Redirect to="/" />;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    if (modo === "esqueci") {
      const r = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: `${location.origin}/redefinir-senha` });
      setEnviando(false);
      if (r.error) return setErro("Não foi possível enviar agora. Tente de novo em alguns minutos.");
      setEnviado(true);
      return;
    }
    const r = modo === "entrar"
      ? await authClient.signIn.email({ email: email.trim(), password: senha })
      : await authClient.signUp.email({ email: email.trim(), password: senha, name: nome.trim() || email.split("@")[0] });
    setEnviando(false);
    if (r.error) {
      const m = r.error.message ?? "";
      setErro(
        r.error.status === 401 || /invalid/i.test(m) ? "E-mail ou senha incorretos."
        : /already exists|existe/i.test(m) ? "Já existe uma conta com esse e-mail. Use “Entrar”."
        : /password.*short|too short/i.test(m) ? "A senha precisa ter pelo menos 8 caracteres."
        : m || "Não foi possível continuar. Tente novamente.",
      );
      return;
    }
    marcarAtividade();
    sessionStorage.removeItem("ppi_motivo_saida");
    qc.clear();
    navegar("/");
  }

  return (
    <div className="bg-organico grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden flex-col overflow-hidden bg-[#dfe6c0] lg:flex">
        <div className="flex flex-1 items-center justify-center p-10 xl:p-14">
          <motion.img
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}
            src="/images/ilustracao-hd.webp" alt="Pessoas sustentando juntas o planeta, com casas coloridas da comunidade no topo"
            className="w-full max-w-[860px] rounded-[28px] shadow-[0_24px_60px_-20px_rgba(30,60,30,0.45)] ring-1 ring-black/5"
          />
        </div>
        <div className="bg-floresta px-10 py-9 text-white xl:px-14">
          <p className="text-xs uppercase tracking-[0.2em] text-white/65">Distrito Federal</p>
          <h2 className="mt-2 max-w-xl font-display text-[34px] font-extrabold leading-[1.08] xl:text-4xl">
            Pesquisadores Populares Interseccionais em Ciência, Bioeconomia e Inovação Digital
          </h2>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-sm">
          <img src="/images/logo.png" alt="Logo do projeto" className="mx-auto h-28 w-auto lg:mx-0" />
          <h1 className="mt-5 text-center font-display text-3xl font-extrabold text-floresta lg:text-left">Painel de acompanhamento</h1>
          <p className="mt-2 text-center font-display text-lg font-bold leading-snug text-floresta/80 lg:hidden">
            Pesquisadores Populares Interseccionais em Ciência, Bioeconomia e Inovação Digital
          </p>
          <p className="mt-1 text-center text-sm text-suave lg:text-left">Acesso restrito à coordenação e monitores.</p>

          {inatividade && modo !== "esqueci" && (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-limao/70 px-3 py-2.5 text-sm text-floresta">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" /> Você saiu automaticamente depois de 30 minutos sem usar o painel. Entre de novo para continuar.
            </p>
          )}

          {modo === "esqueci" ? (
            <div className="mt-6">
              <button type="button" onClick={() => { setModo("entrar"); setErro(""); setEnviado(false); }} className="mb-3 inline-flex items-center gap-1 text-sm text-suave hover:text-floresta">
                <ArrowLeft className="h-4 w-4" /> Voltar para o login
              </button>
              <h2 className="font-display text-xl font-bold text-floresta">Esqueci minha senha</h2>
              {opcoes && !opcoes.emailAtivo ? (
                <p className="mt-2 rounded-xl border bg-cartao p-4 text-sm leading-relaxed text-suave">
                  Peça à <b className="text-tinta">coordenação</b> um link para criar uma nova senha. Ela gera o link no painel
                  (tela <b className="text-tinta">Acessos</b>) e envia para você por WhatsApp. O link vale por 24 horas.
                </p>
              ) : enviado ? (
                <p className="mt-3 flex gap-2 rounded-xl border bg-cartao p-4 text-sm leading-relaxed text-suave">
                  <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-folha" />
                  <span>Se <b className="text-tinta">{email.trim()}</b> tiver uma conta, você vai receber um e-mail com o link para criar uma nova senha. Veja também a caixa de spam. O link vale por 1 hora.</span>
                </p>
              ) : (
                <form onSubmit={enviar} className="mt-3 space-y-3">
                  <p className="text-sm text-suave">Digite seu e-mail. Vamos enviar um link para você criar uma nova senha.</p>
                  <Campo rotulo="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" required />
                  {erro && <p className="rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta">{erro}</p>}
                  <button disabled={enviando} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-floresta font-semibold text-white transition hover:bg-floresta-2 disabled:opacity-60">
                    {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Enviar link
                  </button>
                  <p className="text-xs text-suave">Não recebeu? A coordenação também pode gerar o link para você.</p>
                </form>
              )}
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 rounded-xl bg-limao/70 p-1 text-sm">
                {(["entrar", "criar"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => { setModo(m); setErro(""); }}
                    className={cn("rounded-lg py-2 font-medium transition", modo === m ? "bg-cartao text-floresta shadow-sm" : "text-suave")}>
                    {m === "entrar" ? "Entrar" : "Primeiro acesso"}
                  </button>
                ))}
              </div>

              <form onSubmit={enviar} className="mt-5 space-y-3">
                {modo === "criar" && <Campo rotulo="Seu nome" value={nome} onChange={setNome} autoComplete="name" />}
                <Campo rotulo="E-mail" type="email" value={email} onChange={setEmail} autoComplete="email" required />
                <Campo rotulo="Senha" type="password" value={senha} onChange={setSenha} autoComplete={modo === "entrar" ? "current-password" : "new-password"} required minLength={8} />
                {modo === "entrar" && (
                  <div className="-mt-1 text-right">
                    <button type="button" onClick={() => { setModo("esqueci"); setErro(""); setEnviado(false); }} className="text-sm font-medium text-floresta hover:underline">
                      Esqueci minha senha
                    </button>
                  </div>
                )}
                {erro && <p className="rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta">{erro}</p>}
                <button disabled={enviando} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-floresta font-semibold text-white transition hover:bg-floresta-2 disabled:opacity-60">
                  {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                  {modo === "entrar" ? "Entrar" : "Criar minha senha"}
                </button>
              </form>
              {modo === "criar" && <p className="mt-3 text-xs text-suave">Só é possível criar a senha com um e-mail liberado pela coordenação.</p>}
            </>
          )}

          <AvisoLogin />
        </motion.div>
      </section>
    </div>
  );
}

function Campo({ rotulo, onChange, ...props }: { rotulo: string; onChange: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange">) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-suave">{rotulo}</span>
      <input {...props} onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full rounded-xl border bg-cartao px-3.5 text-[15px] outline-none transition focus:border-folha focus:ring-3 focus:ring-folha/20" />
    </label>
  );
}
