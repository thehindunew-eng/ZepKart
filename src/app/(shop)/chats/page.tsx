"use client";

import { useAuth } from "@/components/AuthProvider";
import { ChatsView } from "@/components/ChatsView";
import { Button, EmptyState, Glass, Skeleton } from "@/components/ui";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

export default function ChatsPage() {
  const { user, loading } = useAuth();
  if (loading) return <Skeleton className="h-96" />;
  if (!user) {
    return (
      <Glass>
        <EmptyState icon={<MessageCircle className="h-6 w-6" />} title="Log in to see your chats" action={<Link href="/auth?next=/chats"><Button>Log in</Button></Link>} />
      </Glass>
    );
  }
  if (user.role === "vendor") {
    return (
      <Glass>
        <EmptyState title="Customer chats live in your dashboard" action={<Link href="/vendor/chats"><Button>Open vendor chats</Button></Link>} />
      </Glass>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-black tracking-tight">Chats</h1>
        <p className="text-[14px] text-ink/55">Talk to stores about any item, make an offer, or ask for pickup or delivery.</p>
      </div>
      <ChatsView mode="customer" />
    </div>
  );
}
