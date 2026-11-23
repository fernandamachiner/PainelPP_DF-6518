import { cn } from "../lib/utils";

/** Ícone de casinha na cor do grupo — referência às casas da ilustração. */
export function Casinha({ cor, rotulo, className }: { cor: string; rotulo?: string; className?: string }) {
  return (
    <span className={cn("relative inline-flex shrink-0 items-end justify-center", className ?? "h-10 w-9")}>
      <svg viewBox="0 0 36 40" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d="M2 16 L18 3 L34 16 V38 H2 Z" fill={cor} />
        <path d="M0 17 L18 2 L36 17" stroke="#1b2a1f" strokeOpacity=".18" strokeWidth="2" fill="none" />
      </svg>
      {rotulo && (
        <span className="relative mb-[18%] font-display text-[0.95em] font-extrabold leading-none text-white">{rotulo}</span>
      )}
    </span>
  );
}
