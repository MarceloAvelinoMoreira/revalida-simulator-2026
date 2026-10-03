# Questões por grande área

## Funcionamento

Quinto modo de estudo no menu inicial: escolha “Questões por grande área”,
selecione uma área e use “Iniciar estudo por área” para resolver diretamente.
“Filtros e desempenho da área” abre a seleção detalhada existente.
Cinco áreas com contagens reais, filtros combinados
por subárea, tema, prova, ano, status e busca. Modos de resolução, revisão de
erros/acertos e respostas rápidas reutilizam os motores existentes. A pergunta
mantém o ID e a identificação da prova; “Ver prova de origem” abre a prova
completa na mesma questão. Voltar retorna aos filtros da área.

O registro central `revalida.sim.v1.progress` guarda a última resposta por ID,
compartilhada entre provas e áreas. Recupera os resultados válidos da sessão
legada disponível; não recupera sessões antigas que já haviam sido sobrescritas.
“Responder novamente” inicia uma nova tentativa sem apagar o resultado salvo
até a nova resposta. Anuladas são separadas das questões não respondidas e não
entram no denominador da taxa de acerto/progresso.

## Classificação e limitações

1.300 IDs auditados: 1.059 organizados e 241 pendentes.

| Área | Questões |
|---|---:|
| Clínica Médica | 306 |
| Cirurgia | 133 |
| Pediatria | 195 |
| Ginecologia e Obstetrícia | 289 |
| Medicina Preventiva / Saúde Coletiva | 136 |

A classificação é uma triagem offline baseada em metadados individuais
existentes, corroborados pelo problema/alternativa correta, e 42 revisões
individuais explícitas. Não representa uma revisão médica completa e nova de
todos os enunciados/comentários. Metadados legados continuam sujeitos a revisão.
Não atribuímos uma área aos casos com evidência insuficiente/conflitante;
continuam acessíveis nas provas originais. Subáreas/temas ausentes ficam vazios,
em vez de inventados. Favoritos não foram adicionados: o app não tinha esse recurso.

Todos os IDs, fontes e motivos estão em
`netlify-dist/data/question-classification-report.json`. Somente as pendências
estão em `netlify-dist/data/area-pending.json`.

## Arquivos criados

- `netlify-dist/css/areas.css`: estilos responsivos isolados; paleta e fontes existentes preservadas.
- `netlify-dist/js/areas.js`: navegação, dashboard, filtros e paginação.
- `netlify-dist/js/area-repository.js`: índice derivado, busca e estatísticas reais.
- `netlify-dist/js/question-classification.js`: metadados gerados por ID, sem cópia de enunciados.
- `netlify-dist/data/area-overrides.json`: revisões individuais explícitas, editáveis para futuras classificações.
- `netlify-dist/data/question-classification-report.json`: auditoria completa.
- `netlify-dist/data/area-pending.json`: IDs que exigem revisão, com motivo.
- `scripts/classify-areas.cjs`: gerador offline, sem chamada paga ou mudança do banco.
- `scripts/test-areas.cjs`: testes de classificação, filtros, conteúdo, progresso, navegação e motor existente.
- `areas-handoff.md`: esta documentação.

## Arquivos modificados

- `index.html`: entrada no menu, tela de áreas, controles de nova tentativa/origem, assets versionados.
- `netlify-dist/js/storage.js`: progresso central por ID e migração compatível.
- `netlify-dist/js/simulator.js`: reutilização para listas filtradas, restauração do progresso, nova tentativa e retorno.
- `netlify-dist/js/rapid.js`: listas filtradas no mesmo flashcard e identificação da origem.
- `netlify-dist/service-worker.js`: cache versionado e novos assets.
- `scripts/check-build.cjs`: validação sintática dos novos scripts.

## Manutenção e execução

Após adicionar questões pelo fluxo existente, complete seus metadados individuais
ou inclua `ID: [grandeArea, subarea, tema]` em `area-overrides.json` e execute:

```powershell
node scripts/classify-areas.cjs
node --test scripts/test-areas.cjs scripts/test-assistant*.cjs scripts/test-brain.cjs scripts/test-public-groq.cjs
node scripts/check-build.cjs
node scripts/serve.cjs
```

O gerador ignora número e nome da prova como critérios de classificação.
Novos IDs sem metadados ficam pendentes automaticamente. O índice é carregado
uma vez; resultados são paginados sem duplicar o banco. Build em `tmp/site`.
Não foram introduzidas dependências, rotas incompatíveis com GitHub Pages ou
novas credenciais. A credencial pública do assistente é preexistente e não foi
alterada por esta tarefa. Publicação no GitHub Pages usa o fluxo existente da branch `main`.

## Validação da entrega

- Baseline: working tree limpo; 19 testes existentes passaram antes das alterações.
- Testes finais: 26/26 passaram, incluindo sete testes de áreas e do modo no menu.
- Sintaxe/build: passou, artefato estático em `tmp/site`.
- Navegador: cinco áreas abriram questões com alternativas; filtros combinados,
  imagem do ECG ENAMED 2026.2/1, comentário original, resposta rápida e retorno à
  prova de origem conferidos. Desktop e mobile sem overflow horizontal.
- Persistência: migração, recarga, resposta por área refletida na prova original
  e nova tentativa verificadas com armazenamento isolado em testes.
- Conteúdo: nenhum arquivo de questão/objeto educacional foi modificado.
- Segurança: varredura dos arquivos novos/modificados sem credenciais; console
  da validação visual sem erros. Credencial pública preexistente não integra o
  escopo desta alteração; não se declara o projeto inteiro livre de secrets.
- Git: diff revisado e sem erros de whitespace.
- Pendência editorial: 241 IDs em `netlify-dist/data/area-pending.json`.
