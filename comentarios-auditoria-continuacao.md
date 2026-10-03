# Comentários — continuação da auditoria

Registro histórico dos lotes 3 e 4. O estado atual está em [auditoria dos lotes 5 e 6](comentarios-auditoria-lote6.md): 125 resoluções novas acumuladas e 874 pendentes.

Data: 03/10/2026. Situação: parcial; a solicitação de todas as alternativas ainda não está concluída.

## Resultado deste lote

Foram adicionadas 55 resoluções específicas nas dez provas que ainda tinham comentários genéricos. Somadas às 20 anteriores, há 75 novas resoluções, com análise individual das quatro alternativas, raciocínio clínico, tema em três níveis e referências identificadas. Restam 924 resoluções genéricas ou explicitamente pendentes; elas não foram contabilizadas como completas.

| Prova | Novas resoluções acumuladas | Pendentes |
|---|---:|---:|
| 2021 | 25 | 74 |
| 2022/1 | 6 | 94 |
| 2022/2 | 6 | 94 |
| 2023/1 | 5 | 95 |
| 2023/2 | 6 | 94 |
| 2024/1 | 5 | 95 |
| 2024/2 | 5 | 95 |
| 2025/1 | 5 | 95 |
| 2025/2 | 6 | 94 |
| 2026/1 | 6 | 94 |
| Total | 75 | 924 |

O comentário específico já existente de 2021-008, os 100 comentários da 2026.2 e os 200 da FACISA foram preservados. Essas 301 resoluções preexistentes não representam uma nova revisão clínica global neste lote.

## Correções da camada de justificativas

Foram encontradas 13 divergências entre os campos de resposta/anulação dos objetos educacionais e os gabaritos dos bancos, previamente conferidos com os documentos definitivos. Corrigiu-se apenas a camada educacional, sem alterar qualquer gabarito do banco ou enunciado.

- 2024/1: questões 008, 017, 018, 043, 044, 050, 051, 083 e 084.
- 2026/1: questões 002, 013, 030 e 033.

A questão 2026/1-002 recebeu resolução completa, identificando a alternativa C. Nas outras 12, justificativas incompatíveis com a resposta oficial foram substituídas por aviso explícito de revisão pendente, não por conteúdo supostamente validado. O registro com valores anteriores e documentos de conferência está em `_master_work/commentary-key-synchronization.json`.

## Ressalvas editoriais registradas

- 2022/1-004: distinguir recomendação de rastreamento mamográfico vigente na época da prova e atualização ministerial de 2025.
- 2022/2-002: o quadro sugere neoplasia vesical, mas não permite comprovar invasão muscular sem investigação histológica.
- 2024/2-002: compressão na úlcera venosa depende de avaliação da perfusão arterial; a pressão deve seguir a diretriz, não uma recomendação indiscriminada.
- 2025/1-004: elevação do hCG não confirma localização intrauterina; repouso não deve ser apresentado como intervenção comprovada para evitar perda gestacional.
- 2022/2-005: sintomas psicóticos e ideação suicida exigem avaliação de urgência e risco, sem presumir segurança para manejo apenas ambulatorial.
- 2022/2-006: a dose de anlodipino informada no enunciado excede a dose máxima usual consultada; o texto original foi mantido e a ressalva identificada.

## Preservação e testes

Os três bancos JavaScript de questões e os arquivos de mídia permaneceram byte a byte. Foram preservados enunciados, opções, IDs, ordem, gabaritos e conteúdos específicos anteriores. Nenhuma das 55 questões selecionadas neste lote possui imagem anexada no banco; não houve revisão visual global das 153 questões com mídia.

Os testes automatizados verificaram as 75 novas resoluções, cobertura das quatro alternativas, referências, taxonomia, concordância dos 1.000 objetos educacionais com os bancos e resolução dos 100 comentários protegidos da 2026.2. Também foram conferidos os cálculos presentes nos casos selecionados. Resultado: PASS, 924 pendências identificadas.

No navegador local, a questão 2026/1-002 foi respondida com C e exibiu o comentário completo, a análise de alternativa incorreta e as referências. Esse teste amostral não significa que todas as questões foram navegadas individualmente.

## Arquivos e limites

Conteúdo em `netlify-dist/data/eo/`; catálogo em `netlify-dist/data/references.json`. Versões de cache foram atualizadas em `netlify-dist/js/eo-repository.js` e `index-corrigido.html` para disponibilizar as novas resoluções sem alterar a lógica de estudo.

Rastreabilidade nos lotes `_master_work/commentary-batch-003.json` e `commentary-batch-004.json`. Scripts de aplicação, testes, auditoria, sincronização de chaves e enriquecimento das fontes ficam em `scripts/`. O relatório automatizado está em `_master_work/commentary-progress.json`.

Foram consultadas fontes oficiais e diretrizes primárias. Algumas páginas restringiram o acesso integral; nesses casos, não se afirma leitura integral e foram usados trechos indexados da fonte primária e fontes complementares. Os PDFs de gabarito não foram novamente extraídos neste lote; utilizou-se o registro de auditoria anterior. Não houve revisão clínica independente por médico. O estado técnico `validated` dos objetos indica verificações editoriais e estruturais, não certificação médica.

Para verificar localmente: executar `node scripts/audit-commentaries.cjs --check` e `node scripts/test-commentaries.cjs` na pasta do projeto. O aplicativo continua estático e pode ser servido por HTTP como anteriormente; nenhuma credencial ou API nova é necessária para os comentários.
