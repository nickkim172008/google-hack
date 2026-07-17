"use client";

/**
 * Floating "matchday assistant" — a scripted chatbot (no live LLM). Answers
 * are keyword-matched against the current replay state via lib/chatbot.ts,
 * grounded in the same seeded data driving the rest of the app. Suggested
 * chips guarantee a good answer even when free-text input doesn't match.
 */
import { useEffect, useRef, useState } from "react";
import { answerQuestion, SUGGESTED_QUESTIONS, type ChatContext } from "@/lib/chatbot";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  pending?: boolean;
}

let seq = 0;

export default function Chatbot(ctx: ChatContext) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "bot",
      text: "Ask me about your plan — leave times, things to do before the match, route reasoning, crowd risk, delays, or what's happening nearby.",
    },
  ]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

  const ask = (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || thinking) return;
    const answer = answerQuestion(trimmed, ctx);
    const botId = `b-${seq++}`;
    setMessages((m) => [
      ...m,
      { id: `u-${seq++}`, role: "user", text: trimmed },
      { id: botId, role: "bot", text: "", pending: true },
    ]);
    setInput("");
    setThinking(true);
    replyTimer.current = setTimeout(() => {
      setMessages((m) =>
        m.map((msg) => (msg.id === botId ? { ...msg, text: answer, pending: false } : msg))
      );
      setThinking(false);
    }, 900 + Math.random() * 600);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close matchday assistant" : "Open matchday assistant"}
        aria-expanded={open}
        className="pointer-events-auto fixed bottom-4 right-4 z-[1150] grid h-12 w-12 place-items-center rounded-full border border-slate-200 bg-white/90 text-xl shadow-2xl shadow-slate-900/20 backdrop-blur-md transition-transform hover:scale-105 dark:border-white/10 dark:bg-slate-900/90 dark:shadow-black/50"
      >
        <span aria-hidden>{open ? "✕" : "💬"}</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Matchday assistant"
          className="pointer-events-auto fixed bottom-20 right-4 z-[1150] flex max-h-[60dvh] w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-900/20 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/95 dark:shadow-black/50"
        >
          <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
            <span className="grid h-6 w-6 place-items-center rounded-lg bg-gradient-to-br from-emerald-300 to-emerald-500 text-xs">
              💬
            </span>
            <p className="text-xs font-semibold text-slate-900 dark:text-white">Matchday assistant</p>
          </div>

          <div
            ref={scrollRef}
            className="scroll-area flex-1 space-y-2.5 overflow-y-auto overscroll-contain p-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`animate-fade-slide max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
                  m.role === "user"
                    ? "ml-auto bg-emerald-500 text-white dark:bg-emerald-400 dark:text-emerald-950"
                    : "bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-white/80"
                }`}
              >
                {m.pending ? (
                  <span className="inline-flex items-center gap-1 py-1" aria-label="Assistant is thinking">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-white/50"
                        style={{ animationDelay: `${i * 0.18}s` }}
                      />
                    ))}
                  </span>
                ) : (
                  m.text
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-slate-200 p-3 dark:border-white/10">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => ask(q)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-medium text-slate-600 transition-colors hover:border-emerald-400 hover:text-emerald-700 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/60 dark:hover:border-emerald-400/50 dark:hover:text-emerald-300"
              >
                {q}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-slate-200 p-3 dark:border-white/10"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] text-slate-900 outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:focus:border-emerald-400/50"
            />
            <button
              type="submit"
              aria-label="Send"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-sm text-white transition-transform hover:scale-105 dark:bg-emerald-400 dark:text-emerald-950"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
