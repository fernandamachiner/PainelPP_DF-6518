// Isolamento lógico dos dados DENTRO do banco (SQLite/Turso não tem RLS nativo).
//
// Como funciona (equivalente a um RLS):
//  1. Toda consulta da aplicação roda numa transação (batch) que primeiro grava QUEM está
//     consultando em `contexto_sessao` e, no fim, limpa esse registro.
//  2. A aplicação lê os dados só pelas views de política (`vw_*_autorizados`). A regra de
//     quem pode ver o quê está na definição da view, cruzando o e-mail da sessão com `acessos`:
//     coordenação vê tudo, monitor vê só o próprio grupo e quem não está liberado não vê nada.
//  3. Triggers bloqueiam no banco qualquer escrita fora da regra e mantêm a integridade de `acessos`.
//  4. Toda leitura e alteração gera um registro em `auditoria`, que é somente inclusão.
//
// Limite conhecido: a credencial do banco é única, então quem tiver o token do banco consegue
// ler as tabelas-base. O isolamento vale para tudo o que passa pela aplicação.
import { eq, sql } from "drizzle-orm";
import { db } from "./__client";
import { contextoSessao } from "./schema";

const ATOR_SISTEMA = `(SELECT origem FROM contexto_sessao WHERE id = 1) = 'sistema'`;
const ATOR_PAPEL = `(SELECT a.papel FROM contexto_sessao c JOIN acessos a ON a.email = c.email WHERE c.id = 1)`;
const ATOR_GRUPO = `(SELECT a.grupo FROM contexto_sessao c JOIN acessos a ON a.email = c.email WHERE c.id = 1)`;
const ATOR_EMAIL = `(SELECT email FROM contexto_sessao WHERE id = 1)`;
const PODE_GRUPO = (g: string) =>
  `(${ATOR_SISTEMA} OR ${ATOR_PAPEL} = 'coordenacao' OR (${ATOR_PAPEL} = 'monitor' AND ${g} IS NOT NULL AND ${g} = ${ATOR_GRUPO}))`;
const negar = (cond: string) => `NOT COALESCE(${cond}, 0)`;
const abortar = (msg: string) => `BEGIN SELECT RAISE(ABORT, '${msg}'); END`;

const auditarAcesso = (acao: string, linha: "NEW" | "OLD") =>
  `INSERT INTO auditoria (email, papel, grupo, acao, detalhe)
   VALUES (COALESCE(${ATOR_EMAIL}, (SELECT origem FROM contexto_sessao WHERE id = 1)), ${ATOR_PAPEL}, ${ATOR_GRUPO}, '${acao}',
     ${linha}.email || ' · ' || ${linha}.papel || COALESCE(' · grupo ' || ${linha}.grupo, ''))`;

const VIEWS: Record<string, string> = {
  vw_pesquisadores_autorizados: `
    SELECT p.* FROM pesquisadores p
    JOIN contexto_sessao c ON c.id = 1
    JOIN acessos a ON a.email = c.email
    WHERE a.papel = 'coordenacao' OR (a.papel = 'monitor' AND a.grupo IS NOT NULL AND p.grupo = a.grupo)`,
  vw_grupos_autorizados: `
    SELECT g.* FROM grupos g
    JOIN contexto_sessao c ON c.id = 1
    JOIN acessos a ON a.email = c.email
    WHERE a.papel = 'coordenacao' OR (a.papel = 'monitor' AND g.numero = a.grupo)`,
  // registros de contato: só os de pesquisadores que a sessão pode ver
  vw_registros_autorizados: `
    SELECT r.* FROM registros_contato r
    JOIN vw_pesquisadores_autorizados p ON p.id = r.pesquisador_id`,
};

const CAMPOS_AUDITADOS = ["nome", "celular", "email", "endereco", "cidade", "estado", "cep", "grupo", "latitude", "longitude",
  "sexo", "escolaridade", "formacao", "atuacao_profissional", "atuacao_local", "esfera", "profissional_saude", "observacao"];
const camposAlterados = `rtrim(${CAMPOS_AUDITADOS.map((c) => `CASE WHEN OLD.${c} IS NOT NEW.${c} THEN '${c}, ' ELSE '' END`).join(" || ")}, ', ')`;
const PESQ_VISIVEL = (id: string) => `EXISTS (SELECT 1 FROM vw_pesquisadores_autorizados WHERE id = ${id})`;

