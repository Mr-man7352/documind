(function(){(function(){let e=document.currentScript?.getAttribute(`data-key`)||``;if(!e){console.warn(`[DocuMind] No data-key attribute found on widget script tag.`);return}let t=`http://localhost:3000`,n=!1,r=!1,i=[],a={primaryColor:`#6366f1`,welcomeMessage:`Hi! Ask me anything about our docs.`,suggestedQuestions:[]},o,s,c,l,u;async function d(){try{let n=await fetch(`${t}/api/widget/config?key=${e}`);n.ok&&(a=await n.json())}catch{console.warn(`[DocuMind] Could not load widget config, using defaults.`)}}function f(){let e=document.createElement(`div`);e.id=`documind-widget-host`,document.body.appendChild(e),o=e.attachShadow({mode:`open`});let t=a.primaryColor;o.innerHTML=`
      <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        #bubble {
          position: fixed; bottom: 24px; right: 24px; z-index: 2147483647;
          width: 56px; height: 56px; border-radius: 50%;
          background: ${t}; color: white; border: none; cursor: pointer;
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
          background: ${t}; color: white; padding: 14px 16px;
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
          background: ${t}; color: white;
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
        #chat-input:focus { border-color: ${t}; }
        #send-btn {
          background: ${t}; color: white; border: none; border-radius: 8px;
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
          <p class="welcome">${p(a.welcomeMessage)}</p>
          ${a.suggestedQuestions?.length?`<div class="suggestions">${a.suggestedQuestions.map(e=>`<button class="suggestion-btn" data-q="${p(e)}">${p(e)}</button>`).join(``)}</div>`:``}
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
    `,s=o.getElementById(`panel`),c=o.getElementById(`messages`),l=o.getElementById(`chat-input`),u=o.getElementById(`send-btn`),o.getElementById(`bubble`).addEventListener(`click`,m),o.getElementById(`close-btn`).addEventListener(`click`,g),u.addEventListener(`click`,v),l.addEventListener(`keydown`,e=>{e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),v())}),o.querySelectorAll(`.suggestion-btn`).forEach(e=>{e.addEventListener(`click`,()=>{l.value=e.getAttribute(`data-q`),v()})})}function p(e){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function m(){n?g():h()}function h(){n=!0,s.classList.add(`open`),l.focus()}function g(){n=!1,s.classList.remove(`open`)}function _(e,t){let n=document.createElement(`div`);return n.className=`msg ${e}`,n.textContent=t,c.appendChild(n),c.scrollTop=c.scrollHeight,n}async function v(){let n=l.value.trim();if(!n||r)return;r=!0,l.value=``,u.disabled=!0,_(`user`,n),i.push({role:`user`,content:n});let a=_(`assistant`,`…`);a.classList.add(`thinking`);try{let n=await fetch(`${t}/api/widget/chat`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-API-Key":e},body:JSON.stringify({messages:i})});if(a.classList.remove(`thinking`),n.status===429){a.textContent=`⚠️ Too many requests — please wait a moment and try again.`;return}if(!n.ok){a.textContent=`Something went wrong. Please try again.`;return}let r=n.headers.get(`X-Sources`),o=r?JSON.parse(r):[],s=n.body.getReader(),l=new TextDecoder,u=``;for(a.textContent=``;;){let{done:e,value:t}=await s.read();if(e)break;u+=l.decode(t,{stream:!0}),a.textContent=u,c.scrollTop=c.scrollHeight}if(o.length>0){let e=document.createElement(`div`);e.className=`sources`,o.forEach(t=>{let n=document.createElement(`span`);n.className=`source-chip`,n.textContent=`📄 ${t.title}`,e.appendChild(n)}),a.appendChild(e)}i.push({role:`assistant`,content:u})}catch{a.classList.remove(`thinking`),a.textContent=`Connection error. Check your network and try again.`}finally{r=!1,u.disabled=!1,l.focus()}}async function y(){await d(),f()}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,y):y()})()})();