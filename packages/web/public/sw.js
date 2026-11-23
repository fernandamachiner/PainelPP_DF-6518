// Service worker mínimo: permite instalar o painel na tela do celular.
// Não guarda nada em cache: os dados são pessoais (LGPD) e sempre vêm do servidor.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
