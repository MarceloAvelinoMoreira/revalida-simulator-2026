# Comentários — lotes 5 e 6

Data: 03/10/2026. Situação parcial: 50 resoluções adicionadas nesta continuação, 125 novas resoluções acumuladas e 874 pendentes.

## Cobertura

| Prova | Novas neste trabalho | Novas acumuladas | Pendentes |
|---|---:|---:|---:|
| 2021 | 5 | 30 | 69 |
| 2022/1 | 5 | 11 | 89 |
| 2022/2 | 5 | 11 | 89 |
| 2023/1 | 5 | 10 | 90 |
| 2023/2 | 4 | 10 | 90 |
| 2024/1 | 6 | 11 | 89 |
| 2024/2 | 4 | 9 | 91 |
| 2025/1 | 5 | 10 | 90 |
| 2025/2 | 5 | 11 | 89 |
| 2026/1 | 6 | 12 | 88 |
| Total | 50 | 125 | 874 |

Além das 125 novas, foram preservadas 301 resoluções específicas preexistentes: 2021-008, os 100 comentários da 2026.2 e os 200 da FACISA. A prova 2026.2 não foi modificada. A contagem de 874 inclui questões anuladas, questões com mídia ainda não analisada e itens que exigem revisão manual; não representa 874 casos já clinicamente revisados.

Cada uma das 50 novas resoluções contém interpretação do caso, justificativa da resposta oficial, análise específica de cada uma das quatro alternativas, classificação em três níveis, mensagem de síntese e referências identificadas. A estrutura segue a amostra diversificada dos comentários protegidos da 2026.2, sem copiar afirmações de comparação entre cursinhos para as outras provas.

## Ressalvas e revisão manual

Foram acrescentados seis pontos de atenção:

- 2021-027: exposição por injeção não distingue HBV de HCV; confirmar marcadores virais.
- 2023/1-010: duas injeções de 1,2 milhão UI na mesma visita semanal, não duas aplicações em dias diferentes; não atrasar tratamento da gestante por espera de confirmação.
- 2025/1-006: divergência entre diretrizes na substituição de tetraciclina por doxiciclina em resgate de H. pylori.
- 2023/2-010: prova do laço negativa não exclui dengue; preservar gabarito e destacar prioridade do foco otológico complicado.
- 2026/1-016: incubação da hepatite A impede atribuir automaticamente casos ao evento ocorrido apenas uma semana antes.
- 2024/1-006: distinguir vacina antizóster da vacina antivaricela e indicação de sociedade médica da oferta pelo PNI.

As respostas oficiais foram mantidas em todos esses itens. Ressalvas não significam declaração de erro definitivo de gabarito.

A questão 2023/1-008 foi registrada para REVISÃO MANUAL em `_master_work/commentary-manual-review.json` e continua pendente, sem resolução nova. A etiologia de hiperbilirrubinemia de 25,6 mg/dL não é confirmada pelos dados. O relato de retorno 72 horas depois da alta não informa idade pós-natal precisa, necessária para aplicar limiares de tratamento e escalonamento com segurança. Não foi inventada justificativa para fechar essa lacuna.

## Fontes e checagens

Foram consultadas fontes do Ministério da Saúde, Anvisa, CFM, SBD, SBIm/SBGG, AAP, ASH, AAOS, ACOG, ACG, CDC, NIH, OMS, NICE e diretrizes cirúrgicas primárias. Recomendações históricas foram distinguidas de fontes atuais corroboradoras. O calendário PNI de 2022 foi baixado e sua tabela pediátrica conferida visualmente, com auxílio da skill de PDF.

Nem todas as páginas permitiram leitura integral: algumas bloquearam acesso direto e foram usadas informações indexadas da própria fonte primária. Não se afirma leitura integral desses documentos. Os documentos definitivos de gabarito permanecem cobertos pelo registro de auditoria anterior, sem nova extração neste trabalho. Não houve revisão clínica independente por médico; `validated` é estado editorial/estrutural, não certificação médica.

Os testes conferiram 125 resoluções acumuladas, todos os distratores, referências resolvidas, concordância dos 1.000 objetos educacionais com as respostas/anulações dos bancos e preservação dos 100 comentários da 2026.2. Enunciados, opções, IDs, ordem e mídia das 1.300 questões e os três bancos permaneceram byte a byte. Todas as novas questões selecionadas neste lote não têm arquivo de imagem anexado; não foi feita revisão visual global dos demais exames.

Cálculos adicionais conferidos: 175/3.500 ×100 = 5%; peso de 3.325 g; 1.200.000 ×2 ×3 = 7.200.000 UI; queda de 1:32 para 1:8 = quatro vezes. O cálculo não substitui avaliação clínica de alimentação ou resposta sorológica.

No navegador local, 2024/1-008 exibiu resposta C, comentário específico com quatro alternativas, painel individual e referências INEP/AAP. Verificação amostral, não navegação individual das 1.300 questões. A skill agent-browser foi consultada; como o executável não estava disponível, a conferência utilizou o navegador integrado.

## Arquivos

Alterados: 50 objetos em `netlify-dist/data/eo/`, catálogo `netlify-dist/data/references.json`, versões de cache em `netlify-dist/js/eo-repository.js` e `index-corrigido.html`, relatórios de auditoria e testes de comentários/publicação. Criados: lotes autorais 005 e 006 e fila de revisão manual em `_master_work/`.

A lógica do simulado e os bancos não foram refatorados. Nenhuma API externa ou credencial é necessária para apresentar os novos comentários. Para conferir: `node scripts/test-commentaries.cjs` e `node scripts/audit-commentaries.cjs --check` na pasta do projeto. Os arquivos do GitHub Pages recebem apenas os objetos, catálogo, cache, HTML e relatórios pertinentes; não são enviados arquivos de credenciais.
