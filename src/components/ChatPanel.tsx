"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";
import { inr, timeAgo } from "@/lib/utils";
import { btnPrimary, btnGhost } from "./ui";

type Msg = { id: string; content: string; senderId: string | null; offerPrice: string | null; createdAt: string; sender?: { name: string; role: string } | null };
type Thread = { id: string; type: string; offerPrice: string | null; fulfillment: string | null; status: string; customerId: string | null; customer?: { name: string } | null; preview?: string; lastMessageAt?: string; product?: { name: string } | null };

export function ChatPanel({
  productId,
  storeId,
  price,
  compact,
}: {
  productId?: string | null;
  storeId: string;
  price?: number;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [threadMeta, setThreadMeta] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [offer, setOffer] = useState("");
  const [fulfillment, setFulfillment] = useState("delivery");
  const [kind, setKind] = useState("bargain");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    else if (storeId) params.set("storeId", storeId);
    const r = await fetch(`/api/threads?${params.toString()}`, { cache: "no-store" });
    const j = await r.json();
    setThreads(j.threads ?? []);
    if (j.threads?.length && !activeId) setActiveId(j.threads[0].id);
    setLoading(false);
  };

  const loadMsgs = async (id: string) => {
    const r = await fetch(`/api/threads/${id}`, { cache: "no-store" });
    const j = await r.json();
    setMsgs(j.messages ?? []);
    setThreadMeta(j.thread ?? null);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, productId, storeId]);

  useEffect(() => {
    if (activeId) loadMsgs(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // live poll every 5s for active thread
  useEffect(() => {
    if (!activeId) return;
    const t = setInterval(() => loadMsgs(activeId), 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const startChat = async () => {
    if (!user) {
      window.location.href = "/auth?next=" + encodeURIComponent(window.location.pathname);
      return;
    }
    setSending(true);
    const first = text || (offer ? `Hi! I want this for ${inr(offer)} (${fulfillment}). Is it available?` : "Hi! Is this available right now?");
    const r = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, storeId, type: kind, offerPrice: offer || null, fulfillment, content: first }),
    });
    const j = await r.json();
    setSending(false);
    if (j.thread) {
      setText("");
      setOffer("");
      await loadThreads();
      setActiveId(j.thread.id);
    }
  };

  const send = async () => {
    if (!activeId || (!text.trim() && !offer)) return;
    const optimistic: Msg = {
      id: "tmp-" + Date.now(),
      content: text || `Offered ${inr(offer)}`,
      senderId: user?.id ?? null,
      offerPrice: offer || null,
      createdAt: new Date().toISOString(),
      sender: { name: user?.name ?? "You", role: user?.role ?? "" },
    };
    setMsgs((m) => [...m, optimistic]);
    setText("");
    const keepOffer = offer;
    setOffer("");
    setSending(true);
    await fetch(`/api/threads/${activeId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: optimistic.content, offerPrice: keepOffer || null }),
    });
    setSending(false);
    loadMsgs(activeId);
    loadThreads();
  };

  const setStatus = async (status: string) => {
    if (!activeId) return;
    await fetch(`/api/threads/${activeId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    loadThreads();
    if (activeId) loadMsgs(activeId);
  };

  if (!user) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-green-50 to-amber-50 p-6 text-center">
        <p className="text-[15px] font-black">💬 Bargain & chat live with the vendor</p>
        <p className="mx-auto mt-1 max-w-sm text-[13px] text-gray-600">Ask for a better price, confirm delivery or pickup — every item has its own chat thread.</p>
        <a href="/auth" className={`${btnPrimary} mt-4`}>Login to start bargaining</a>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3">
        <p className="text-[13px] font-black">💬 Live item chat {threads.length > 0 && <span className="ml-1 rounded-full bg-gray-900 px-2 py-0.5 text-[11px] text-white">{threads.length}</span>}</p>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
          <span className="h-2 w-2 rounded-full bg-green-500 live-dot" /> auto-refreshes
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-12 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : threads.length === 0 ? (
        <div className="p-4 sm:p-5">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-[13px] font-black">Start a new conversation</p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["bargain", "delivery", "pickup"] as const).map((k) => (
                <button key={k} onClick={() => { setKind(k); setFulfillment(k === "pickup" ? "pickup" : "delivery"); }} className={`rounded-xl border px-2 py-2 text-[12px] font-bold capitalize ${kind === k ? "border-green-700 bg-green-700 text-white" : "border-gray-200 bg-white"}`}>
                  {k === "bargain" ? "🤝 Bargain" : k === "delivery" ? "🛵 Delivery" : "🏃 Pickup"}
                </button>
              ))}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input value={offer} onChange={(e) => setOffer(e.target.value)} type="number" placeholder={price ? `Your offer (listed ${inr(price)})` : "Your offer ₹"} className="rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] outline-none focus:border-green-600" />
              <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value)} className="rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] outline-none">
                <option value="delivery">🛵 Home delivery</option>
                <option value="pickup">🏃 Store pickup</option>
              </select>
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Bhaiya 2kg loge, thoda discount + delivery today evening?" rows={2} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[14px] outline-none focus:border-green-600" />
            <button onClick={startChat} disabled={sending} className={`${btnPrimary} mt-2 w-full`}>{sending ? "Starting..." : "Start chat →"}</button>
          </div>
        </div>
      ) : (
        <div className={compact ? "" : "grid md:grid-cols-[240px_1fr]"}>
          {/* thread list */}
          <div className={`${compact ? "max-h-40 overflow-y-auto border-b" : "max-h-72 overflow-y-auto border-b md:max-h-[420px] md:border-b-0 md:border-r"} border-gray-100`}>
            {threads.map((t) => (
              <button key={t.id} onClick={() => setActiveId(t.id)} className={`block w-full border-b border-gray-50 px-4 py-3 text-left transition ${activeId === t.id ? "bg-green-50" : "hover:bg-gray-50"}`}>
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-bold">{t.customer?.name ?? t.product?.name ?? "Chat"}</span>
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${t.status === "open" ? "bg-green-100 text-green-800" : t.status === "accepted" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-600"}`}>{t.status}</span>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-gray-500">{t.preview || `${t.type} · ${t.fulfillment}`}</p>
                <p className="mt-0.5 flex items-center gap-2 text-[11px] text-gray-400">
                  <span className="rounded bg-gray-100 px-1.5 py-0.5 font-bold uppercase">{t.type}</span>
                  <span>· {t.fulfillment}</span>
                  {t.offerPrice && <span className="font-bold text-green-700">· {inr(t.offerPrice)}</span>}
                </p>
              </button>
            ))}
            <button onClick={() => { setThreads([]); setActiveId(null); setMsgs([]); }} className="block w-full px-4 py-3 text-[12px] font-bold text-green-700 hover:bg-green-50">+ New chat</button>
          </div>
          {/* messages */}
          <div className="flex min-h-[320px] flex-col">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2.5 text-[12px]">
              {threadMeta && (
                <>
                  <span className="rounded-lg bg-gray-100 px-2 py-1 font-bold uppercase">{threadMeta.type}</span>
                  <span className="font-bold text-gray-500">{threadMeta.fulfillment}</span>
                  {threadMeta.offerPrice && <span className="font-black text-green-700">Offer {inr(threadMeta.offerPrice)}</span>}
                  <span className="ml-auto flex gap-1.5">
                    {threadMeta.status === "open" && (
                      <>
                        <button onClick={() => setStatus("accepted")} className="rounded-lg bg-green-700 px-2.5 py-1 font-bold text-white">Accept</button>
                        <button onClick={() => setStatus("closed")} className="rounded-lg bg-gray-100 px-2.5 py-1 font-bold">Close</button>
                      </>
                    )}
                  </span>
                </>
              )}
            </div>
            <div className="max-h-[300px] flex-1 space-y-2.5 overflow-y-auto bg-[#f8faf8] p-4">
              {msgs.length === 0 && <p className="py-8 text-center text-[13px] text-gray-400">Say hi — vendors usually reply in minutes 👋</p>}
              {msgs.map((m) => {
                const mine = m.senderId === user.id;
                return (
                  <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3.5 py-2.5 text-[13.5px] leading-relaxed ${mine ? "chat-bubble-me" : "chat-bubble-them"}`}>
                      {!mine && <p className="mb-0.5 text-[11px] font-black text-green-700">{m.sender?.name ?? "Vendor"}</p>}
                      <p>{m.content}</p>
                      {m.offerPrice && <p className={`mt-1 inline-block rounded-lg px-2 py-0.5 text-[12px] font-black ${mine ? "bg-white/20" : "bg-green-100 text-green-800"}`}>💰 {inr(m.offerPrice)}</p>}
                      <p className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-gray-400"}`}>{timeAgo(m.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
            <div className="border-t border-gray-100 p-3">
              <div className="flex gap-2">
                <input value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="Offer ₹" type="number" className="w-24 rounded-xl border border-gray-200 px-2.5 py-2 text-[13px] outline-none focus:border-green-600" />
                <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message..." className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-[13.5px] outline-none focus:border-green-600" />
                <button onClick={send} disabled={sending || (!text.trim() && !offer)} className={btnPrimary}>➤</button>
              </div>
              <div className="mt-2 flex gap-2">
                <button onClick={() => setText("Is this available for pickup in 30 mins?")} className={btnGhost + " !px-2.5 !py-1.5 !text-[11px]"}>🏃 Pickup in 30m?</button>
                <button onClick={() => setText("Please deliver today evening. Address shared on order.")} className={btnGhost + " !px-2.5 !py-1.5 !text-[11px]"}>🛵 Deliver today?</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
