# Rodada: 7 funções — concluída e testada
- [x] Esqueci minha senha (e-mail via Resend se RESEND_API_KEY + EMAIL_REMETENTE; senão a coordenação gera link 24h em Acessos)
- [x] Exportações na auditoria (auditoria.exportacao, chamada em lib/exportar.ts)
- [x] Logout por inatividade (30 min, aviso 2 min antes) + sessão 12h
- [x] LGPD: aviso no login + aceite obrigatório (acessos.aceite_privacidade)
- [x] Edição de cadastro (só coordenação; trigger trg_pesq_upd_coord)
- [x] Registro de contato (registros_contato + vw_registros_autorizados + triggers)
- [x] PWA (manifest, ícones, sw sem cache)
- [x] seed: upsert por e-mail/nome (ids preservados)
## Pendente com o usuário
- Chave Resend + remetente verificado (opcional)
- Sugestão 5: trocar card "Pesquisadores por grupo" do monitor por "Dados a revisar"

## Decisões (29/10)
- Card "Pesquisadores por grupo" da Visão geral do monitor: manter como está.
- Sem e-mail automático: recuperação de senha segue pelo link gerado pela coordenação (Acessos → chave). Código do Resend fica inativo (RESEND_API_KEY vazio).
- Manual do monitor (PDF): /home/user/manual-monitores.report/manual-do-monitor.pdf (gerar.py).

## Áreas dos grupos no mapa (29/10)
- Fonte: GeoJSON do usuário (IDE-DF, 37 RAs com coluna `grupo`). Simplificado com mapshaper (8%) → `packages/web/public/data/ras-df.geojson` (~200 KB, campos `nome`, `grupo`).
- `components/mapa.tsx`: `useAreas()` + `CamadaAreas` (pane z 350, não interativa, cores = CORES_GRUPO do painel, fill 0.22). Prop `areas`.
- Mapa: coordenação vê todas; monitor só o próprio grupo. Legenda com quadradinhos de cor. Página do grupo: áreas do grupo + legenda.
- Cores do arquivo do usuário (cor_grupo) NÃO usadas; seguimos as cores do painel para bater com pontos/legendas.
- Cores dos grupos trocadas (29/10) para contraste: G1 #D7262E vermelho, G2 #4C9A2A verde, G3 #F0A30A amarelo, G4 #7A3FC0 roxo, G5 #E0459B rosa, G6 #1F5FBF azul, G7 #13A3A0 turquesa. Tudo via CORES_GRUPO (lib/pesquisadores.ts). Prints dos manuais ainda têm as cores antigas.
