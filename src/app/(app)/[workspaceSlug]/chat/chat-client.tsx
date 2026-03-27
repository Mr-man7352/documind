"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { SourceChips, Source } from "./source-chips";
import { SourcePanel } from "./source-panel";
import { Send, Square, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface ChatClientProps {
  workspaceId: string;
  hasDocuments: boolean;
  conversationId: string;
  initialMessages?: UIMessage[];
  workspaceSlug: string;
}

export function ChatClient({
  workspaceId,
  hasDocuments,
  conversationId,
  initialMessages,
  workspaceSlug,
}: ChatClientProps) {
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const router = useRouter();
  const pathname = usePathname();
  const hasNavigatedRef = useRef(false);

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { workspaceId, conversationId },
    }),
    messages: initialMessages,
  });

  const isStreaming = status === "streaming" || status === "submitted";

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const isNewChatPage = pathname === `/${workspaceSlug}/chat`;

    if (
      isNewChatPage &&
      !hasNavigatedRef.current &&
      messages.length >= 2 &&
      status === "ready"
    ) {
      hasNavigatedRef.current = true;
      router.push(`/${workspaceSlug}/chat/${conversationId}`);
    }
  }, [messages.length, status]);

  // Auto-grow textarea
  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const el = textareaRef.current;
    if (!el) return;
    const text = el.value.trim();
    if (!text || isStreaming) return;
    sendMessage({ text });
    console.log("my:", text);
    el.value = "";
    el.style.height = "auto";
  }

  return (
    <>
      {!hasDocuments ? (
        <div className="p-4 border rounded-md text-center text-sm text-muted-foreground">
          No documents indexed yet. Please upload and index documents to start
          chatting.
        </div>
      ) : (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
          {/* ── Message list ── */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-3">
                <MessageSquare className="h-10 w-10 opacity-30" />
                <p className="text-sm max-w-xs">
                  Ask anything about your documents. The AI will search through
                  them to find the answer.
                </p>
              </div>
            ) : (
              messages.map((message) => {
                const isUser = message.role === "user";
                const sources =
                  (message.metadata as { sources?: Source[] })?.sources ?? [];
                // Don't render assistant bubble until it has actual text
                const textContent = message.parts
                  .filter((p) => p.type === "text")
                  .map((p) => (p as { type: "text"; text: string }).text)
                  .join("");
                if (!isUser && !textContent)
                  return (
                    <div
                      key={crypto.randomUUID()}
                      className="flex justify-start"
                    >
                      <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                        <span className="flex gap-1 items-center h-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                        </span>
                      </div>
                    </div>
                  );
                else
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isUser ? "justify-end" : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "flex flex-col max-w-[75%]",
                          isUser ? "items-end" : "items-start",
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 text-sm leading-relaxed w-full",
                            isUser
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm",
                          )}
                        >
                          {message.parts.map((part, i) =>
                            part.type === "text" ? (
                              isUser ? (
                                <span key={i} className="whitespace-pre-wrap">
                                  {part.text}
                                </span>
                              ) : (
                                <ReactMarkdown
                                  key={i}
                                  remarkPlugins={[remarkGfm]}
                                  components={{
                                    p: ({ children }) => (
                                      <p className="mb-2 last:mb-0">
                                        {children}
                                      </p>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="list-disc pl-4 mb-2 space-y-1">
                                        {children}
                                      </ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="list-decimal pl-4 mb-2 space-y-1">
                                        {children}
                                      </ol>
                                    ),
                                    li: ({ children }) => <li>{children}</li>,
                                    strong: ({ children }) => (
                                      <strong className="font-semibold">
                                        {children}
                                      </strong>
                                    ),
                                    em: ({ children }) => (
                                      <em className="italic">{children}</em>
                                    ),
                                    code: ({ children, className }) => {
                                      const isBlock =
                                        className?.includes("language-");
                                      return isBlock ? (
                                        <code className="block bg-black/10 rounded-md px-3 py-2 text-xs font-mono my-2 whitespace-pre-wrap overflow-x-auto">
                                          {children}
                                        </code>
                                      ) : (
                                        <code className="bg-black/10 rounded px-1 py-0.5 text-xs font-mono">
                                          {children}
                                        </code>
                                      );
                                    },
                                    pre: ({ children }) => (
                                      <pre className="my-2">{children}</pre>
                                    ),
                                    h1: ({ children }) => (
                                      <h1 className="text-base font-bold mb-1">
                                        {children}
                                      </h1>
                                    ),
                                    h2: ({ children }) => (
                                      <h2 className="text-sm font-bold mb-1">
                                        {children}
                                      </h2>
                                    ),
                                    h3: ({ children }) => (
                                      <h3 className="text-sm font-semibold mb-1">
                                        {children}
                                      </h3>
                                    ),
                                    a: ({ href, children }) => (
                                      <a
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline underline-offset-2 hover:opacity-80"
                                      >
                                        {children}
                                      </a>
                                    ),
                                    blockquote: ({ children }) => (
                                      <blockquote className="border-l-2 border-current/30 pl-3 italic opacity-80 my-2">
                                        {children}
                                      </blockquote>
                                    ),
                                  }}
                                >
                                  {part.text}
                                </ReactMarkdown>
                              )
                            ) : null,
                          )}
                        </div>

                        {/* Source chips — only for assistant messages */}
                        {!isUser && (
                          <SourceChips
                            sources={sources}
                            onSourceClick={(source, index) => {
                              setSelectedSource(source);
                              setSelectedIndex(index);
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* to be tested */}
          {messages.length >= 100 && (
            <div className="mb-3 px-4 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center">
              This conversation is getting long.{" "}
              <Link
                href={`/${workspaceSlug}/chat`}
                className="underline font-medium hover:opacity-80"
              >
                Start a new conversation
              </Link>{" "}
              for better results.
            </div>
          )}
          {/* ── Input bar ── */}
          <div className="border-t pt-4">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                rows={1}
                placeholder="Ask about your documents…"
                disabled={isStreaming}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                className="flex-1 resize-none rounded-xl border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-[200px] leading-relaxed"
              />

              {isStreaming ? (
                <button
                  onClick={() => stop()}
                  className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                  aria-label="Stop generating"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={submit}
                  className="shrink-0 flex items-center justify-center h-10 w-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>

          {/* ── Source panel (slide-in on chip click) ── */}
          <SourcePanel
            source={selectedSource}
            index={selectedIndex}
            onClose={() => setSelectedSource(null)}
          />
        </div>
      )}
    </>
  );
}