const TRIGGERS: Record<string, string> = {
  // contexto_sessao: linha única
  trg_contexto_unico: `BEFORE INSERT ON contexto_sessao WHEN NEW.id <> 1 ${abortar("contexto_sessao aceita apenas a linha id = 1")}`,

  // pesquisadores: escrita só dentro do grupo do usuário (ou importação do sistema)
  trg_pesq_ins: `BEFORE INSERT ON pesquisadores WHEN ${negar(PODE_GRUPO("NEW.grupo"))} ${abortar("Isolamento: inclusão fora do grupo do usuário")}`,
  trg_pesq_upd: `BEFORE UPDATE ON pesquisadores WHEN ${negar(`${PODE_GRUPO("OLD.grupo")} AND ${PODE_GRUPO("NEW.grupo")}`)} ${abortar("Isolamento: alteração fora do grupo do usuário")}`,
  // editar o cadastro é só da coordenação (ou da importação do sistema)
  trg_pesq_upd_coord: `BEFORE UPDATE ON pesquisadores WHEN ${negar(`${ATOR_SISTEMA} OR ${ATOR_PAPEL} = 'coordenacao'`)} ${abortar("Apenas a coordenação pode editar o cadastro")}`,
  trg_pesq_del: `BEFORE DELETE ON pesquisadores WHEN ${negar(PODE_GRUPO("OLD.grupo"))} ${abortar("Isolamento: exclusão fora do grupo do usuário")}`,
  trg_pesq_grupo_valido_ins: `BEFORE INSERT ON pesquisadores WHEN NEW.grupo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM grupos WHERE numero = NEW.grupo) ${abortar("Grupo inexistente")}`,
  trg_pesq_grupo_valido_upd: `BEFORE UPDATE OF grupo ON pesquisadores WHEN NEW.grupo IS NOT NULL AND NOT EXISTS (SELECT 1 FROM grupos WHERE numero = NEW.grupo) ${abortar("Grupo inexistente")}`,
  trg_pesq_audit_upd: `AFTER UPDATE ON pesquisadores WHEN NOT COALESCE(${ATOR_SISTEMA}, 0) AND ${camposAlterados} <> '' BEGIN
    INSERT INTO auditoria (email, papel, grupo, acao, detalhe) VALUES (${ATOR_EMAIL}, ${ATOR_PAPEL}, ${ATOR_GRUPO}, 'pesquisador_alterado', NEW.nome || ' · ' || ${camposAlterados}); END`,
  trg_pesq_audit_del: `AFTER DELETE ON pesquisadores WHEN NOT COALESCE(${ATOR_SISTEMA}, 0) BEGIN
    INSERT INTO auditoria (email, papel, grupo, acao, detalhe) VALUES (${ATOR_EMAIL}, ${ATOR_PAPEL}, ${ATOR_GRUPO}, 'pesquisador_excluido', OLD.nome); END`,

  // acessos: só coordenação (ou sistema) altera; regras de integridade
  trg_acessos_ins_quem: `BEFORE INSERT ON acessos WHEN ${negar(`${ATOR_SISTEMA} OR ${ATOR_PAPEL} = 'coordenacao'`)} ${abortar("Apenas a coordenação pode liberar acessos")}`,
  // exceção: a própria pessoa pode registrar o aceite do aviso de privacidade (sem mudar mais nada)
  trg_acessos_upd_quem: `BEFORE UPDATE ON acessos WHEN ${negar(`${ATOR_SISTEMA} OR ${ATOR_PAPEL} = 'coordenacao'
    OR (OLD.email = ${ATOR_EMAIL} AND NEW.email = OLD.email AND NEW.papel = OLD.papel AND NEW.grupo IS OLD.grupo AND NEW.nome = OLD.nome)`)}
    ${abortar("Apenas a coordenação pode alterar acessos")}`,
  trg_acessos_del_quem: `BEFORE DELETE ON acessos WHEN ${negar(`${ATOR_SISTEMA} OR ${ATOR_PAPEL} = 'coordenacao'`)} ${abortar("Apenas a coordenação pode remover acessos")}`,
  trg_acessos_ins_regra: `BEFORE INSERT ON acessos WHEN (NEW.papel = 'monitor' AND (NEW.grupo IS NULL OR NOT EXISTS (SELECT 1 FROM grupos WHERE numero = NEW.grupo)))
    OR (NEW.papel = 'coordenacao' AND NEW.grupo IS NOT NULL) ${abortar("Monitor precisa de um grupo existente; coordenação não tem grupo")}`,
  trg_acessos_upd_regra: `BEFORE UPDATE ON acessos WHEN (NEW.papel = 'monitor' AND (NEW.grupo IS NULL OR NOT EXISTS (SELECT 1 FROM grupos WHERE numero = NEW.grupo)))
    OR (NEW.papel = 'coordenacao' AND NEW.grupo IS NOT NULL) ${abortar("Monitor precisa de um grupo existente; coordenação não tem grupo")}`,
  trg_acessos_ultima_coord_upd: `BEFORE UPDATE OF papel ON acessos WHEN OLD.papel = 'coordenacao' AND NEW.papel <> 'coordenacao'
    AND (SELECT count(*) FROM acessos WHERE papel = 'coordenacao') <= 1 ${abortar("É preciso manter ao menos uma pessoa na coordenação")}`,
  trg_acessos_ultima_coord_del: `BEFORE DELETE ON acessos WHEN OLD.papel = 'coordenacao'
    AND (SELECT count(*) FROM acessos WHERE papel = 'coordenacao') <= 1 ${abortar("É preciso manter ao menos uma pessoa na coordenação")}`,
  trg_acessos_audit_ins: `AFTER INSERT ON acessos BEGIN ${auditarAcesso("acesso_liberado", "NEW")}; END`,
  trg_acessos_audit_upd: `AFTER UPDATE ON acessos WHEN NEW.email IS NOT OLD.email OR NEW.papel IS NOT OLD.papel OR NEW.grupo IS NOT OLD.grupo OR NEW.nome IS NOT OLD.nome
    BEGIN ${auditarAcesso("acesso_alterado", "NEW")}; END`,
  trg_acessos_audit_aceite: `AFTER UPDATE OF aceite_privacidade ON acessos WHEN NEW.aceite_privacidade IS NOT NULL AND NEW.aceite_privacidade IS NOT OLD.aceite_privacidade
    BEGIN ${auditarAcesso("aceite_privacidade", "NEW")}; END`,

  // registros de contato: só em pesquisadores visíveis para a sessão, sempre em nome de quem está logado
  trg_reg_ins: `BEFORE INSERT ON registros_contato WHEN ${negar(`${PESQ_VISIVEL("NEW.pesquisador_id")} AND NEW.autor_email = ${ATOR_EMAIL}`)}
    ${abortar("Isolamento: registro fora do grupo do usuário")}`,
  trg_reg_upd: `BEFORE UPDATE ON registros_contato WHEN ${negar(`${PESQ_VISIVEL("OLD.pesquisador_id")} AND OLD.autor_email = ${ATOR_EMAIL} AND NEW.autor_email = OLD.autor_email AND NEW.pesquisador_id = OLD.pesquisador_id`)}
    ${abortar("Só quem escreveu pode editar o registro")}`,
  trg_reg_del: `BEFORE DELETE ON registros_contato WHEN ${negar(`${ATOR_SISTEMA} OR (${PESQ_VISIVEL("OLD.pesquisador_id")} AND (OLD.autor_email = ${ATOR_EMAIL} OR ${ATOR_PAPEL} = 'coordenacao'))`)}
    ${abortar("Só quem escreveu ou a coordenação pode apagar o registro")}`,
  trg_reg_audit_ins: `AFTER INSERT ON registros_contato BEGIN
    INSERT INTO auditoria (email, papel, grupo, acao, detalhe) VALUES (${ATOR_EMAIL}, ${ATOR_PAPEL}, ${ATOR_GRUPO}, 'contato_registrado',
      COALESCE((SELECT nome FROM pesquisadores WHERE id = NEW.pesquisador_id), '#' || NEW.pesquisador_id) || ' · ' || NEW.tipo); END`,
  trg_reg_audit_del: `AFTER DELETE ON registros_contato WHEN NOT COALESCE(${ATOR_SISTEMA}, 0) BEGIN
    INSERT INTO auditoria (email, papel, grupo, acao, detalhe) VALUES (${ATOR_EMAIL}, ${ATOR_PAPEL}, ${ATOR_GRUPO}, 'contato_apagado',
      COALESCE((SELECT nome FROM pesquisadores WHERE id = OLD.pesquisador_id), '#' || OLD.pesquisador_id)); END`,
  trg_acessos_audit_del: `AFTER DELETE ON acessos BEGIN ${auditarAcesso("acesso_removido", "OLD")}; END`,

  // auditoria: somente inclusão
  trg_auditoria_sem_update: `BEFORE UPDATE ON auditoria ${abortar("A auditoria não pode ser alterada")}`,
  trg_auditoria_sem_delete: `BEFORE DELETE ON auditoria ${abortar("A auditoria não pode ser apagada")}`,
};

