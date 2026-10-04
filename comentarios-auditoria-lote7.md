# Comentários — retomada de 04/10/2026

Situação parcial. Cinco resoluções específicas adicionadas nesta retomada: 2021-031, 034, 037, 039 e 040. Ainda há **810 objetos com o marcador de comentário genérico** nas dez provas antigas. Essa contagem é estrutural, não uma certificação clínica dos demais objetos.

## Inventário atual

| Prova | Genéricos pendentes |
|---|---:|
| 2021 | 52 |
| 2022/1 | 79 |
| 2022/2 | 75 |
| 2023/1 | 83 |
| 2023/2 | 81 |
| 2024/1 | 80 |
| 2024/2 | 85 |
| 2025/1 | 87 |
| 2025/2 | 82 |
| 2026/1 | 86 |
| Total | 810 |

O estado encontrado era mais adiantado que o relatório histórico do lote 6: 815 genéricos, não 874. O inventário percorre os 1.300 itens e identifica o marcador específico do texto-modelo; não chama todo texto não genérico de resolução clinicamente validada.

## Conteúdo e preservação

Cada nova resolução contempla o caso, classificação em três níveis, análise individual de A–D, síntese e referências. As fontes foram consultadas em páginas oficiais e trechos indexados. Algumas páginas bloquearam acesso integral: não se afirma leitura integral de todos os documentos. A orientação IDSA 2026 é corroboradora atual, não referência histórica de 2021. Recomendações pediátricas NICE 2022 são identificadas como posteriores e distinguem os objetivos dos exames.

As respostas existentes foram preservadas. A nova tentativa de acesso ao PDF do gabarito INEP encontrou erro de acesso; não houve nova conferência independente do PDF neste lote. A camada educacional identifica o gabarito como registrado no banco, sem inventar uma certificação adicional.

Ressalvas:

- 031: resistência não comprova ESBL; duração e avaliação de prostatite não estão estabelecidas pelo enunciado.
- 034: azitromicina isolada não é esquema completo para doença inflamatória pélvica; manter a melhor associação entre opções e explicitar a limitação.
- 037: DMSA investiga dano cortical; uretrocistografia investiga refluxo. O objetivo do “padrão-ouro” está incompletamente explicitado.
- 039: urgência, avaliação de perfusão e possibilidade de anticoagulação provisória não podem ser ignoradas enquanto se aguarda imagem.
- 040: quedas precoces são alerta para parkinsonismo atípico; relato não confirma definitivamente a etiologia.

Nenhum enunciado, alternativa, gabarito, imagem ou banco JavaScript foi alterado. A prova **2026.2 foi preservada integralmente**. Sua amostra de referência foi relida nas questões 006, 037, 052, 067 e 080.

## Verificação e entrega

58 testes automatizados passaram, incluindo cobertura A–D, taxonomia, referências e concordância com o banco nas cinco novas resoluções. Build de produção passou. A revisão do diff confirmou ausência de alterações nos três bancos e nas imagens. Não houve navegação visual individual destas cinco questões.

Conteúdo em `netlify-dist/data/eo/`; catálogo em `netlify-dist/data/references.json`; versão de leitura em `netlify-dist/js/eo-repository.js`. Texto autoral do lote em `editorial-lote7.json`; aplicação mecânica em `scripts/apply-editorial-lote7.cjs`; inventário em `scripts/audit-commentary.cjs`; regressão em `scripts/test-editorial-lote7.cjs`.

Este lote está **local, não publicado nem commitado**. A missão de completar todas as questões não foi concluída.
