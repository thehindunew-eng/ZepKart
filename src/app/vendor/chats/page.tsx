"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { EmptyState, Skeleton } from "@/components/ui";
import { inr, timeAgo } from "@/lib/utils";

type Thread = { id: string; type: string; fulfillment: string | null; status: string; offerPrice: string | null; lastMessageAt: string; customer?: { name: string } | null; product?: { name: string; imageUrl: string | null; price: string } | null; preview: string };
type Msg = { id: string; content: string; senderId: string | null; offerPrice: string | null; createdAt: string; sender?: { name: string } | null };

export default function VendorChats() {
  const { user, store } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadThreads = async () => {
    if (!store) return;
    const r = await fetch(`/api/threads?storeId=${store.id}`, { cache: "no-store" }).then((x) => x.json());
    setThreads(r.threads ?? []);
    setLoading(false);
    if (!active && r.threads?.length) setActive(r.threads[0].id);
  };
  const loadMsgs = async (id: string) => {
    const r = await fetch(`/api/threads/${id}`, { cache: "no-store" }).then((x) => x.json());
    setMsgs(r.messages ?? []);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  useEffect(() => {
    loadThreads();
    const t = setInterval(loadThreads, 6000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store?.id]);

  useEffect(() => {
    if (active) {
      loadMsgs(active);
      const t = setInterval(() => loadMsgs(active), 4000);
      return () => clearInterval(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const send = async () => {
    if (!active || !text.trim()) return;
    const optimistic: Msg = { id: "tmp", content: text, senderId: user?.id ?? null, offerPrice: null, createdAt: new Date().toISOString(), sender: { name: "You" } };
    setMsgs((m) => [...m, optimistic]);
    setText("");
    await fetch(`/api/threads/${active}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: optimistic.content }) });
    loadMsgs(active);
  };

  const setStatus = async (status: string) => {
    if (!active) return;
    await fetch(`/api/threads/${active}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    loadThreads();
  };

  const acceptOffer = async () => {
    const t = threads.find((x) => x.id === active);
    if (!t?.offerPrice || !active) return;
    await fetch(`/api/threads/${active}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: `✅ Accepted! ${inr(t.offerPrice)} confirmed for ${t.fulfillment}. I'll pack it now.` }) });
    await fetch(`/api/threads/${active}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "accepted" }) });
    loadMsgs(active);
    loadThreads();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-black">💬 Customer chats</h1>
        <p className="text-[13px] text-gray-500">Every item has its own thread — bargain, delivery & pickup requests land here live.</p>
      </div>
      {loading ? <Skeleton className="h-96" /> : threads.length === 0 ? <EmptyState title="No chats yet" hint="When customers tap 'Bargain in chat' on any item, threads appear here." />
        : (
          <div className="grid overflow-hidden rounded-3xl border border-gray-200 bg-white md:grid-cols-[280px_1fr]">
            <div className="max-h-[70vh] overflow-y-auto border-b border-gray-100 md:border-b-0 md:border-r">
              {threads.map((t) => (
                <button key={t.id} onClick={() => setActive(t.id)} className={`block w-full border-b border-gray-50 px-4 py-3 text-left ${active === t.id ? "bg-green-50" : "hover:bg-gray-50"}`}>
                  <div className="flex items-center gap-2">
                    {t.product?.imageUrl && <img src={t.product.imageUrl} className="h-9 w-9 rounded-xl object-cover" alt="" />}
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-black">{t.customer?.name ?? "Customer"}</span>
                      <span className="block truncate text-[11.5px] text-gray-500">{t.product?.name ?? t.type}</span>
                    </span>
                    <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${t.status === "open" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>{t.status}</span>
                  </div>
                  <p className="mt-1 truncate text-[12px] text-gray-500">{t.preview}</p>
                  <p className="mt-0.5 text-[11px] text-gray-400">{t.type} · {t.fulfillment} {t.offerPrice ? `· 💰 ${inr(t.offerPrice)}` : ""} · {timeAgo(t.lastMessageAt)}</p>
                </button>
              ))}
            </div>
            <div className="flex min-h-[60vh] flex-col">
              {(() => {
                const t = threads.find((x) => x.id === active);
                return t ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="text-[13px] font-black">{t.customer?.name} · {t.product?.name}</span>
                      {t.offerPrice && <span className="rounded-full bg-green-700 px-2.5 py-1 text-[11px] font-black text-white">Offer {inr(t.offerPrice)}</span>}
                      <span className="ml-auto flex gap-1.5">
                        {t.offerPrice && t.status === "open" && <button onClick={acceptOffer} className="rounded-lg bg-green-700 px-3 py-1.5 text-[12px] font-black text-white">Accept offer</button>}
                        {t.status === "open" ? <button onClick={() => setStatus("closed")} className="rounded-lg bg-gray-200 px-3 py-1.5 text-[12px] font-black">Close</button>
                          : <button onClick={() => setStatus("open")} className="rounded-lg bg-gray-200 px-3 py-1.5 text-[12px] font-black">Reopen</button>}
                      </span>
                    </div>
                    <div className="max-h-[50vh] flex-1 space-y-2.5 overflow-y-auto bg-[#f8faf8] p-4">
                      {msgs.map((m) => {
                        const mine = m.senderId === user?.id;
                        return (
                          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] px-3.5 py-2.5 text-[13.5px] ${mine ? "chat-bubble-me" : "chat-bubble-them"}`}>
                              {!mine && <p className="mb-0.5 text-[11px] font-black text-green-700">{m.sender?.name ?? "Customer"}</p>}
                              <p>{m.content}</p>
                              {m.offerPrice && <p className="mt-1 inline-block rounded-lg bg-green-100 px-2 py-0.5 text-[12px] font-black text-green-800">💰 {inr(m.offerPrice)}</p>}
                              <p className={`mt-1 text-[10px] ${mine ? "text-white/60" : "text-gray-400"}`}>{timeAgo(m.createdAt)}</p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={bottomRef} />
                    </div>
                    <div className="flex gap-2 border-t border-gray-100 p-3">
                      <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Reply as store…" className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-[13.5px] outline-none focus:border-green-600" />
                      <button onClick={send} className="rounded-xl bg-neutral-900 px-5 py-2.5 text-[13.5px] font-black text-white">Send</button>
                    </div>
                    <div className="flex gap-2 px-3 pb-3">
                      {(["Yes, available! Packing now 👍", "Delivery in 30 mins 🛵", "Pickup ready in 15 mins 🏃"] as const).map((q) => (
                        <button key={q} onClick={() => setText(q)} className="rounded-full bg-gray-100 px-3 py-1.5 text-[11.5px] font-bold hover:bg-gray-200">{q}</button>
                      ))}
                    </div>
                  </>
                ) : <p className="grid flex-1 place-items-center p-10 text-[13px] text-gray-400">Select a chat →</p>;
              })()}
            </div>
          </div>
        )}
    </div>
  );
}
