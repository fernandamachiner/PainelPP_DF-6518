import { Mail, MapPinned, MessageCircle, Phone } from "lucide-react";
import { cn } from "../lib/utils";
import { linkEmail, linkRota, linkTel, linkWhats, type Pesquisador } from "../lib/pesquisadores";

const acoes = (p: Pesquisador) => [
  { rotulo: "Ligar", href: linkTel(p.celular), Icone: Phone, cor: "bg-floresta text-white hover:bg-floresta-2", ok: !!p.celular },
  { rotulo: "WhatsApp", href: linkWhats(p.celular, p.nome), Icone: MessageCircle, cor: "bg-[#25D366] text-[#0b3d1f] hover:brightness-95", ok: !!p.celular },
  { rotulo: "E-mail", href: linkEmail(p.email), Icone: Mail, cor: "bg-globo/20 text-[#1d5a75] hover:bg-globo/30", ok: !!p.email },
  { rotulo: "Rota", href: linkRota(p), Icone: MapPinned, cor: "bg-[#EFA92A]/25 text-[#7a4f00] hover:bg-[#EFA92A]/35", ok: true },
];

export function BotoesContato({ p, compacto }: { p: Pesquisador; compacto?: boolean }) {
  return (
    <div className={cn("grid gap-2", compacto ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
      {acoes(p).filter((a) => a.ok).map(({ rotulo, href, Icone, cor }) => (
        <a
          key={rotulo}
          href={href}
          target={href.startsWith("http") ? "_blank" : undefined}
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={rotulo}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition",
            compacto ? "h-10 text-[0]" : "h-12 text-sm",
            cor,
          )}
        >
          <Icone className="h-4 w-4 shrink-0" />
          {!compacto && rotulo}
        </a>
      ))}
    </div>
  );
}
