"use client";

import { ChatsView } from "@/components/ChatsView";
import { useVendorGate } from "@/components/vendor/useVendorData";
import { Skeleton } from "@/components/ui";

export default function VendorChatsPage() {
  const gate = useVendorGate();
  if (!gate.ready) return <Skeleton className="h-96" />;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[28px] font-black tracking-tight">Chats</h1>
        <p className="text-[14px] text-ink/55">Reply to customers, answer offers and confirm pickup or delivery.</p>
      </div>
      <ChatsView mode="vendor" />
    </div>
  );
}
