/** Registra o service worker (necessário para "Adicionar à tela inicial"). Ele não guarda dados em cache. */
export function registrarPwa() {
  if (!("serviceWorker" in navigator) || import.meta.env.DEV) return;
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}
