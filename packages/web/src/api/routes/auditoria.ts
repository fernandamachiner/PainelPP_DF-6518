import { desc } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { auditoria as tabela } from "../database/schema";
import { auditarEvento, definirContexto, limparContexto } from "../database/seguranca";
import { authed, coordenacao } from "../middleware/auth";

export const auditoria = {
  list: coordenacao
    .input(z.object({ limite: z.number().int().min(1).max(1000).default(300) }).default({ limite: 300 }))
    .handler(({ input }) => db.select().from(tabela).orderBy(desc(tabela.id)).limit(input.limite)),
  /** Registra que a pessoa baixou uma planilha. */
  exportacao: authed
    .input(z.object({ arquivo: z.string().max(200), registros: z.number().int().min(0) }))
    .handler(async ({ input, context }) => {
      await db.batch([definirContexto(context.user), auditarEvento("exportacao", input.arquivo, input.registros), limparContexto()]);
      return { ok: true };
    }),
};
