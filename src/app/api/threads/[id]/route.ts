import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages } from "@/db/schema";
import { ok, requireUser, route } from "@/lib/api";
import { publicMessage, threadAccess, clearRead } from "@/lib/threads";
import { publicProduct, vendorProduct, num, publicStore } from "@/lib/dto";
import { refreshStore } from "@/lib/store-status";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const { thread, store, product, side } = await threadAccess(id, user);
  await clearRead(side, id);
  const msgs = await db.select().from(messages).where(eq(messages.threadId, id)).orderBy(asc(messages.createdAt));
  const freshStore = await refreshStore(store!);
  return ok({
    thread: {
      id: thread.id,
      status: thread.status,
      agreedPrice: thread.agreedPrice == null ? null : num(thread.agreedPrice),
      agreedUntil: thread.agreedUntil,
      fulfillment: thread.fulfillment,
    },
    side,
    product: side === "vendor" ? vendorProduct(product!) : publicProduct(product!, freshStore),
    store: publicStore(freshStore),
    messages: msgs.map((m) => publicMessage(m, user.id)),
    // Customers see the bargain rule but never the floor price (publicProduct omits it).
    bargain: { enabled: product!.bargainEnabled },
  });
});
