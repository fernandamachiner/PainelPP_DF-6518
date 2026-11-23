import { useEffect, useRef, useState } from "react";

const CHAVE = "ppi_ultima_atividade";
export const LIMITE_INATIVIDADE = 30 * 60_000; // 30 minutos
const AVISO_ANTES = 2 * 60_000; // avisa 2 min antes
const EVENTOS = ["pointerdown", "keydown", "touchstart", "wheel", "scroll", "mousemove"] as const;

const marcar = () => localStorage.setItem(CHAVE, String(Date.now()));
const ultima = () => Number(localStorage.getItem(CHAVE)) || Date.now();
/** Chamar ao entrar (zera o relógio) e ao sair. */
export const marcarAtividade = marcar;
export const limparAtividade = () => localStorage.removeItem(CHAVE);

/** Sai sozinho depois de 30 min sem uso (vale para todas as abas abertas). Devolve os segundos restantes quando falta pouco. */
export function useInatividade(aoExpirar: () => void) {
  const [restante, setRestante] = useState<number | null>(null);
  const expirou = useRef(false);
  const cb = useRef(aoExpirar);
  cb.current = aoExpirar;

  useEffect(() => {
    // se o app foi reaberto depois de muito tempo parado (ex.: celular bloqueado), sai na hora
    if (!localStorage.getItem(CHAVE)) marcar();
    let t = 0;
    const atividade = () => {
      const agora = Date.now();
      if (agora - t > 5_000) { t = agora; marcar(); } // grava no máximo a cada 5s
    };
    const verificar = () => {
      if (expirou.current) return;
      const falta = LIMITE_INATIVIDADE - (Date.now() - ultima());
      if (falta <= 0) { expirou.current = true; setRestante(null); cb.current(); return; }
      setRestante(falta <= AVISO_ANTES ? Math.ceil(falta / 1000) : null);
    };
    for (const e of EVENTOS) window.addEventListener(e, atividade, { passive: true });
    document.addEventListener("visibilitychange", verificar);
    const id = window.setInterval(verificar, 1000);
    verificar();
    return () => {
      for (const e of EVENTOS) window.removeEventListener(e, atividade);
      document.removeEventListener("visibilitychange", verificar);
      window.clearInterval(id);
    };
  }, []);

  return { restante, continuar: () => { marcar(); setRestante(null); } };
}