/** Recria views e triggers (idempotente). Também cria uma view por grupo para consulta direta. */
async function aplicar() {
  const grupos = await db.all<{ numero: number }>(sql`SELECT numero FROM grupos`);
  const existentes = await db.all<{ name: string }>(sql`SELECT name FROM sqlite_master WHERE type = 'view' AND name LIKE 'vw_pesquisadores_grupo_%'`);
  const stmts: string[] = [`INSERT OR IGNORE INTO contexto_sessao (id) VALUES (1)`];
  for (const [nome, corpo] of Object.entries(VIEWS)) // uma linha só: o drizzle-kit não lê views com quebra de linha
    stmts.push(`DROP VIEW IF EXISTS ${nome}`, `CREATE VIEW ${nome} AS ${corpo.replace(/\s+/g, " ").trim()}`);
  for (const v of existentes) stmts.push(`DROP VIEW IF EXISTS ${v.name}`);
  for (const { numero } of grupos) {
    const n = Number(numero);
    // View por grupo: aplica a mesma política, já restrita ao grupo N
    stmts.push(`CREATE VIEW vw_pesquisadores_grupo_${n} AS SELECT * FROM vw_pesquisadores_autorizados WHERE grupo = ${n}`);
  }
  for (const [nome, corpo] of Object.entries(TRIGGERS)) stmts.push(`DROP TRIGGER IF EXISTS ${nome}`, `CREATE TRIGGER ${nome} ${corpo}`);
  await db.$client.batch(stmts, "write");
}

