import { useEffect } from "react";

/** Janela sobreposta. Clicar fora ou apertar Esc fecha. */
export function Modal({ onFechar, children, className = "", baixo }: { onFechar?: () => void; children: React.ReactNode; className?: string; baixo?: boolean }) {
  useEffect(() => {
    if (!onFechar) return;
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onFechar]);
  return (
    <div className={`fixed inset-0 z-50 flex justify-center ${baixo ? "items-end sm:items-center sm:p-4" : "items-center p-4"}`}>
      <button type="button" aria-label="Fechar" tabIndex={-1} onClick={onFechar} className="absolute inset-0 cursor-default bg-black/40" />
      <div aria-modal="true" className={`relative ${className}`}>{children}</div>
    </div>
  );
}
