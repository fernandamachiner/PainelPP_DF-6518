import { useQueryClient } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { Redirect } from "wouter";
import { authClient, clearToken } from "../lib/auth";
import { limparAtividade } from "../hooks/use-inatividade";
import { useAceitarPrivacidade, useEu } from "../queries/acessos";
import { AceitePrivacidade } from "./privacidade";
import { Carregando } from "./estado";
import { Layout } from "./layout";

export function Protegido({ children, soCoordenacao }: { children: React.ReactNode; soCoordenacao?: boolean }) {
  const { data: session, isPending } = authClient.useSession();
  const eu = useEu(!!session);
  const qc = useQueryClient();
  const aceitar = useAceitarPrivacidade();
  const sair = async () => { await authClient.signOut().catch(() => {}); clearToken(); limparAtividade(); qc.clear(); location.href = "/entrar"; };
  if (isPending || (session && eu.isPending)) return <div className="bg-organico min-h-screen"><Carregando /></div>;
  if (!session) return <Redirect to="/entrar" />;
  if (eu.isError || !eu.data) {
    return (
      <div className="bg-organico grid min-h-screen place-items-center p-6">
        <div className="max-w-sm rounded-2xl border bg-cartao p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-alerta" />
          <h1 className="mt-3 font-display text-xl font-bold text-floresta">Acesso indisponível</h1>
          <p className="mt-1 text-sm text-suave">{eu.error?.message || "Seu acesso não está liberado."}</p>
          <button onClick={sair}
            className="mt-4 h-11 w-full rounded-xl bg-floresta text-sm font-semibold text-white">Sair</button>
        </div>
      </div>
    );
  }
  if (!eu.data.aceitePrivacidade) return <AceitePrivacidade nome={eu.data.nome} onAceitar={() => aceitar.mutateAsync({})} onSair={sair} />;
  if (soCoordenacao && eu.data.papel !== "coordenacao") return <Redirect to="/" />;
  return <Layout eu={eu.data}>{children}</Layout>;
}
