import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { gruposAutorizados, pesquisadores as tabela, pesquisadoresAutorizados } from "../database/schema";
import { auditarLeitura, definirContexto, limparContexto } from "../database/seguranca";
import { authed, coordenacao } from "../middleware/auth";

const texto = (max = 300) => z.string().trim().max(max);
const campos = z.object({
  nome: texto(200).min(2, "Informe o nome."),
  grupo: z.number().int().nullable(),
  monitores: texto(),
  celular: texto(40),
  email: z.union([z.literal(""), z.string().trim().email("E-mail inválido.")]),
  endereco: texto(),
  cidade: texto(120),
  estado: texto(40),
  cep: texto(20),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  sexo: texto(60),
  escolaridade: texto(120),
  formacao: texto(),
  atuacaoProfissional: texto(),
  atuacaoLocal: texto(),
  esfera: texto(120),
  profissionalSaude: z.boolean(),
  observacao: texto(500),
});

// As leituras passam pelas views de política do banco: é o próprio banco que decide quais linhas
// o usuário da sessão pode ver (coordenação: todas; monitor: só o seu grupo).
export const pesquisadores = {
  list: authed.handler(async ({ context }) => {
    const [, linhas] = await db.batch([
      definirContexto(context.user),
      db.select().from(pesquisadoresAutorizados).orderBy(asc(pesquisadoresAutorizados.nome)),
      auditarLeitura("listar_pesquisadores", "vw_pesquisadores_autorizados"),
      limparContexto(),
    ]);
    return linhas;
  }),
  grupos: authed.handler(async ({ context }) => {
    const [, linhas] = await db.batch([
      definirContexto(context.user),
      db.select().from(gruposAutorizados).orderBy(asc(gruposAutorizados.numero)),
      limparContexto(),
    ]);
    return linhas.map((g) => ({ numero: g.numero!, regioes: g.regioes }));
  }),
  /** Editar cadastro — só coordenação (o banco também bloqueia monitor, ver trg_pesq_upd_coord). */
  update: coordenacao
    .input(z.object({ id: z.number().int() }).and(campos))
    .handler(async ({ input, context }) => {
      const { id, ...dados } = input;
      const [, linhas] = await db
        .batch([definirContexto(context.user), db.update(tabela).set(dados).where(eq(tabela.id, id)).returning(), limparContexto()])
        .catch((e: unknown) => {
          const msg = `${(e as Error)?.message ?? e} ${(e as { cause?: Error })?.cause?.message ?? ""}`;
          throw new ORPCError("BAD_REQUEST", { message: msg.includes("Grupo inexistente") ? "Esse grupo não existe." : "Não foi possível salvar." });
        });
      if (!linhas[0]) throw new ORPCError("NOT_FOUND", { message: "Pesquisador não encontrado." });
      return linhas[0];
    }),
};
