import { ORPCError } from "@orpc/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { registrosAutorizados, registrosContato as tabela } from "../database/schema";
import { definirContexto, limparContexto } from "../database/seguranca";
import { authed } from "../middleware/auth";

// Registro de contato: histórico de ligações/visitas/observações sobre cada pesquisador.
// Leitura pela view de política (só pesquisadores visíveis para a sessão); triggers barram o resto.
export const registros = {
  list: authed.input(z.object({ pesquisadorId: z.number().int() })).handler(async ({ input, context }) => {
    const [, linhas] = await db.batch([
      definirContexto(context.user),
      db.select().from(registrosAutorizados).where(eq(registrosAutorizados.pesquisadorId, input.pesquisadorId)).orderBy(desc(registrosAutorizados.quando), desc(registrosAutorizados.id)),
      limparContexto(),
    ]);
    return linhas;
  }),
  add: authed
    .input(
      z.object({
        pesquisadorId: z.number().int(),
        tipo: z.enum(["ligacao", "whatsapp", "email", "visita", "observacao"]),
        resultado: z.enum(["atendeu", "nao_atendeu", "retornar", ""]).default(""),
        texto: z.string().trim().max(2000).default(""),
      }),
    )
    .handler(async ({ input, context }) => {
      if (!input.texto && !input.resultado) throw new ORPCError("BAD_REQUEST", { message: "Escreva uma observação ou marque o resultado." });
      const [, linhas] = await db
        .batch([
          definirContexto(context.user),
          db.insert(tabela).values({ ...input, autorEmail: context.user.email.toLowerCase(), autorNome: context.user.name, quando: new Date() }).returning(),
          limparContexto(),
        ])
        .catch(() => {
          throw new ORPCError("FORBIDDEN", { message: "Você não pode registrar contato para esse pesquisador." });
        });
      return linhas[0];
    }),
  remove: authed.input(z.object({ id: z.number().int() })).handler(async ({ input, context }) => {
    const [, linhas] = await db
      .batch([definirContexto(context.user), db.delete(tabela).where(eq(tabela.id, input.id)).returning({ id: tabela.id }), limparContexto()])
      .catch(() => {
        throw new ORPCError("FORBIDDEN", { message: "Só quem escreveu ou a coordenação pode apagar." });
      });
    if (!linhas[0]) throw new ORPCError("NOT_FOUND");
    return { ok: true };
  }),
};
