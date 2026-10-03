# REVALIDDA Simulator 2026

Simulador de provas do REVALIDA com prova completa, respostas rápidas e comentários educacionais.

O site publicado pelo GitHub Pages usa `index.html` como entrada e mantém os arquivos da aplicação em `netlify-dist/`.

## Assistente neural — execução e configuração

### Modo público autorizado

O GitHub Pages carrega `assistant-public-groq.js`, com credencial Groq deliberadamente pública por autorização do proprietário. Nesse modo o navegador chama a Groq diretamente, sem backend. A chave pode ser recuperada por visitantes e pelo histórico Git, e utilizada fora do app para consumir a cota. Não há proteção server-side de consumo. Os limites de mensagem, histórico, saída e timeout e o fallback local continuam ativos. A auditoria de secrets deve sinalizar essa exposição: ela é real, não um falso positivo.

Para voltar ao modo protegido, remova a inclusão de `assistant-public-groq.js` em `index.html`, revogue/rotacione a chave exposta e configure o backend descrito abaixo. Apagar o arquivo não remove a credencial do histórico.

O cérebro fornecido pelo usuário, preservado na resolução original, controla o painel existente. Uma sobreposição SVG tem 48 nós, 200 conexões curvas únicas e 50 pulsos luminosos; imagem e sinapses são recortadas pela silhueta. Há uma única animação, pausa em aba inativa e respeito a movimento reduzido. O mesmo botão fica acima da marca no menu (320 px no desktop, até 240 px no celular) e retorna ao canto durante o estudo. As métricas vêm da sessão existente: respondidas = acertos + erros; sequência/temas não disponíveis não são inventados. Histórico enviado: até 8 mensagens recentes, sem banco de questões ou dados pessoais. As mensagens exibidas continuam no painel durante a navegação, como antes; não foi criada uma segunda base de histórico.

Node.js 22+; sem novas dependências:

```powershell
# Crie .env local a partir de .env.example e configure somente no servidor.
node scripts/serve.cjs
```

Acesse `http://127.0.0.1:8790/`. O processo carrega `.env` nativamente. Configure `AI_PROVIDER=groq`, `GROQ_API_KEY` e `AI_MODEL=openai/gpt-oss-20b` somente no servidor. Sem credencial, o endpoint responde com erro controlado e o painel continua com apoio local. Reinicie o processo após alterar `.env`.

```powershell
node --test scripts/test-assistant*.cjs scripts/test-brain.cjs
node scripts/check-build.cjs
node scripts/audit-assistant-security.cjs
```

O build gera `tmp/site` por cópia allowlisted dos arquivos estáticos (não há bundle/typecheck de framework). Não inclui `.env`, funções ou scripts. O adaptador HTTP local utiliza a mesma função Netlify; não é um segundo backend de produção.

### Produção

GitHub Pages é apenas estático e **não executa** `/api/assistant`. Para IA real, implante este repositório em Netlify com o `netlify.toml` da raiz; ele publica `tmp/site`, instala a função e mapeia `POST /api/assistant`. Configure `AI_PROVIDER=groq`, `GROQ_API_KEY` e, opcionalmente, `AI_MODEL` (padrão `openai/gpt-oss-20b`) como variáveis de ambiente **de Functions**, nunca no build público. Endpoint e autenticação seguem a [documentação oficial Groq](https://console.groq.com/docs/openai). O backend também preserva suporte a `AI_PROVIDER=xai`, com `XAI_API_KEY` e modelo `grok-4.3`; a credencial é enviada exclusivamente ao provedor selecionado.

Se mantiver o frontend no GitHub Pages, hospede a mesma função no Netlify e configure apenas a URL pública do seu backend (sem qualquer segredo) **antes** de carregar `assistant.js`:

```html
<script>
window.REVALIDDA_ASSISTANT_CONFIG = { endpoint: "https://SEU-SITE.netlify.app/api/assistant" };
</script>
```

`ASSISTANT_ALLOWED_ORIGINS` é uma lista de origens separadas por vírgula; o padrão permite somente `https://marceloavelinomoreira.github.io`. A função também aceita `URL`/`DEPLOY_PRIME_URL` injetados pelo Netlify. Localhost é permitido somente pelo adaptador local e fora de `NODE_ENV=production`. Não há CORS wildcard. Nunca coloque credencial na configuração do navegador.

### Limites e segurança

Mensagem: 2000 caracteres; histórico: 8 mensagens de até 2000; corpo: 24 KB; saída: 800 tokens, até 6000 caracteres; timeout do provedor: 8 s. Contexto allowlisted, sem URL, identidade ou sessão inteira. Dados locais não autorizam operações e não são estatísticas verificadas pelo servidor. O system prompt e autenticação existem somente na função.

Proteção simples por instância: 10 requisições/IP/minuto e 60 globais/minuto. Em serverless isso **não é quota distribuída**, e CORS não autentica clientes: configure limites de consumo no provedor e uma proteção compartilhada na plataforma se o uso público crescer. Erros nunca retornam corpo do provedor, stack ou credencial; requisições/respostas não são logadas pelo código. Credenciais locais ficam somente no `.env` ignorado; uma chave compartilhada por chat deve ser rotacionada antes de produção. HTTP 401/403 indica recusa de acesso pelo provedor, que pode envolver credencial, permissões ou faturamento; a interface utiliza fallback sem expor detalhes internos.

Provas, gabaritos, comentários, imagens e armazenamento do aluno não foram modificados. O ícone de instalação do app permanece o mesmo: somente as representações de robô da interface do assistente foram removidas.
