import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { count, eq } from "drizzle-orm";
import { db } from "./database";
import * as schema from "./database/schema";
import { definirContexto, garantirSeguranca, limparContexto } from "./database/seguranca";
import { emailRedefinicao, enviarEmail } from "./services/email";

/** Origem do site para montar links (pedido do navegador ou WEBSITE_URL). */
export const origemSite = (request?: Request) => request?.headers.get("origin") || process.env.WEBSITE_URL || "";

export const auth = betterAuth({
  basePath: "/api/auth",
  baseURL: process.env.WEBSITE_URL,
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hora
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, token }, request) => {
      const link = `${origemSite(request)}/redefinir-senha?token=${token}`;
      const { subject, text, html } = emailRedefinicao(user.name, link);
      await enviarEmail({ to: user.email, subject, text, html });
    },
  },
  session: { expiresIn: 60 * 60 * 12, updateAge: 60 * 60 }, // sessão vale 12h
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: (request) => {
    const origin = request?.headers.get("origin");
    return origin ? [origin] : ["*"];
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          await garantirSeguranca();
          const email = user.email.toLowerCase().trim();
          const [{ total }] = await db.select({ total: count() }).from(schema.acessos);
          if (total === 0) {
            // Primeira conta do sistema vira coordenação
            await db.batch([definirContexto("sistema"), db.insert(schema.acessos).values({ email, papel: "coordenacao" }), limparContexto()]);
            return { data: user };
          }
          const [acesso] = await db.select().from(schema.acessos).where(eq(schema.acessos.email, email));
          if (!acesso) {
            throw new APIError("FORBIDDEN", {
              message: "Este e-mail não está liberado. Peça à coordenação para liberar seu acesso.",
            });
          }
          return { data: user };
        },
      },
    },
  },
  plugins: [bearer()],
});
