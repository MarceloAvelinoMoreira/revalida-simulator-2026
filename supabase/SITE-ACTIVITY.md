# Atividade do site

Execute `migrations/202610080001_site_activity.sql` no SQL Editor do projeto Supabase já configurado. A execução cria tabelas novas e uma RPC, sem alterar perfis nem resultados. Depois publique o frontend.

O contador começa na ativação: não recupera acessos históricos. Uma sessão é identificada em sessionStorage (uma aba; atualizar não soma). Um dispositivo é um navegador/perfil identificado por UUID em localStorage, não uma pessoa ou aparelho físico. Abas compartilham presença. Limpar armazenamento ou usar outro navegador cria outra identidade. Não armazenamos IP, nome, respostas ou código do perfil nessas tabelas.

Heartbeat a cada 30 segundos com página visível; online significa atividade nos últimos 90 segundos. Fechar/suspender sai da contagem após expirar, não instantaneamente. Tabelas brutas são inacessíveis a anon/authenticated; a RPC retorna somente agregados.

Esses contadores são aproximados, não métricas auditadas: a RPC pública pode receber tráfego automatizado e não possui proteção anti-bot. Os UUIDs de sessões ficam armazenados para deduplicação; avaliar retenção e agregação conforme o volume crescer. Provedores de hospedagem podem registrar IPs independentemente deste recurso. Falhas de rede mostram indisponibilidade, não zero fictício.
