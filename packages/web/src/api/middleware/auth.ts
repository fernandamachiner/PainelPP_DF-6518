import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { base } from "../__core/app";
import { auth } from "../auth";
import { db } from "../database";
import { acessos } from "../database/schema";
import { garantirSeguranca } from "../database/seguranca";

/** Usuário logado E com e-mail liberado. */
export const authed = base.use(async ({ context, next }) => {
  await garantirSeguranca();
  const session = await auth.api.getSession({ headers: context.headers });
  if (!session) throw new ORPCError("UNAUTHORIZED");
  const [acesso] = await db.select().from(acessos).where(eq(acessos.email, session.user.email.toLowerCase()));
  if (!acesso) throw new ORPCError("FORBIDDEN", { message: "Acesso removido pela coordenação." });
  if (acesso.papel === "monitor" && acesso.grupo == null)
    throw new ORPCError("FORBIDDEN", { message: "Seu acesso ainda não tem um grupo definido. Fale com a coordenação." });
  return next({ context: { user: session.user, papel: acesso.papel, grupo: acesso.grupo } });
});

export const coordenacao = authed.use(async ({ context, next }) => {
  if (context.papel !== "coordenacao") throw new ORPCError("FORBIDDEN", { message: "Apenas a coordenação." });
  return next();
});
