"use client";

import { useEffect, useRef, useState } from "react";
import { Button, Card, Badge } from "@/components/ui";
import { t } from "@/lib/i18n";

type ChatMessage = {
  id: string;
  senderName: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
};

type FormProps = {
  id: string;
  slug: string;
  title: Record<string, string>;
  description: Record<string, string> | null;
  accentColor: string;
  youtubeVideoId: string | null;
  chatEnabled: boolean;
};

export function WebinarRoomClient({ form }: { form: FormProps }) {
  const [userName, setUserName] = useState<string>("");
  const [inputName, setInputName] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Load name from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`webinar_user_name_${form.id}`);
    if (saved) {
      setUserName(saved);
    }
  }, [form.id]);

  // Connect to SSE stream
  useEffect(() => {
    if (!userName || !form.chatEnabled) return;

    setError(null);
    const es = new EventSource(`/api/forms/${form.id}/chat/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
    };

    es.onerror = () => {
      setConnected(false);
      setError("Chat connection lost. Reconnecting...");
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.id) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, data];
          });
        }
      } catch (err) {
        // Handle keepalive or malformed payloads silently
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [userName, form.id, form.chatEnabled]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Submit name handler
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputName.trim();
    if (clean.length >= 2) {
      setUserName(clean);
      localStorage.setItem(`webinar_user_name_${form.id}`, clean);
    }
  };

  // Send message handler
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = chatInput.trim();
    if (!cleanMsg || !userName) return;

    setChatInput("");
    try {
      const res = await fetch(`/api/forms/${form.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: userName,
          message: cleanMsg,
          isAdmin: false, // will be verified/set on server side
        }),
      });
      if (!res.ok) {
        setError("Failed to send message.");
      }
    } catch {
      setError("Network error. Message not sent.");
    }
  };

  // Change name handler
  const handleLeaveChat = () => {
    localStorage.removeItem(`webinar_user_name_${form.id}`);
    setUserName("");
    setMessages([]);
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    setConnected(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Top Header */}
      <header className="flex items-center justify-between border-b border-slate-900 bg-slate-950 px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-md"
            style={{ backgroundColor: form.accentColor || "#2563eb" }}
          >
            LIVE
          </div>
          <div>
            <h1 className="text-lg font-bold text-white truncate max-w-md sm:max-w-xl">
              {t(form.title as never, "en", "Live Webinar")}
            </h1>
            {form.description && (
              <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                {t(form.description as never, "en")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-red-500 font-semibold uppercase tracking-wider animate-pulse">
            <span className="h-2 w-2 rounded-full bg-red-600"></span>
            En vivo / Live
          </span>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Video Player Container */}
        <div className="flex flex-1 flex-col items-center justify-center bg-black p-4 sm:p-6 lg:p-8">
          {form.youtubeVideoId ? (
            <div className="relative aspect-video w-full max-w-none rounded-xl overflow-hidden shadow-2xl border border-slate-900">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${form.youtubeVideoId}?autoplay=1&rel=0&modestbranding=1`}
                title="Live Webinar Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              ></iframe>
            </div>
          ) : (
            <div className="text-center py-20 flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center animate-ping text-xl">
                📺
              </div>
              <h2 className="text-xl font-bold text-slate-200">El directo comenzará pronto</h2>
              <p className="text-sm text-slate-500 max-w-xs">
                La transmisión en vivo aún no ha sido inicializada por el organizador. Quédate en la sala, comenzará en breve.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Chat Panel */}
        <div className="w-full lg:w-80 flex flex-col border-t lg:border-t-0 lg:border-l border-slate-900 bg-slate-950/80 backdrop-blur h-[450px] lg:h-auto overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-900 px-4 py-3 bg-slate-950">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Live Chat</h2>
            {userName && form.chatEnabled && (
              <button
                onClick={handleLeaveChat}
                className="text-[10px] text-slate-500 hover:text-slate-300 underline"
              >
                Cambiar nombre / Change name
              </button>
            )}
          </div>

          {!form.chatEnabled ? (
            <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-500 text-sm">
              💬 Chat is disabled for this webinar.
            </div>
          ) : !userName ? (
            /* Name Entry Screen */
            <div className="flex-1 flex flex-col justify-center p-6 bg-slate-950">
              <form onSubmit={handleNameSubmit} className="flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-white">Únete al chat / Join the chat</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ingresa tu nombre para poder enviar mensajes e interactuar en directo.
                  </p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="nickname" className="text-xs font-semibold text-slate-300">Nombre / Name</label>
                  <input
                    id="nickname"
                    type="text"
                    required
                    placeholder="Tu nombre..."
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    style={{ color: "#ffffff" }}
                    className="h-11 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 text-sm placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <Button type="submit" className="w-full h-10 text-sm">
                  Entrar al chat
                </Button>
              </form>
            </div>
          ) : (
            /* Chat Stream Room */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Message History Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={
                          "text-xs font-bold " +
                          (msg.isAdmin ? "text-blue-400 font-extrabold" : "text-slate-300")
                        }
                      >
                        {msg.senderName}
                      </span>
                      {msg.isAdmin && (
                        <span className="bg-blue-900/60 text-blue-300 text-[9px] px-1 py-0.2 rounded uppercase font-semibold border border-blue-800">
                          Host
                        </span>
                      )}
                      <span className="text-[9px] text-slate-500">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p
                      className={
                        "text-sm rounded-lg px-3 py-2 max-w-[85%] break-words " +
                        (msg.isAdmin
                          ? "bg-blue-950/40 border border-blue-900 text-blue-100"
                          : "bg-slate-900 text-slate-100")
                      }
                    >
                      {msg.message}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Status and Input Area */}
              <div className="p-3 border-t border-slate-900 bg-slate-950">
                {error && (
                  <div className="text-[10px] text-red-500 pb-2 text-center animate-pulse">
                    {error}
                  </div>
                )}
                {!connected && !error && (
                  <div className="text-[10px] text-slate-500 pb-2 text-center">
                    Connecting to server...
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Envía un mensaje... / Write message..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    style={{ color: "#ffffff" }}
                    className="flex-1 h-10 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs placeholder:text-slate-500 transition-colors focus:border-blue-500 focus:outline-none"
                  />
                  <Button type="submit" size="sm" className="h-10 px-3 bg-blue-600 hover:bg-blue-700">
                    Send
                  </Button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
