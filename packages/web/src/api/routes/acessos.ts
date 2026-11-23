import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../database";
import { acessos as tabela } from "../database/schema";
import { auditarEvento, definirContexto, limparContexto } from "../database/seguranca";
import { base } from "../__core/app";
import { auth, origemSite } from "../auth";
import { user as usuarios } from "../database/schema";
import { authed, coordenacao } from "../middleware/auth";
import { emailConfigurado } from "../services/email";

/** Erro de trigger do banco -> mensagem amigável. */
function erroBanco(e: unknown): never {
  const err = e as { message?: string; cause?: { message?: string } };
  const msg = `${err?.message ?? e} ${err?.cause?.message ?? ""}`;
  const m = msg.match(/(Apenas a coordenação[^\n]*|Monitor precisa[^\n]*|É preciso manter[^\n]*)/);
  throw new ORPCError("BAD_REQUEST", { message: m ? m[1]!.replace(/['"]+$/, "") : "Não foi possível salvar." });
}

const dados = z
  .object({
    nome: z.string().default(""),
    papel: z.enum(["coordenacao", "monitor"]),
    grupo: z.number().int().nullable().default(null),
  })
  .refine((d) => d.papel === "coordenacao" || d.grupo != null, { message: "Escolha o grupo do(a) monitor(a).", path: ["grupo"] });

export const acessos = {
  /** Público: o que a tela de login precisa saber. */
  opcoes: base.handler(() => ({ emailAtivo: emailConfigurado() })),
  eu: authed.handler(async ({ context }) => {
    const [acesso] = await db.select({ aceite: tabela.aceitePrivacidade }).from(tabela).where(eq(tabela.email, context.user.email.toLowerCase()));
    return {
      nome: context.user.name,
      email: context.user.email,
      papel: context.papel,
      grupo: context.grupo,
      aceitePrivacidade: acesso?.aceite ?? null,
    };
  }),
  /** A própria pessoa registra que leu e aceitou o aviso de privacidade (LGPD). */
  aceitarPrivacidade: authed.handler(async ({ context }) => {
    const agora = new Date();
    await db
      .batch([
        definirContexto(context.user),
        db.update(tabela).set({ aceitePrivacidade: agora }).where(eq(tabela.email, context.user.email.toLowerCase())),
        limparContexto(),
      ])
      .catch(erroBanco);
    return { aceitePrivacidade: agora };
  }),
  /** Coordenação gera um link de redefinição de senha (para mandar por WhatsApp, por exemplo). Vale 24h. */
  linkSenha: coordenacao
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const [acesso] = await db.select().from(tabela).where(eq(tabela.id, input.id));
      if (!acesso) throw new ORPCError("NOT_FOUND");
      const [conta] = await db.select().from(usuarios).where(eq(usuarios.email, acesso.email));
      if (!conta)
        throw new ORPCError("BAD_REQUEST", { message: "Essa pessoa ainda não criou a conta. Peça para entrar em “Primeiro acesso” no login." });
      const token = crypto.randomUUID().replace(/-/g, "");
      const ctx = await auth.$context;
      await ctx.internalAdapter.createVerificationValue({
        value: conta.id,
        identifier: `reset-password:${token}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      await db.batch([definirContexto(context.user), auditarEvento("link_senha_gerado", acesso.email), limparContexto()]);
      return { link: `${context.headers.get("origin") || origemSite()}/redefinir-senha?token=${token}`, email: acesso.email };
    }),
  list: coordenacao.handler(() => db.select().from(tabela).orderBy(asc(tabela.papel), asc(tabela.grupo), asc(tabela.nome))),
  add: coordenacao
    .input(z.object({ email: z.string().email() }).and(dados))
    .handler(async ({ input, context }) => {
      const email = input.email.toLowerCase().trim();
      const [existe] = await db.select().from(tabela).where(eq(tabela.email, email));
      if (existe) throw new ORPCError("CONFLICT", { message: "Esse e-mail já está liberado." });
      const grupo = input.papel === "coordenacao" ? null : input.grupo;
      const [, rows] = await db
        .batch([definirContexto(context.user), db.insert(tabela).values({ email, nome: input.nome, papel: input.papel, grupo }).returning(), limparContexto()])
        .catch(erroBanco);
      return rows[0];
    }),
  update: coordenacao
    .input(z.object({ id: z.number() }).and(dados))
    .handler(async ({ input, context }) => {
      const [row] = await db.select().from(tabela).where(eq(tabela.id, input.id));
      if (!row) throw new ORPCError("NOT_FOUND");
      if (row.email === context.user.email.toLowerCase() && input.papel !== "coordenacao")
        throw new ORPCError("BAD_REQUEST", { message: "Você não pode tirar o seu próprio acesso de coordenação." });
      const grupo = input.papel === "coordenacao" ? null : input.grupo;
      const [, rows] = await db
        .batch([definirContexto(context.user), db.update(tabela).set({ nome: input.nome, papel: input.papel, grupo }).where(eq(tabela.id, input.id)).returning(), limparContexto()])
        .catch(erroBanco);
      return rows[0];
    }),
  remove: coordenacao
    .input(z.object({ id: z.number() }))
    .handler(async ({ input, context }) => {
      const [row] = await db.select().from(tabela).where(eq(tabela.id, input.id));
      if (row?.email === context.user.email.toLowerCase())
        throw new ORPCError("BAD_REQUEST", { message: "Você não pode remover o seu próprio acesso." });
      await db.batch([definirContexto(context.user), db.delete(tabela).where(eq(tabela.id, input.id)), limparContexto()]).catch(erroBanco);
      return { ok: true };
    }),
};
