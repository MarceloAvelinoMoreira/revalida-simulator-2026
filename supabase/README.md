# Ativar sincronização no Supabase

## Estado verificado

O projeto **Medicus**, na organização **Revalidda**, foi configurado: sessões anônimas habilitadas, as duas migrações executadas em transação e RLS ativo nas quatro tabelas. `cloud-config.js` contém apenas URL e chave pública publishable. A interface local exibiu “Sincronizado”. O frontend é publicado pelo GitHub Pages após enviar o commit ao ramo `main`; confirme a conclusão do deploy e a versão dos arquivos antes de testar no endereço público.

`npm run smoke:cloud` é um teste real **opcional**: cria duas identidades anônimas e perfis sintéticos `TESTE`, verifica associação entre dispositivos, isolamento por perfil, rejeição de código errado e bloqueio sem sessão. Os perfis de teste são mantidos, não removidos automaticamente. Não o execute repetidamente sem necessidade. O teste real passou; a suíte local possui 55 testes aprovados. Um perfil adicional de teste pela interface foi sincronizado.

## Ferramentas de desenvolvimento

Node.js 20+ e npm são necessários. A CLI Supabase 2.119.0 está instalada como dependência de desenvolvimento com versão fixa no `package.json` e `package-lock.json`. Em outra máquina, execute `npm ci`.

- `npm start`: servidor local do aplicativo.
- `npm test`: testes existentes e da sincronização.
- `npm run build`: validação e geração do site estático.
- `npx --no-install supabase --version`: conferir a CLI instalada.
- `npm run supabase -- --help`: comandos da CLI.

A instalação não cria contas, projetos externos, credenciais ou serviços pagos. Para o Supabase hospedado, não é necessário Docker. A stack Supabase completa local é opcional e requer um runtime de containers; ele não foi instalado nesta preparação.

## Configuração do projeto hospedado

1. Crie um projeto em https://supabase.com/dashboard. Esta implementação não provisiona nem cobra serviços automaticamente.
2. Execute os arquivos `migrations/202610040001_study_results.sql` e `migrations/202610040002_username_profiles.sql`, nessa ordem, uma vez no SQL Editor. Se a primeira migração já estiver aplicada, execute somente a segunda. A função retorna um único JSON para não truncar as 1300 questões no limite padrão de linhas da Data API. A tabela antiga é preservada.
3. Em Authentication → Settings habilite **Allow anonymous sign-ins**. Nenhum e-mail ou senha é pedido ao estudante; a sessão anônima fornece a identidade interna usada pelas políticas de acesso. Para produção, avalie proteção CAPTCHA e limites de criação conforme a documentação Supabase; CAPTCHA exigiria integração adicional na interface. Defina Site URL como `https://marceloavelinomoreira.github.io/revalida-simulator-2026/`.
4. Em `netlify-dist/js/cloud-config.js`, preencha `url` com a URL HTTPS do projeto e `publishableKey` com a chave **sb_publishable_**. São informações públicas; nunca utilize `service_role`, `sb_secret_`, senha do banco ou credencial administrativa. RLS é obrigatório antes de ativar.
5. Execute `npm test`, `npm run build` e `npm start`. Em Estatísticas → Salvamento automático, informe um nome e escolha “Começar a salvar”. Em outro dispositivo, abra “Já tenho um perfil em outro dispositivo” e use o código gerado no primeiro.

## Comportamento e limites

- Respostas e tempos são locais primeiro, enviados ao sair da prova e consultados a cada 30 segundos fora dela. O cronômetro e a prova em andamento não sincronizam.
- Cada perfil tem cache separado. Ao escolher o nome, resultados de visitante são adicionados sem substituir respostas existentes nem apagar os originais. O perfil funciona localmente mesmo antes de configurar a nuvem.
- O nome é apenas um rótulo, não uma credencial e não é único. Um código aleatório de 128 bits é gerado pelo navegador; somente seu SHA-256 é enviado à função de associação. O banco não oferece busca por nome nem leitura dos códigos/hashes. Quem tiver o código poderá acessar e alterar resultados: guarde-o em lugar seguro.
- A associação entre dispositivos requer Supabase configurado e o perfil do primeiro dispositivo já sincronizado. Código é uma credencial de recuperação, embora não seja uma senha escolhida pelo usuário. Perder a sessão e o código exige começar outro perfil ou importar um backup; rotação/revogação do código ainda não está implementada.
- Conflitos da mesma questão: vence o timestamp mais recente do dispositivo; relógios devem estar corretos. Timestamps futuros acima de 5 minutos são rejeitados. Empates preservam a versão do servidor. Estatísticas são recalculadas pelo gabarito local, não confiadas ao cliente remoto.
- Pendências persistem no navegador e são reenviadas depois de falhas. A fila é idempotente. Não apague dados do navegador antes de confirmar a sincronização/exportação.
- Sessão anônima persistente é gerenciada pelo SDK Supabase 2.117.2, vendorizado para funcionar sem CDN em execução. Não existe campo de e-mail/senha. O código e o cache local não são criptografados; evite dispositivos compartilhados. Trocar de perfil preserva o cache anterior.
- Exportação/importação manual permanece disponível. Remoção global de resultados e sincronização instantânea Realtime não fazem parte desta primeira versão.

## Validação real antes de publicar

Com dois perfis de mesmo nome: confirme que um não consegue ler/inserir/alterar registros do outro e que chamadas sem sessão não têm acesso. Sessões de Anonymous Auth possuem papel `authenticated`, diferente do papel público `anon`. Conecte dois dispositivos pelo código: responda em cada um, volte ao menu e confira união dos resultados; teste offline, reconexão e conflito na mesma questão. `scripts/test-cloud-database.cjs` executa as migrações e políticas em PostgreSQL via PGlite, com identidades de teste; não substitui a configuração de Auth/API e a verificação final no projeto hospedado.
