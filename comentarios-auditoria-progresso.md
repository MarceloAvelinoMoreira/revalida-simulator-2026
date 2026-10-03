# Comentários — auditoria e primeiro lote

Data: 03/10/2026. **Situação: parcial. A missão completa ainda não foi concluída.**

## Escopo e preservação

Foram inventariadas estruturalmente 1.300 questões em 12 provas. Isso não significa que todas receberam revisão médica individual. Foram elaboradas e revisadas tecnicamente 20 resoluções novas da prova 2021, em duas etapas: piloto de cinco áreas e expansão após teste do piloto.

Os três bancos JavaScript de questões foram mantidos byte a byte, incluindo enunciados, alternativas, IDs, numeração, ordem, gabaritos, comentários já incorporados e imagens. Também foram comparados os hashes dos arquivos de mídia. A prova 2026.2 inteira permanece intocada; os testes verificaram, adicionalmente, os 100 comentários e justificativas retornados pelo resolver.

Foram preservados os 100 comentários da 2026.2, os 200 comentários importados da FACISA, o objeto educacional específico de 2021-008 e todas as explicações curtas existentes nos bancos. A FACISA foi identificada como conteúdo específico importado; não foi submetida a uma nova revisão clínica global neste lote.

## Inventário

| Prova | Questões | Específicos existentes preservados | Novas resoluções | Genéricos ainda pendentes | Questões com mídia |
|---|---:|---:|---:|---:|---:|
| 2021 | 100 | 1 | 20 | 79 | 11 |
| 2022/1 | 100 | 0 | 0 | 100 | 17 |
| 2022/2 | 100 | 0 | 0 | 100 | 15 |
| 2023/1 | 100 | 0 | 0 | 100 | 14 |
| 2023/2 | 100 | 0 | 0 | 100 | 20 |
| 2024/1 | 100 | 0 | 0 | 100 | 12 |
| 2024/2 | 100 | 0 | 0 | 100 | 16 |
| 2025/1 | 100 | 0 | 0 | 100 | 11 |
| 2025/2 | 100 | 0 | 0 | 100 | 9 |
| 2026/1 | 100 | 0 | 0 | 100 | 13 |
| 2026/2 | 100 | 100 | 0 | 0 | 15 |
| FACISA | 200 | 200 | 0 | 0 | 0 |
| Total | 1300 | 301 | 20 | 979 | 153 |

Nenhum objeto estava literalmente vazio, mas 999 dos 1.000 objetos educacionais das dez provas antigas usavam texto genérico sem análise específica dos distratores. Esses textos não foram contabilizados como comentários completos. Vinte foram substituídos neste lote; os outros 979 continuam pendentes, não validados. Os 153 registros com mídia apontam para arquivos existentes; não houve revisão visual individual de todas essas imagens. Nenhuma das vinte questões selecionadas contém imagem anexada no banco.

Não foram encontradas duplicidades exatas de enunciado e alternativas entre as 1.300 questões. Questões parecidas ou versões reescritas não foram consideradas idênticas nem tiveram comentários copiados automaticamente.

## Padrão e integração

A referência editorial foi lida nos itens 2026-2-006, 037, 052, 067 e 080, cobrindo Clínica, Cirurgia, GO, Pediatria e Saúde Coletiva. Foi mantida a sequência semântica: resposta, área › subárea › tema, interpretação do caso, decisão clínica, cada distrator e identificação do gabarito.

O conteúdo novo foi inserido exclusivamente na camada existente `netlify-dist/data/eo/`, schema 2.0. O botão Comentário recebe a resolução completa; Justificar Resposta recebe o raciocínio clínico; os painéis por alternativa recebem a análise individual. Referências específicas substituem, somente nos objetos selecionados, o uso de citações genéricas de instituições. Não foi utilizado o assistente/API externa para gerar conteúdo em tempo de execução.

IDs processados: 2021-001, 002, 006, 009, 012, 014, 015, 016, 017, 018, 021, 024, 025, 028, 033, 035, 036, 038, 047 e 050.

## Gabaritos e fontes

O script `scripts/audit-answer-keys.py` compara os 1.000 gabaritos das dez provas com documentos definitivos. O registro detalhado está em `_master_work/commentary-key-audit.json`. A conclusão da comparação deve ser lida nesse JSON: exige 100 letras extraídas por prova e nenhuma divergência. Os PDFs de 2024 exigiram normalização de símbolos de anulação; o de 2026/1 exigiu mapeamento de glifos, conferido visualmente nas duas páginas renderizadas. Não houve modificação de nenhuma resposta.

