import { HeartPulse, MapPin, MapPinOff } from "lucide-react";
import { Link } from "wouter";
import { corGrupo, iniciais, nomeGrupo, type Pesquisador } from "../lib/pesquisadores";
import { BotoesContato } from "./contato";

export function PessoaLinha({ p, mostrarGrupo = true }: { p: Pesquisador; mostrarGrupo?: boolean }) {
  const cor = corGrupo(p.grupo);
  return (
    <div className="group flex flex-col gap-3 rounded-2xl border bg-cartao p-3.5 transition hover:border-folha/50 hover:shadow-[0_8px_24px_-14px_rgb(31_74_44/.4)] md:flex-row md:items-center">
      <Link href={`/pesquisadores/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl font-display text-sm font-bold text-white"
          style={{ background: cor }}
        >
          {iniciais(p.nome)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-tinta group-hover:text-floresta">{p.nome}</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-suave">
            {mostrarGrupo && (
              <span className="font-semibold" style={{ color: cor }}>{nomeGrupo(p.grupo)}</span>
            )}
            <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.cidade}</span>
            <span>{p.celular}</span>
            {(p.latitude == null || p.longitude == null) && (
              <span className="inline-flex items-center gap-1 text-[#9a6a00]"><MapPinOff className="h-3 w-3" />Sem mapa</span>
            )}
            {p.profissionalSaude && (
              <span className="inline-flex items-center gap-1 text-alerta"><HeartPulse className="h-3 w-3" />Saúde</span>
            )}
          </span>
        </span>
      </Link>
      <div className="md:w-56"><BotoesContato p={p} compacto /></div>
    </div>
  );
}
