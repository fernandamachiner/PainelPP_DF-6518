import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { authClient, clearToken } from "../lib/auth";

export default function RedefinirSenha() {
  const params = new URLSearchParams(location.search);
  const token = params.get("token") ?? "";
  const linkInvalido = !token || params.get("error") === "INVALID_TOKEN";
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (senha.length < 8) return setErro("A senha precisa ter pelo menos 8 caracteres.");
    if (senha !== confirma) return setErro("As duas senhas não são iguais.");
    setEnviando(true);
    const r = await authClient.resetPassword({ newPassword: senha, token });
    setEnviando(false);
    if (r.error) {
      setErro(/token/i.test(r.error.message ?? "") || r.error.status === 400 ? "Este link já foi usado ou venceu. Peça um novo." : "Não foi possível salvar. Tente de novo.");
      return;
    }
    clearToken();
    setPronto(true);
  }

  return (
    <div className="bg-organico grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-sm rounded-3xl border bg-cartao p-6 md:p-8">
        <img src="/images/logo.png" alt="" className="h-16 w-auto" />
        {pronto ? (
          <>
            <CheckCircle2 className="mt-5 h-8 w-8 text-folha" />
            <h1 className="mt-2 font-display text-2xl font-extrabold text-floresta">Senha alterada</h1>
            <p className="mt-1 text-sm text-suave">Pronto! Agora entre com a sua nova senha.</p>
            <Link href="/entrar" className="mt-5 flex h-12 items-center justify-center rounded-xl bg-floresta text-sm font-semibold text-white hover:bg-floresta-2">Ir para o login</Link>
          </>
        ) : linkInvalido ? (
          <>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-floresta">Link inválido</h1>
            <p className="mt-1 text-sm text-suave">Este link já foi usado ou venceu. Peça um novo em “Esqueci minha senha” ou à coordenação.</p>
            <Link href="/entrar" className="mt-5 flex h-12 items-center justify-center rounded-xl bg-floresta text-sm font-semibold text-white hover:bg-floresta-2">Voltar para o login</Link>
          </>
        ) : (
          <form onSubmit={enviar}>
            <h1 className="mt-5 flex items-center gap-2 font-display text-2xl font-extrabold text-floresta"><KeyRound className="h-6 w-6" /> Nova senha</h1>
            <p className="mt-1 text-sm text-suave">Crie uma senha com pelo menos 8 caracteres.</p>
            <div className="mt-5 space-y-3">
              {[["Nova senha", senha, setSenha], ["Repita a nova senha", confirma, setConfirma]].map(([rotulo, v, set]) => (
                <label key={rotulo as string} className="block">
                  <span className="mb-1 block text-xs font-medium text-suave">{rotulo as string}</span>
                  <input aria-label={rotulo as string} type="password" autoComplete="new-password" required minLength={8} value={v as string}
                    onChange={(e) => (set as (s: string) => void)(e.target.value)}
                    className="h-12 w-full rounded-xl border bg-cartao px-3.5 text-[15px] outline-none transition focus:border-folha focus:ring-3 focus:ring-folha/20" />
                </label>
              ))}
              {erro && <p className="rounded-lg bg-alerta/10 px-3 py-2 text-sm text-alerta">{erro}</p>}
              <button disabled={enviando} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-floresta font-semibold text-white hover:bg-floresta-2 disabled:opacity-60">
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />} Salvar nova senha
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
