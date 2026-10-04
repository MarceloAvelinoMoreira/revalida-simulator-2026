# Comentários e justificativas — lote 10, 04/10/2026

Foram adicionadas **43 resoluções**, sendo 26 de 2021 e 17 de 2022/1. Cada uma inclui raciocínio vinculado ao caso, análise individual das quatro alternativas, classificação em três níveis, síntese e referências. Textos autorais em `editorial-lote10.json`, aplicados aos respectivos objetos em `netlify-dist/data/eo/`.

## Escopo

2021: 065, 066, 068, 071, 073, 074, 075, 076, 077, 078, 081, 082, 083, 084, 085, 086, 087, 088, 089, 090, 091, 094, 095, 096, 097, 098.

2022/1: 016, 017, 019, 020, 023, 025, 028, 029, 030, 031, 032, 034, 035, 036, 037, 038, 039.

Os gabaritos registrados foram preservados. Não houve nova conferência independente integral dos PDFs de gabarito. Nenhuma alteração em enunciados, alternativas, ordem, imagens ou bancos JavaScript. Comparação SHA-256 confirmou preservação dos três bancos e dos 22 objetos educacionais dos lotes 7–9. A prova 2026.2 continua intacta.

## Ressalvas editoriais

- **2021-082 — revisão manual necessária:** SCQ de 27%. Parkland clássica: 4 × 50 × 27 = 5.400 mL/24 h, metade nas primeiras oito horas desde a queimadura. A alternativa B registrada utiliza 2.700 mL/24 h, equivalente ao coeficiente de 2 mL. Nenhuma opção reproduz integralmente o cálculo clássico. O comentário apresenta a divergência, sem alterar a resposta nem classificar B como clinicamente correta sem ressalva. Conferir original, gabarito definitivo e eventual anulação; recomendações modernas não justificam retroativamente uma nomenclatura diferente.
- 2021-066: ressonância não aumenta automaticamente especificidade, mas tem indicações selecionadas; a redação ampla é contextualizada.
- 2021-065: dispneia em repouso exige avaliar gravidade; retorno programado não substitui urgência.
- 2021-068: exposição a corticoide pode afetar 17-OHP, não implica falso negativo obrigatório.
- 2021-081: distinguir anti-D imune, passivo e outros anticorpos; evitar atraso indevido da profilaxia.
- 2021-084: granuloma não caseoso pode apoiar Crohn, mas sua ausência não exclui; Behçet continua diferencial.
- 2021-086 e 2022/1-028: falhas de transcrição originais foram preservadas e sinalizadas, sem inventar idade ou curva.
- 2022/1-032: associação anestésica não garante propriedades ideais e requer avaliação de segurança e dose pediátrica.
- 2022/1-035: responder ao CAB 32, reconhecendo condições para toxoplasmose e diferenças de protocolos posteriores.
- 2022/1-038: propofol pode causar instabilidade, portanto o par não é intrinsecamente falso; a resposta é contextualizada ao algoritmo cobrado. Limite de fenitoína deve considerar peso, não usar automaticamente 50 mg/min em criança.

## Fontes e limites

Consultadas páginas oficiais e passagens indexadas do Ministério da Saúde, INCA, UNA-SUS, CDC, OMS, NCI/NIDDK, NICE, GOLD, IDSA, ABA, WSES, ASCRS, ESGE, BSG, RCOG, FSRH, ASH, DailyMed e Royal Children's Hospital. Nem todos os documentos completos puderam ser acessados; não se afirma leitura integral de todos os PDFs. Referências posteriores às provas são identificadas nos pontos em que corroboram ou atualizam a orientação histórica.

Esta revisão autoral não é uma certificação médica independente. A contagem de textos sem marcador genérico não certifica sua adequação clínica. Um objeto novo está explicitamente marcado `needs-manual-review`.

## Inventário após o lote

| Prova | Comentários com marcador genérico |
|---|---:|
| 2021 | 9 |
| 2022/1 | 62 |
| 2022/2 | 75 |
| 2023/1 | 83 |
| 2023/2 | 81 |
| 2024/1 | 80 |
| 2024/2 | 85 |
| 2025/1 | 87 |
| 2025/2 | 82 |
| 2026/1 | 86 |
| Total | 750 |

Redução de **793 para 750** comentários genéricos. Há adicionalmente a revisão manual da 2021-082, já comentada; ela não deve desaparecer da fila clínica apenas por perder o marcador genérico.

## Verificações

- 43 IDs únicos e exatamente 43 resoluções no lote.
- Análises de A–D e referências resolvidas em todos os objetos.
- Respostas concordantes com os bancos existentes; referências de gabarito correspondem à edição.
- 61 testes passaram, incluindo regressão dos quatro lotes editoriais locais.
- Build estático de produção passou; `git diff --check` sem erros.
- Sem inspeção visual individual das 43 questões; testes são estruturais e funcionais.
- Alterações anteriores preservadas. Nenhuma credencial adicionada ou publicada nesta tarefa.

Os scripts de aplicação/teste foram adaptados minimamente para mais de uma edição e para registrar divergências sem rotulá-las como respostas clinicamente corretas. Catálogo atualizado em `netlify-dist/data/references.json`; versão de leitura atualizada para lote 10 em `netlify-dist/js/eo-repository.js`.

Entrega local, **não commitada nem publicada**. A tarefa de completar todas as questões segue incompleta.
