// Public configuration contains ONLY the backend URL, never provider credentials.
window.REVALIDDA_ASSISTANT_CONFIG = { endpoint: window.REVALIDDA_ASSISTANT_CONFIG?.endpoint || "/api/assistant" };

let assistantOpen = false;
let assistantBusy = false;
const assistantHistory = [];

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
    ...(session ? { correct: Number(session.correct) || 0, wrong: Number(session.wrong) || 0, answered: (Number(session.correct) || 0) + (Number(session.wrong) || 0) } : {}),
  };
}

function assistantStats() {
  const session = typeof RevalidaStorage !== "undefined" ? RevalidaStorage.loadSession() : null;
  const correctCount = Number(session && session.correct) || 0;
  const answeredCount = correctCount + (Number(session && session.wrong) || 0);
  const accuracy = answeredCount ? `${Math.round((correctCount / answeredCount) * 100)}%` : "—";
  return { accuracy, answered: session ? answeredCount : "—", streak: "—" };
}

function renderAssistantStats() {
  const current = assistantStats();
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
  launcher.setAttribute("aria-label", `${assistantOpen ? "Fechar" : "Abrir"} assistente virtual REVALIDDA`);
  launcher.title = assistantOpen ? "Fechar Assistente REVALIDDA" : "Abrir Assistente REVALIDDA";
  const tooltip = launcher.querySelector?.(".brain-tooltip");
  if (tooltip) tooltip.textContent = launcher.title;
  panel.inert = !assistantOpen;
  window.RevaliddaBrain?.burst();
  if (assistantOpen) {
    renderAssistantStats();
    document.getElementById("assistant-input")?.focus();
  } else {
    launcher.focus();
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
    if (stats.answered === "—") return "Não há dados de uma sessão de estudo disponíveis para calcular seu desempenho. Responda algumas questões para gerar um resumo real.";
    return `Seu resumo atual: ${stats.answered} ${stats.answered === 1 ? "questão respondida" : "questões respondidas"} e aproveitamento de ${stats.accuracy}. Continue praticando para eu identificar padrões mais confiáveis.`;
  }
  if (normalized.includes("melhorar") || normalized.includes("fraco")) {
    return "Ainda não há dados consolidados por tema para apontar seus pontos fracos. Revise as questões erradas e anote os assuntos em que teve dúvida.";
  }
  return "Dica de estudo: identifique o que o enunciado pede, destaque os achados decisivos e compare cada alternativa antes de responder. A IA está indisponível no momento; este é o modo local de apoio.";
}

async function askAssistant(message) {
  const text = String(message || "").trim();
  if (!text || assistantBusy) return;
  if (text.length > 2000) { setAssistantStatus("Use até 2000 caracteres por mensagem."); return; }
  if (!assistantOpen) toggleAssistant(true);
  appendAssistantMessage(text, "user");
  assistantBusy = true;
  document.getElementById("assistant-panel").setAttribute("aria-busy", "true");
  setAssistantStatus("Analisando seus dados...");
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10000);
  let reply;
  try {
    const config = window.REVALIDDA_ASSISTANT_CONFIG || {};
    const endpoint = new URL(config.endpoint || "/api/assistant", window.location.origin);
    // Only a backend assistant route is accepted. Never send questions to a provider URL.
    if (endpoint.pathname !== "/api/assistant" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || (endpoint.protocol !== "https:" && !(endpoint.origin === window.location.origin && endpoint.protocol === "http:"))) throw new Error("invalid_backend");
    const relevant = /desempenho|resultado|melhorar|fraco|estatística|progresso/i.test(text);
    const response = await fetch(endpoint.href, {
      method: "POST", signal: controller.signal, credentials: "omit",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: assistantHistory.slice(-8), context: relevant ? assistantContext() : {} }),
    });
    if (!response.ok) throw new Error(response.status === 429 ? "rate_limit" : "unavailable");
    const data = await response.json();
    if (typeof data.reply !== "string" || !data.reply.trim()) throw new Error("unavailable");
    reply = data.reply.slice(0, 6000);
  } catch (error) {
    reply = (error.message === "rate_limit" ? "Limite temporário atingido. Aguarde um minuto.\n\n" : "") + fallbackAssistantReply(text);
  } finally {
    window.clearTimeout(timer);
    appendAssistantMessage(reply, "bot");
    assistantHistory.push({ role: "user", content: text }, { role: "assistant", content: reply.slice(0, 2000) });
    if (assistantHistory.length > 8) assistantHistory.splice(0, assistantHistory.length - 8);
    renderAssistantStats();
    assistantBusy = false;
    document.getElementById("assistant-panel").setAttribute("aria-busy", "false");
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

document.addEventListener("DOMContentLoaded", () => {
  renderAssistantStats();
  document.getElementById("assistant-panel").inert = true;
  document.addEventListener("keydown", event => { if (event.key === "Escape" && assistantOpen) toggleAssistant(false); });
});
