"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BadgePercent, Send, Truck, Footprints, Check, X, Reply, Store, Loader2 } from "lucide-react";
import { api, useApi } from "@/hooks/useApi";
import { useToast } from "@/components/Toast";
import { Button, Glass } from "@/components/ui";
import { cn, money } from "@/lib/utils";
import { formatDateTimeIst, formatTimeIst } from "@/lib/time";

type Msg = { id: string; kind: string; content: string | null; price: number | null; mode: string | null; state: string; fromMe: boolean; system: boolean; createdAt: string };
type ThreadResp = {
  thread: { id: string; status: string; agreedPrice: number | null; agreedUntil: string | null; fulfillment: string | null };
  side: "vendor" | "customer";
  product: { id: string; name: string; price: number; bargainEnabled: boolean; floorPrice?: number | null; imageUrl: string | null; weightLabel: string };
  store: { id: string; shopName: string; whatsapp: string | null; pickupAvailable: boolean; deliveryAvailable: boolean };
  messages: Msg[];
  bargain: { enabled: boolean };
};

type Props = {
  mode: "customer" | "vendor";
  threadId: string | null;
  productId: string;
  onThreadCreated?: (id: string) => void;
  loginHref?: string;
  signedIn: boolean;
};

export function ChatThread({ mode, threadId, productId, onThreadCreated, loginHref, signedIn }: Props) {
  const [tid, setTid] = useState<string | null>(threadId);
  const [prevThreadId, setPrevThreadId] = useState<string | null>(threadId);
  if (threadId !== prevThreadId) {
    setPrevThreadId(threadId);
    setTid(threadId);
  }
  const { data, reload } = useApi<ThreadResp>(tid ? `/api/threads/${tid}` : null, { poll: 4000 });
  const [text, setText] = useState("");
  const [offer, setOffer] = useState("");
  const [showOffer, setShowOffer] = useState(false);
  const [counterFor, setCounterFor] = useState<{ id: string; value: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [optimistic, setOptimistic] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [data?.messages.length, optimistic.length]);

  const ensureThread = async () => {
    if (tid) return tid;
    const r = await api<{ thread: { id: string } }>("/api/threads", { json: { productId } });
    setTid(r.thread.id);
    onThreadCreated?.(r.thread.id);
    return r.thread.id;
  };

  const send = async (payload: Record<string, unknown>) => {
    setBusy(true);
    try {
      const id = await ensureThread();
      await api(`/api/threads/${id}/messages`, { json: payload });
      await reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  const sendText = () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    const tmpId = `tmp-${Date.now()}`;
    setOptimistic((o) => [...o, { id: tmpId, kind: "text", content, price: null, mode: null, state: "none", fromMe: true, system: false, createdAt: new Date().toISOString() }]);
    send({ kind: "text", content }).finally(() => setOptimistic((o) => o.filter((m) => m.id !== tmpId || m.content !== content)));
  };

  const sendOffer = async () => {
    const p = Number(offer);
    if (!p || p <= 0) return toast("Enter a price to offer", "error");
    setOffer("");
    setShowOffer(false);
    send({ kind: "offer", price: p });
  };

  const respond = async (msgId: string, body: Record<string, unknown>) => {
    if (!tid) return;
    setBusy(true);
    try {
      await api(`/api/threads/${tid}/messages/${msgId}`, { method: "PATCH", json: body });
      setCounterFor(null);
      await reload();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  };

  if (!signedIn) {
    return (
      <Glass className="flex flex-col items-center gap-3 p-8 text-center">
        <Reply className="h-6 w-6 text-ink/50" />
        <p className="text-[15px] font-extrabold">Log in to chat, bargain and ask for pickup or delivery</p>
        <Link href={loginHref ?? "/auth"}>
          <Button>Log in to chat</Button>
        </Link>
      </Glass>
    );
  }

  const agreed = data?.thread.agreedPrice;
  const canBargain = mode === "customer" && (data?.bargain.enabled ?? true);
  const canRequest = mode === "customer";
  // Optimistic text shows until the server copy arrives in the thread.
  const serverMsgs = data?.messages ?? [];
  const msgs = [...serverMsgs, ...optimistic.filter((o) => !serverMsgs.some((m) => m.fromMe && m.content === o.content))];

  return (
    <Glass className="flex flex-col overflow-hidden !rounded-[28px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/5 px-5 py-4">
        <div className="min-w-0">
          <p className="text-[15px] font-extrabold tracking-tight">{mode === "customer" ? `Chat with ${data?.store.shopName ?? "the store"}` : "Customer chat"}</p>
          <p className="truncate text-[12.5px] text-ink/55">About {data?.product.name ?? "this item"}</p>
          {mode === "vendor" && data?.product.floorPrice != null && (
            <p className="mt-0.5 text-[11.5px] font-bold text-violet-800">Auto-accept at {money(data.product.floorPrice)} and above (private)</p>
          )}
        </div>
        {mode === "customer" && data && <Link href={`/stores/${data.store.id}`} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/80 bg-white/70 px-3 text-[12.5px] font-bold shadow-sm hover:bg-white"><Store className="h-3.5 w-3.5" /> Visit store</Link>}
      </div>

      {agreed != null && data?.thread.agreedUntil && (
        <div className="flex items-center gap-2 bg-emerald-100/70 px-5 py-2.5 text-[12.5px] font-bold text-emerald-900">
          <BadgePercent className="h-4 w-4" /> Agreed price {money(agreed)} · book by {formatDateTimeIst(data.thread.agreedUntil)}
        </div>
      )}

      <div className="flex max-h-[420px] min-h-[260px] flex-col gap-2.5 overflow-y-auto px-4 py-4 sm:px-5">
        {!tid && <p className="my-auto text-center text-[13px] text-ink/55">Say hello to start the conversation. Your first message opens this chat.</p>}
        {tid && !data && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-ink/40" /></div>}
        {tid && data && msgs.length === 0 && <p className="my-auto text-center text-[13px] text-ink/55">No messages yet. Ask about freshness, bulk prices or delivery.</p>}
        {msgs.map((m) => {
          if (m.system) return <p key={m.id} className="my-1 text-center text-[11.5px] font-semibold text-ink/50">{m.content}</p>;
          const mine = m.fromMe;
          const time = formatTimeIst(new Date(m.createdAt));
          if (m.kind === "offer" || m.kind === "fulfillment") {
            const isOffer = m.kind === "offer";
            const pending = m.state === "pending";
            const canAct = pending && !mine && !!tid;
            const stateTone = m.state === "accepted" ? "text-emerald-700" : m.state === "declined" ? "text-red-700" : m.state === "countered" ? "text-amber-700" : "text-ink/60";
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("glass-strong max-w-[82%] rounded-[20px] px-4 py-3", mine && "ring-1 ring-emerald-700/20")}>
                  <p className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase tracking-wider text-ink/50">
                    {isOffer ? <BadgePercent className="h-3.5 w-3.5" /> : m.mode === "pickup" ? <Footprints className="h-3.5 w-3.5" /> : <Truck className="h-3.5 w-3.5" />}
                    {isOffer ? (mine ? "Your offer" : "Offer") : mine ? `Asked for ${m.mode}` : `Requested ${m.mode}`}
                  </p>
                  <p className="mt-1 text-[18px] font-black tabular-nums">{isOffer ? money(m.price) : m.mode === "pickup" ? "Pickup from store" : "Home delivery"}</p>
                  {m.content && <p className="mt-0.5 text-[13px] text-ink/70">{m.content}</p>}
                  <p className={cn("mt-1 text-[12px] font-bold capitalize", stateTone)}>{m.state === "pending" ? "Waiting for reply" : m.state}</p>
                  {canAct && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" disabled={busy} onClick={() => respond(m.id, { action: "accept" })}><Check className="h-3.5 w-3.5" /> Accept</Button>
                      {isOffer && mode === "vendor" && (
                        <Button size="sm" variant="soft" disabled={busy} onClick={() => setCounterFor({ id: m.id, value: String(m.price ?? "") })}>Counter</Button>
                      )}
                      <Button size="sm" variant="soft" disabled={busy} onClick={() => respond(m.id, { action: "decline" })}><X className="h-3.5 w-3.5" /> Decline</Button>
                    </div>
                  )}
                  {counterFor?.id === m.id && (
                    <div className="mt-3 flex gap-2">
                      <input className="field !py-2" inputMode="decimal" value={counterFor.value} onChange={(e) => setCounterFor({ id: m.id, value: e.target.value })} aria-label="Counter price" />
                      <Button size="sm" disabled={busy} onClick={() => respond(m.id, { action: "counter", price: Number(counterFor.value) })}>Send</Button>
                    </div>
                  )}
                  <p className="mt-2 text-right text-[10.5px] font-semibold text-ink/40">{time}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[78%] rounded-[20px] px-4 py-2.5 text-[14px] leading-relaxed shadow-sm", mine ? "rounded-br-md bg-ink text-white" : "glass-strong rounded-bl-md text-ink")}>
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className={cn("mt-1 text-right text-[10.5px] font-semibold", mine ? "text-white/55" : "text-ink/40")}>{time}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {showOffer && canBargain && (
        <div className="flex items-center gap-2 border-t border-ink/5 bg-amber-50/60 px-4 py-3 sm:px-5">
          <span className="text-[13px] font-bold">Your price ₹</span>
          <input className="field !w-32 !py-2" inputMode="decimal" placeholder={String(data?.product.price ?? "")} value={offer} onChange={(e) => setOffer(e.target.value)} aria-label="Offer price" />
          <Button size="sm" disabled={busy} onClick={sendOffer}>Send offer</Button>
          <button className="ml-auto text-[12.5px] font-bold text-ink/60" onClick={() => setShowOffer(false)}>Cancel</button>
        </div>
      )}

      <div className="border-t border-ink/5 p-3 sm:p-4">
        {canRequest && tid && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {canBargain && !showOffer && <Button size="sm" variant="gold" onClick={() => setShowOffer(true)}><BadgePercent className="h-3.5 w-3.5" /> Make an offer</Button>}
            {data?.store.pickupAvailable && <Button size="sm" variant="soft" disabled={busy} onClick={() => send({ kind: "fulfillment", mode: "pickup" })}><Footprints className="h-3.5 w-3.5" /> Ask for pickup</Button>}
            {data?.store.deliveryAvailable && <Button size="sm" variant="soft" disabled={busy} onClick={() => send({ kind: "fulfillment", mode: "delivery" })}><Truck className="h-3.5 w-3.5" /> Ask for delivery</Button>}
          </div>
        )}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendText();
          }}
        >
          <input className="field !rounded-full" value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} placeholder={mode === "customer" ? "Ask about freshness, bulk price, timing…" : "Reply to the customer…"} aria-label="Message" />
          <Button type="submit" disabled={!text.trim() || busy} className="!h-11 !w-11 !px-0" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </Glass>
  );
}
