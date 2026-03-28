(function () {
  // ── 1. Bootstrap ─────────────────────────────────────────────
  // Grab script reference BEFORE any async code (currentScript is only
  // available synchronously during script evaluation)
  const currentScript = document.currentScript;
  const API_KEY = currentScript?.getAttribute("data-key") || "";

  if (!API_KEY) {
    console.warn(
      "[DocuMind] No data-key attribute found on widget script tag.",
    );
    return;
  }

  const BASE_URL = __BASE_URL__; // replaced by Vite at build time

  // ── 2. State ─────────────────────────────────────────────────
  let isOpen = false;
  let isStreaming = false;
  let messages = []; // { role: 'user'|'assistant', content: string }[]
  let config = {
    primaryColor: "#6366f1",
    welcomeMessage: "Hi! Ask me anything about our docs.",
    suggestedQuestions: [],
  };

  // DOM refs — set after render()
  let shadow, panel, messagesEl, inputEl, sendBtn;

  // ── 3. Fetch widget config from API ───────────────────────────
  async function fetchConfig() {
    try {
      const res = await fetch(`${BASE_URL}/api/widget/config?key=${API_KEY}`);
      if (res.ok) config = await res.json();
    } catch (e) {
      console.warn("[DocuMind] Could not load widget config, using defaults.");
    }
  }

  // ── 4. Render the widget into a Shadow DOM ────────────────────
  // Shadow DOM isolates our CSS from the host page — no style conflicts
  function render() {
    const host = document.createElement("div");
    host.id = "documind-widget-host";
    document.body.appendChild(host);
    shadow = host.attachShadow({ mode: "open" });

    const p = config.primaryColor;

    shadow.innerHTML = `
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        #bubble {
          position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
          width: 56px; height: 56px; border-radius: 50%;
          background: ${p}; color: white; border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(0,0,0,0.25);
          transition: transform 0.2s ease;
          font-family: system-ui, sans-serif;
        }
        #bubble:hover { transform: scale(1.08); }

        #panel {
          position: fixed; bottom: 92px; right: 24px; z-index: 2147483646;
          width: 370px; height: 520px;
          background: white; border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
          display: flex; flex-direction: column; overflow: hidden;
          font-family: system-ui, sans-serif;
          opacity: 0; pointer-events: none;
          transform: scale(0.96) translateY(8px);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }
        #panel.open { opacity: 1; pointer-events: all; transform: scale(1) translateY(0); }

        @media (max-width: 640px) {
          #panel { bottom: 0; right: 0; left: 0; width: 100%; height: 80dvh; border-radius: 16px 16px 0 0; }
          #bubble { bottom: 16px; right: 16px; }
        }

        /* Header */
        #header {
          background: ${p}; color: white; padding: 14px 16px;
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        #header-title { font-size: 15px; font-weight: 600; }
        #close-btn {
          background: none; border: none; color: white; cursor: pointer;
          opacity: 0.75; display: flex; padding: 2px; border-radius: 4px;
        }
        #close-btn:hover { opacity: 1; }

        /* Messages */
        #messages {
          flex: 1; overflow-y: auto; padding: 16px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .welcome { color: #6b7280; font-size: 13px; text-align: center; line-height: 1.5; }
        .suggestions { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin-top: 4px; }
        .suggestion-btn {
          background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 20px;
          padding: 5px 12px; font-size: 12px; cursor: pointer; color: #374151;
          transition: background 0.15s;
        }
        .suggestion-btn:hover { background: #e5e7eb; }

        /* Message bubbles */
        .msg {
          max-width: 85%; padding: 9px 13px; border-radius: 12px;
          font-size: 14px; line-height: 1.55; word-wrap: break-word; white-space: pre-wrap;
        }
        .msg.user {
          background: ${p}; color: white;
          align-self: flex-end; border-bottom-right-radius: 3px;
        }
        .msg.assistant {
          background: #f3f4f6; color: #111;
          align-self: flex-start; border-bottom-left-radius: 3px;
        }
        .msg.thinking { color: #9ca3af; font-style: italic; }

        /* Source chips */
        .sources { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
        .source-chip {
          background: #ede9fe; color: #5b21b6;
          border-radius: 4px; padding: 2px 8px; font-size: 11px;
        }

        /* Input */
        #input-area {
          padding: 10px 12px; border-top: 1px solid #e5e7eb;
          display: flex; gap: 8px; align-items: center; flex-shrink: 0;
        }
        #chat-input {
          flex: 1; border: 1px solid #d1d5db; border-radius: 8px;
          padding: 8px 11px; font-size: 14px; outline: none;
          font-family: inherit; height: 38px;
        }
        #chat-input:focus { border-color: ${p}; }
        #send-btn {
          background: ${p}; color: white; border: none; border-radius: 8px;
          width: 38px; height: 38px; cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          transition: opacity 0.15s;
        }
        #send-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        #send-btn:hover:not(:disabled) { opacity: 0.88; }
      </style>

      <!-- Floating bubble -->
      <button id="bubble" aria-label="Open chat with our docs">
        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
      </button>

      <!-- Chat panel -->
      <div id="panel" role="dialog" aria-modal="true" aria-label="Chat">
        <div id="header">
          <span id="header-title">Ask our docs</span>
          <button id="close-btn" aria-label="Close chat">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div id="messages">
          <p class="welcome">${esc(config.welcomeMessage)}</p>
          ${
            config.suggestedQuestions?.length
              ? `<div class="suggestions">${config.suggestedQuestions
                  .map(
                    (q) =>
                      `<button class="suggestion-btn" data-q="${esc(q)}">${esc(q)}</button>`,
                  )
                  .join("")}</div>`
              : ""
          }
        </div>

        <div id="input-area">
          <input id="chat-input" type="text" placeholder="Ask a question…" autocomplete="off" />
          <button id="send-btn" aria-label="Send message">
            <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Cache DOM refs
    panel = shadow.getElementById("panel");
    messagesEl = shadow.getElementById("messages");
    inputEl = shadow.getElementById("chat-input");
    sendBtn = shadow.getElementById("send-btn");

    // Wire up events
    shadow.getElementById("bubble").addEventListener("click", togglePanel);
    shadow.getElementById("close-btn").addEventListener("click", closePanel);
    sendBtn.addEventListener("click", sendMessage);
    inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    shadow.querySelectorAll(".suggestion-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        inputEl.value = btn.getAttribute("data-q");
        sendMessage();
      });
    });
  }

  // ── 5. Helpers ────────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }

  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    inputEl.focus();
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
  }

  function appendMessage(role, content) {
    const div = document.createElement("div");
    div.className = `msg ${role}`;
    div.textContent = content;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return div;
  }

  // ── 6. Send message + stream response ────────────────────────
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isStreaming) return;

    isStreaming = true;
    inputEl.value = "";
    sendBtn.disabled = true;

    // Show user bubble + add to state
    appendMessage("user", text);
    messages.push({ role: "user", content: text });

    // Placeholder while waiting
    const assistantDiv = appendMessage("assistant", "…");
    assistantDiv.classList.add("thinking");

    try {
      const res = await fetch(`${BASE_URL}/api/widget/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
        body: JSON.stringify({ messages }),
      });

      assistantDiv.classList.remove("thinking");

      if (res.status === 429) {
        assistantDiv.textContent =
          "⚠️ Too many requests — please wait a moment and try again.";
        return;
      }
      if (!res.ok) {
        assistantDiv.textContent = "Something went wrong. Please try again.";
        return;
      }

      // Sources arrive in the header (before the body stream starts)
      const sourcesRaw = res.headers.get("X-Sources");
      const sources = sourcesRaw ? JSON.parse(sourcesRaw) : [];

      // Stream plain text tokens
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      assistantDiv.textContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        assistantDiv.textContent = fullText;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }

      // Append source chips below the answer
      if (sources.length > 0) {
        const sourcesDiv = document.createElement("div");
        sourcesDiv.className = "sources";
        sources.forEach((s) => {
          const chip = document.createElement("span");
          chip.className = "source-chip";
          chip.textContent = `📄 ${s.title}`;
          sourcesDiv.appendChild(chip);
        });
        assistantDiv.appendChild(sourcesDiv);
      }

      messages.push({ role: "assistant", content: fullText });
    } catch (e) {
      assistantDiv.classList.remove("thinking");
      assistantDiv.textContent =
        "Connection error. Check your network and try again.";
    } finally {
      isStreaming = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  // ── 7. Boot ───────────────────────────────────────────────────
  async function boot() {
    await fetchConfig(); // get colors + welcome message first
    render(); // then render with correct config
  }

  // Wait for DOM to be ready before injecting the widget
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
