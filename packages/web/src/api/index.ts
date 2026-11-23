import type { RouterClient } from "@orpc/server";
import { createApp } from "./__core/app";
import { auth } from "./auth";
import { acessos } from "./routes/acessos";
import { auditoria } from "./routes/auditoria";
import { ping } from "./routes/ping";
import { pesquisadores } from "./routes/pesquisadores";
import { registros } from "./routes/registros";

export const router = {
  ping,
  pesquisadores,
  acessos,
  auditoria,
  registros,
};

export type AppRouter = typeof router;
export type AppRouterClient = RouterClient<AppRouter>;

const app = createApp(router);
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

export default app;