let pronto: Promise<void> | null = null;
export function garantirSeguranca() {
  pronto ??= aplicar().catch((e) => {
    pronto = null;
    throw e;
  });
  return pronto;
}

/** Força recriar views/triggers (ex.: depois de importar novos grupos). */
export function reaplicarSeguranca() {
  pronto = null;
  return garantirSeguranca();
}

/** Abre a "sessão" do banco para um e-mail (ou para o sistema, na importação). */
export const definirContexto = (ator: { email: string } | "sistema") =>
  db.update(contextoSessao)
    .set(ator === "sistema" ? { email: null, origem: "sistema" } : { email: ator.email.toLowerCase(), origem: "app" })
    .where(eq(contextoSessao.id, 1));

export const limparContexto = () => db.update(contextoSessao).set({ email: null, origem: null }).where(eq(contextoSessao.id, 1));

/** Registra um evento (ex.: exportação) em nome da sessão atual. */
export const auditarEvento = (acao: string, detalhe: string, registros: number | null = null) =>
  db.run(sql`INSERT INTO auditoria (email, papel, grupo, acao, detalhe, registros)
    SELECT c.email, a.papel, a.grupo, ${acao}, ${detalhe}, ${registros}
    FROM contexto_sessao c LEFT JOIN acessos a ON a.email = c.email WHERE c.id = 1`);

/** Registra uma leitura na auditoria, contando quantas linhas a política liberou. */
export const auditarLeitura = (acao: string, view: "vw_pesquisadores_autorizados" | "vw_grupos_autorizados" | "vw_registros_autorizados", detalhe = "") =>
  db.run(sql.raw(`INSERT INTO auditoria (email, papel, grupo, acao, detalhe, registros)
    SELECT c.email, a.papel, a.grupo, '${acao}', '${detalhe.replace(/'/g, "''")}', (SELECT count(*) FROM ${view})
    FROM contexto_sessao c LEFT JOIN acessos a ON a.email = c.email WHERE c.id = 1`));
