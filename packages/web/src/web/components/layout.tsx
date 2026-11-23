import { useQueryClient } from "@tanstack/react-query";
import { Clock, KeyRound, LayoutDashboard, LogOut, Map, Users, UsersRound } from "lucide-react";
import { Link, useLocation } from "wouter";
import { authClient, clearToken } from "../lib/auth";
import { cn } from "../lib/utils";
import { limparAtividade, useInatividade } from "../hooks/use-inatividade";

interface Eu { nome: string; email: string; papel: "coordenacao" | "monitor"; grupo: number | null }

export function Layout({ eu, children }: { eu: Eu; children: React.ReactNode }) {
  const [local, navegar] = useLocation();
  const qc = useQueryClient();
  const itens = [
    { href: "/", rotulo: "Visão geral", Icone: LayoutDashboard },
    { href: "/mapa", rotulo: "Mapa", Icone: Map },
    eu.papel === "coordenacao"
      ? { href: "/grupos", rotulo: "Grupos", Icone: UsersRound }
      : { href: `/grupos/${eu.grupo}`, rotulo: "Meu grupo", Icone: UsersRound },
    ...(eu.papel === "coordenacao"
      ? [
          { href: "/pesquisadores", rotulo: "Pesquisadores", Icone: Users },
          { href: "/acessos", rotulo: "Acessos", Icone: KeyRound },
        ]
      : []),
  ];
  const ativo = (h: string) =>
    h === "/" ? local === "/" : local.startsWith(h) || (eu.papel === "monitor" && h.startsWith("/grupos") && local.startsWith("/pesquisadores"));
  async function sair(motivo?: "inatividade") {
    if (motivo) sessionStorage.setItem("ppi_motivo_saida", motivo);
    await authClient.signOut().catch(() => {});
    clearToken();
    limparAtividade();
    qc.clear();
    navegar("/entrar");
  }
  const { restante, continuar } = useInatividade(() => sair("inatividade"));

  return (
    <div className="bg-organico min-h-screen">
      {/* Barra lateral (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-floresta text-white lg:flex">
        <div className="px-5 pt-6 pb-5">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-cartao p-1.5">
            <img src="/images/logo.png" alt="" className="h-full w-full object-contain" />
          </span>
          <p className="mt-3 font-display text-[15px] font-bold leading-snug">
            Pesquisadores Populares Interseccionais em Ciência, Bioeconomia e Inovação Digital
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {itens.map(({ href, rotulo, Icone }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                ativo(href) ? "bg-white text-floresta font-semibold" : "text-white/80 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icone className="h-4 w-4" /> {rotulo}
            </Link>
          ))}
        </nav>
        <div className="mx-3 mb-4 rounded-xl bg-white/8 p-3">
          <p className="truncate text-sm font-medium">{eu.nome}</p>
          <p className="truncate text-xs text-white/60">{eu.papel === "coordenacao" ? "Coordenação" : `Monitor(a) · Grupo ${eu.grupo}`} · {eu.email}</p>
          <button onClick={() => sair()} className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white">
            <LogOut className="h-3.5 w-3.5" /> Sair
          </button>
        </div>
      </aside>

      {/* Cabeçalho (celular) */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b bg-papel/90 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <img src="/images/logo.png" alt="" className="h-9 w-9 object-contain" />
          <span className="line-clamp-2 font-display text-[12px] font-bold leading-tight text-floresta">Pesquisadores Populares Interseccionais em Ciência, Bioeconomia e Inovação Digital</span>
        </Link>
        <button onClick={() => sair()} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-suave hover:bg-limao" aria-label="Sair">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </header>

      {restante != null && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-cartao p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-limao text-floresta"><Clock className="h-6 w-6" /></span>
            <h2 className="mt-3 font-display text-xl font-extrabold text-floresta">Ainda está aí?</h2>
            <p className="mt-1 text-sm text-suave">
              Por segurança, você vai sair em <b className="text-tinta">{Math.floor(restante / 60)}:{String(restante % 60).padStart(2, "0")}</b> por falta de uso.
            </p>
            <div className="mt-5 grid gap-2">
              <button onClick={continuar} className="h-12 rounded-xl bg-floresta text-sm font-semibold text-white hover:bg-floresta-2">Continuar usando</button>
              <button onClick={() => sair()} className="h-11 rounded-xl text-sm text-suave hover:bg-papel">Sair agora</button>
            </div>
          </div>
        </div>
      )}

      <main className="px-4 pt-5 pb-28 md:px-8 lg:ml-64 lg:px-10 lg:pt-10 lg:pb-12">{children}</main>

      {/* Navegação inferior (celular) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-cartao/95 px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        {itens.map(({ href, rotulo, Icone }) => (
          <Link key={href} href={href} className={cn("flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1 text-[10px]", ativo(href) ? "text-floresta font-semibold" : "text-suave")}>
            <span className={cn("grid h-7 w-12 place-items-center rounded-full transition", ativo(href) && "bg-limao")}>
              <Icone className="h-[18px] w-[18px]" />
            </span>
            {rotulo}
          </Link>
        ))}
      </nav>
    </div>
  );
}
