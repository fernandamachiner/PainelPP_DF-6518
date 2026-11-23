# Isolamento lógico dos dados no banco

O banco é SQLite (Turso/libSQL), que não tem RLS nativo. O isolamento é feito no próprio banco, com views de política, triggers e auditoria. O código fica em `packages/web/src/api/database/seguranca.ts` e é aplicado automaticamente quando o servidor sobe.

| Peça | O que faz |
|---|---|
| `contexto_sessao` | Linha única com o e-mail de quem está consultando. É gravada e limpa dentro da mesma transação de cada consulta, como o `current_user` de um RLS. |
| `vw_pesquisadores_autorizados`, `vw_grupos_autorizados` | Views de política. Cruzam a sessão com `acessos`: a coordenação recebe todas as linhas, o monitor só as do seu grupo e quem não tem sessão não recebe nada. |
| `vw_pesquisadores_grupo_N` | Uma view por grupo, com a mesma política aplicada. |
| Triggers em `pesquisadores` | Bloqueiam inclusão, alteração ou exclusão fora do grupo de quem está na sessão e exigem que o grupo exista. |
| Triggers em `acessos` | Só a coordenação libera, altera ou remove acessos. Monitor precisa de um grupo existente. Não deixa ficar sem ninguém na coordenação. |
| `auditoria` | Recebe um registro a cada consulta, com quantas linhas foram entregues, a cada mudança de acesso e a cada importação. É somente inclusão: UPDATE e DELETE são bloqueados. |

**Limite:** a credencial do banco é única. Quem tiver o token do banco consegue ler as tabelas-base diretamente. Para ter RLS formal, com credenciais separadas por papel, é preciso migrar para PostgreSQL.

## Atualizações
- **Editar cadastro:** só coordenação (procedure `pesquisadores.update` + trigger `trg_pesq_upd_coord`). Cada edição grava `pesquisador_alterado` com os campos mudados.
- **Registro de contato:** tabela `registros_contato`, lida por `vw_registros_autorizados`. Triggers: só insere em pesquisador visível e em nome da própria sessão; só o autor edita; autor ou coordenação apaga.
- **LGPD:** aceite obrigatório no primeiro acesso (`acessos.aceite_privacidade`), auditado como `aceite_privacidade`.
- **Exportações:** cada planilha baixada gera `exportacao` com nome do arquivo e nº de linhas.
- **Senha:** link de redefinição vale 1h (e-mail) ou 24h (gerado pela coordenação, auditado como `link_senha_gerado`), uso único; ao trocar a senha, as sessões abertas são encerradas.
- **Sessão:** expira em 12h; o navegador sai sozinho após 30 min sem uso.
- **PWA:** o service worker não guarda nenhum dado em cache.
