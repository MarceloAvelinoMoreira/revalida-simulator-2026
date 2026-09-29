/*
 * Virtual assistant adapter.
 * Configure window.REVALIDDA_ASSISTANT_CONFIG.endpoint when the external API is ready.
 * Expected response: { reply: string, stats?: { accuracy, answered, streak }, suggestions?: string[] }
 */
window.REVALIDDA_ASSISTANT_CONFIG = window.REVALIDDA_ASSISTANT_CONFIG || {
  endpoint: "",
  method: "POST",
  headers: { "Content-Type": "application/json" },
};

let assistantOpen = false;
let assistantBusy = false;

function assistantEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function assistantContext() {
  const total = typeof QuestionRepository !== "undefined" ? QuestionRepository.count() : 0;
  const session = typeof RevalidaStorage !== "undefined" ? RevalidaStorage.loadSession() : null;
  return {
    totalQuestions: total,
    selectedEdition: typeof selectedYear !== "undefined" ? selectedYear : null,
    selectedMode: typeof selectedMode !== "undefined" ? selectedMode : null,
    session: session || null,
    url: window.location.href,
  };
}

function assistantStats() {
  const session = typeof RevalidaStorage !== "undefined" ? RevalidaStorage.loadSession() : null;
  const correctCount = Number(session && session.correct) || 0;
  const answeredCount = Number(session && session.currentIndex) || 0;
  const accuracy = answeredCount ? `${Math.round((correctCount / answeredCount) * 100)}%` : "—";
  return { accuracy, answered: answeredCount, streak: "—" };
}

function renderAssistantStats(stats) {
  const current = { ...assistantStats(), ...(stats || {}) };
  document.getElementById("assistant-accuracy").textContent = current.accuracy ?? "—";
  document.getElementById("assistant-answered").textContent = current.answered ?? 0;
  document.getElementById("assistant-streak").textContent = current.streak ?? "—";
}

function toggleAssistant(force) {
  assistantOpen = typeof force === "boolean" ? force : !assistantOpen;
  const panel = document.getElementById("assistant-panel");
  const launcher = document.getElementById("assistant-launcher");
  if (!panel || !launcher) return;
  panel.classList.toggle("is-open", assistantOpen);
  panel.setAttribute("aria-hidden", String(!assistantOpen));
  launcher.setAttribute("aria-expanded", String(assistantOpen));
  if (assistantOpen) {
    renderAssistantStats();
    window.setTimeout(() => document.getElementById("assistant-input")?.focus(), 80);
  }
}

function assistantVoiceNotice() {
  toggleAssistant(true);
  setAssistantStatus("O modo de voz será conectado junto com sua API externa.");
  appendAssistantMessage("Quando você definir o provedor de voz, este botão poderá ouvir sua pergunta e responder falando.", "bot");
}

function appendAssistantMessage(text, role) {
  const messages = document.getElementById("assistant-messages");
  if (!messages) return;
  const node = document.createElement("div");
  node.className = `assistant-message assistant-message-${role}`;
  node.innerHTML = assistantEscape(text).replace(/\n/g, "<br>");
  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
}

function setAssistantStatus(text) {
  const status = document.getElementById("assistant-status");
  if (status) status.textContent = text;
}

function fallbackAssistantReply(message) {
  const normalized = message.toLowerCase();
  const stats = assistantStats();
  if (normalized.includes("desempenho") || normalized.includes("resultado")) {
    return `Seu resumo atual: ${stats.answered} questões respondidas e aproveitamento de ${stats.accuracy}. Continue praticando para eu identificar padrões mais confiáveis.`;
  }
  if (normalized.includes("melhorar") || normalized.includes("fraco")) {
    return "Quando a API estiver conectada, vou cruzar seus erros por edição, tema e tipo de questão. Por enquanto, revise as questões erradas e repita os temas com menor segurança.";
  }
  return "Posso conversar sobre seu desempenho, pontos fracos, sequência de estudos e próximas questões. Configure o endpoint da API em REVALIDDA_ASSISTANT_CONFIG para respostas personalizadas.";
}

async function askAssistant(message) {
  const text = String(message || "").trim();
  if (!text || assistantBusy) return;
  if (!assistantOpen) toggleAssistant(true);
  appendAssistantMessage(text, "user");
  assistantBusy = true;
  setAssistantStatus("Analisando seus dados...");
  try {
    const config = window.REVALIDDA_ASSISTANT_CONFIG || {};
    if (!config.endpoint) {
      await new Promise((resolve) => window.setTimeout(resolve, 260));
      appendAssistantMessage(fallbackAssistantReply(text), "bot");
      renderAssistantStats();
      return;
    }
    const requestBody = config.provider === "groq"
      ? {
          model: config.model || "openai/gpt-oss-20b",
          temperature: 0.4,
          messages: [
            { role: "system", content: config.systemPrompt || "Você é um assistente de estudos." },
            { role: "user", content: `${text}\n\nDados atuais do estudante: ${JSON.stringify(assistantContext())}` },
          ],
        }
      : { message: text, context: assistantContext() };
    const response = await fetch(config.endpoint, {
      method: config.method || "POST",
      headers: config.headers || { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) throw new Error(`assistant_api_${response.status}`);
    const data = await response.json();
    const reply = data.reply || data.message || data.choices?.[0]?.message?.content || "Recebi sua solicitação, mas a API não retornou uma resposta.";
    appendAssistantMessage(reply, "bot");
    renderAssistantStats(data.stats);
    if (Array.isArray(data.suggestions)) {
      document.getElementById("assistant-suggestions").innerHTML = data.suggestions.slice(0, 3).map((item) => `<button type="button" onclick="askAssistant('${assistantEscape(item).replace(/'/g, "\\'")}')">${assistantEscape(item)}</button>`).join("");
    }
  } catch (error) {
    appendAssistantMessage("Não consegui consultar o assistente agora. Verifique o endpoint da API e tente novamente.", "bot");
    console.warn("REVALIDDA assistant:", error);
  } finally {
    assistantBusy = false;
    setAssistantStatus("Posso analisar seu desempenho e sugerir o próximo passo.");
  }
}

function submitAssistant(event) {
  event.preventDefault();
  const input = document.getElementById("assistant-input");
  const value = input ? input.value : "";
  if (input) input.value = "";
  askAssistant(value);
}

document.addEventListener("DOMContentLoaded", () => renderAssistantStats());
