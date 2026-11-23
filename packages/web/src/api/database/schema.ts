import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, sqliteView, text } from "drizzle-orm/sqlite-core";

export * from "./auth-schema";

const colunasPesquisador = () => ({
  id: integer("id").primaryKey({ autoIncrement: true }),
  grupo: integer("grupo"), // null = sem grupo
  monitores: text("monitores").notNull().default(""),
  nome: text("nome").notNull(),
  endereco: text("endereco").notNull().default(""),
  cidade: text("cidade").notNull().default(""),
  estado: text("estado").notNull().default(""),
  cep: text("cep").notNull().default(""),
  latitude: real("latitude"),
  longitude: real("longitude"),
  celular: text("celular").notNull().default(""),
  email: text("email").notNull().default(""),
  sexo: text("sexo").notNull().default(""),
  atuacaoProfissional: text("atuacao_profissional").notNull().default(""),
  atuacaoLocal: text("atuacao_local").notNull().default(""),
  esfera: text("esfera").notNull().default(""),
  formacao: text("formacao").notNull().default(""),
  profissionalSaude: integer("profissional_saude", { mode: "boolean" }).notNull().default(false),
  escolaridade: text("escolaridade").notNull().default(""),
  observacao: text("observacao").notNull().default(""), // ex.: "CEP inválido"
});

export const pesquisadores = sqliteTable("pesquisadores", colunasPesquisador());

export const grupos = sqliteTable("grupos", {
  numero: integer("numero").primaryKey(),
  regioes: text("regioes").notNull().default(""),
});

export const acessos = sqliteTable("acessos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  nome: text("nome").notNull().default(""),
  papel: text("papel", { enum: ["coordenacao", "monitor"] }).notNull().default("monitor"),
  grupo: integer("grupo"), // obrigatório para monitor; null para coordenação
  aceitePrivacidade: integer("aceite_privacidade", { mode: "timestamp" }), // aceite do aviso LGPD
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/** Registro de contato / observação do monitor sobre um pesquisador. */
const colunasRegistro = () => ({
  id: integer("id").primaryKey({ autoIncrement: true }),
  pesquisadorId: integer("pesquisador_id").notNull(),
  autorEmail: text("autor_email").notNull(),
  autorNome: text("autor_nome").notNull().default(""),
  tipo: text("tipo").notNull().default("observacao"), // ligacao | whatsapp | email | visita | observacao
  resultado: text("resultado").notNull().default(""), // atendeu | nao_atendeu | retornar | ""
  texto: text("texto").notNull().default(""),
  quando: integer("quando", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});
export const registrosContato = sqliteTable("registros_contato", colunasRegistro());

// ---- Isolamento lógico no banco (ver ./seguranca.ts) ----

/** "Sessão" do banco: quem está consultando agora. Uma única linha (id = 1), preenchida e limpa
 *  dentro da mesma transação de cada consulta. Equivale ao `current_user` de um RLS. */
export const contextoSessao = sqliteTable("contexto_sessao", {
  id: integer("id").primaryKey(),
  email: text("email"),
  origem: text("origem"), // "app" | "sistema" (importação)
});

/** Trilha de auditoria — somente inclusão (triggers bloqueiam UPDATE e DELETE). */
export const auditoria = sqliteTable("auditoria", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  quando: integer("quando", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  email: text("email"),
  papel: text("papel"),
  grupo: integer("grupo"),
  acao: text("acao").notNull(),
  detalhe: text("detalhe").notNull().default(""),
  registros: integer("registros"),
});

/** Views de política: só devolvem linhas autorizadas para o e-mail em `contexto_sessao`. */
export const pesquisadoresAutorizados = sqliteView("vw_pesquisadores_autorizados", colunasPesquisador()).existing();
export const gruposAutorizados = sqliteView("vw_grupos_autorizados", {
  numero: integer("numero"),
  regioes: text("regioes").notNull(),
}).existing();
export const registrosAutorizados = sqliteView("vw_registros_autorizados", colunasRegistro()).existing();