Fontes dos gabaritos obtidos durante este trabalho:

- INEP 2025/1: https://download.inep.gov.br/revalida/provas_e_gabaritos/2025_1_GB_objetiva_definitivo.pdf
- INEP 2026/1: https://download.inep.gov.br/revalida/provas_e_gabaritos/2026_1_gabarito_definitivo_caderno1.pdf

Os vinte novos comentários incluem fontes identificáveis do Ministério da Saúde, INCA, CFM, SBP, FEBRASGO, ACOG, AAP, CHOP, NICE, Brain Trauma Foundation, NCI e ESHRE, conforme o tema. Não foi inventado consenso de cursinhos. A diretriz ESHRE 2022 foi identificada como corroboradora posterior à prova, sem atribuir sua publicação a 2021.

Limitações de acesso: um link antigo da FEBRASGO sobre pólipos retornou 404 e foi removido das novas referências, sendo substituído pelo documento ACOG de 2020. Alguns documentos tiveram acesso integral bloqueado ou temporariamente indisponível no leitor web; nesses casos, foram usadas informações identificáveis nos resultados indexados da fonte primária. Isso não equivale à leitura integral de todos os documentos. Nenhuma chave de API ou configuração de credenciais foi alterada.

Não foi identificada divergência técnica que exigisse trocar uma resposta nos vinte casos. Não foram criados blocos de controvérsia artificiais. As limitações do Glasgow na questão 17 e da interpretação de uma glicemia isolada na questão 24 são explicitadas no próprio raciocínio, sem inventar informações ausentes.

## QA executado

- Comparação por SHA-256 dos bancos, questões completas e arquivos de mídia.
- Preservação dos objetos educacionais específicos já existentes.
- Compatibilidade entre ID, anulação e resposta da questão e do objeto educacional.
- Cobertura de todas as quatro alternativas nas vinte resoluções.
- Taxonomia de três níveis em todas as novas resoluções.
- Catálogo resolve todas as novas referências; o teste não confunde resolução do catálogo com disponibilidade externa do documento.
- Cálculo conferido: 70 mL / 4 h = 17,5 mL/h na questão 1.
- Testes do resolver das vinte novas questões e das cem questões protegidas da 2026.2.
- Navegador local: iniciar 2021, responder, abrir Comentário, Justificar Resposta, distratores e Referências.
- Atualização da versão das requisições de EOs e referências para evitar catálogo antigo no cache. Após recarregar, as novas referências aparecem com título e URL.

Não foi realizada revisão por um médico independente. O campo editorial `validated` documenta os testes e a revisão técnica deste lote pelo assistente, não certificação clínica humana.

## Arquivos

Arquivos funcionais: `index-corrigido.html` (apenas versão do script), `netlify-dist/js/eo-repository.js` (apenas versão de cache), `netlify-dist/data/references.json` e os vinte `netlify-dist/data/eo/2021-NNN.json` listados acima. Para GitHub Pages, o HTML é copiado para `index.html`.

Artefatos locais de trabalho: `scripts/audit-commentaries.cjs`, `scripts/apply-commentary-batch.cjs`, `scripts/test-commentaries.cjs`, `scripts/audit-answer-keys.py`, `_master_work/commentary-baseline.json`, `_master_work/commentary-batch-001.json`, `_master_work/commentary-batch-002.json`, `_master_work/commentary-progress.json`, `_master_work/commentary-key-audit.json`, os dois PDFs oficiais baixados e as duas imagens de conferência do gabarito 2026/1. Este relatório registra a situação parcial.

## Pendências obrigatórias

Restam 979 objetos genéricos a resolver individualmente, verificar fontes, investigar controvérsias e revisar por prova. Ainda não foram examinados clinicamente e não devem ser apresentados como concluídos nem como cientificamente aprovados. Questões anuladas precisam de discussão específica sem atribuir-lhes uma alternativa oficial correta; questões que dependam de mídia exigem leitura visual. Casos realmente inconclusivos devem receber estado REVISÃO MANUAL após essa avaliação, não uma justificativa fabricada.

Não foi atribuído estado REVISÃO MANUAL aos 979 itens apenas por ainda não terem sido trabalhados. Eles estão **pendentes de revisão**, o que é diferente de uma questão avaliada e irresolúvel. O inventário e os lotes ficam salvos para continuar sem reescrever conteúdo preservado.
