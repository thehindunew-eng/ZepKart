"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { ChatThread } from "@/components/ChatThread";
import { Badge, EmptyState, Glass, Skeleton } from "@/components/ui";
import { ProductImage } from "@/components/ui";
import { cn, money } from "@/lib/utils";
import { formatTimeIst } from "@/lib/time";

type ThreadRow = {
  id: string;
  status: string;
  agreedPrice: number | null;
  unread: number;
  lastMessageAt: string;
  preview: string | null;
  product: { id: string; name: string; imageUrl: string | null; price: number };
  store: { id: string; shopName: string; dpUrl: string | null };
};

/** Shared chat inbox. Customers see their item chats; vendors see every customer chat for the store. */
export function ChatsView({ mode }: { mode: "customer" | "vendor" }) {
  const { data, loading } = useApi<{ threads: ThreadRow[] }>("/api/threads", { poll: 5000 });
  const [selected, setSelected] = useState<string | null>(null);
  const threads = data?.threads ?? [];
  const active = threads.find((t) => t.id === selected) ?? threads[0] ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <Glass className="flex max-h-[72vh] flex-col overflow-hidden !rounded-[28px]">
        <div className="flex items-center justify-between border-b border-ink/5 px-5 py-4">
          <p className="text-[15px] font-extrabold">{mode === "vendor" ? "Customer chats" : "Your chats"}</p>
          <span className="text-[12px] font-bold text-ink/50">{threads.length}</span>
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {loading && !data && [0, 1, 2].map((i) => <Skeleton key={i} className="h-[72px] rounded-2xl" />)}
          {!loading && threads.length === 0 && (
            <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="No chats yet" body={mode === "vendor" ? "When a customer asks about an item, the chat shows up here." : "Ask a store about an item from its product page."} />
          )}
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(t.id)}
              className={cn("flex w-full items-center gap-3 rounded-2xl p-3 text-left transition", active?.id === t.id ? "bg-ink text-white shadow-lg" : "hover:bg-white/70")}
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/60">
                <ProductImage src={t.product.imageUrl} category="Grocery" alt="" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-[13.5px] font-extrabold">{mode === "vendor" ? t.product.name : t.store.shopName}</p>
                  <span className={cn("shrink-0 text-[11px] font-semibold", active?.id === t.id ? "text-white/60" : "text-ink/45")}>{formatTimeIst(new Date(t.lastMessageAt))}</span>
                </div>
                <p className={cn("truncate text-[12.5px]", active?.id === t.id ? "text-white/70" : "text-ink/55")}>{t.preview ?? "No messages yet"}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  {t.agreedPrice != null && <Badge tone="green">Agreed {money(t.agreedPrice)}</Badge>}
                  {t.unread > 0 && <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-black text-white">{t.unread} new</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      </Glass>

      <div className="min-w-0">
        {active ? (
          <ChatThread key={active.id} mode={mode} threadId={active.id} productId={active.product.id} signedIn />
        ) : (
          <Glass className="grid min-h-[420px] place-items-center p-8">
            <EmptyState icon={<MessageCircle className="h-6 w-6" />} title={loading ? "Loading chats…" : "Pick a chat to start"} body="Messages update here live." />
          </Glass>
        )}
      </div>
    </div>
  );
}
