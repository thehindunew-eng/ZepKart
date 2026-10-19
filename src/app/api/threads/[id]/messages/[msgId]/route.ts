import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { messages, threads } from "@/db/schema";
import { AGREED_WINDOW_MS, addMessage, publicMessage, threadAccess } from "@/lib/threads";
import { fail, ok, requireUser, route } from "@/lib/api";
import { messageRespond } from "@/lib/validators";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string; msgId: string }> };

/** Accept, decline or counter an offer, or confirm / decline a pickup or delivery request. */
export const PATCH = route<Ctx>(async (req, ctx) => {
  const user = await requireUser();
  const { id, msgId } = await ctx.params;
  const body = messageRespond.parse(await req.json());
  const { product, side } = await threadAccess(id, user);
  const [msg] = await db.select().from(messages).where(and(eq(messages.id, msgId), eq(messages.threadId, id))).limit(1);
  if (!msg) fail(404, "Message not found");
  if (msg.senderId === user.id) fail(409, "You can't respond to your own message");
  if (msg.state !== "pending") fail(409, "This has already been answered");
  if (msg.kind !== "offer" && msg.kind !== "fulfillment") fail(409, "Nothing to respond to");
  if (msg.kind === "fulfillment" && body.action === "counter") fail(409, "Requests can only be confirmed or declined");

  const result = await db.transaction(async (tx) => {
    if (body.action === "decline") {
      await tx.update(messages).set({ state: "declined" }).where(eq(messages.id, msgId));
      await addMessage(tx, id, side, { senderId: null, kind: "system", content: msg.kind === "offer" ? "Offer declined." : "Request declined." });
      return null;
    }
    if (body.action === "counter") {
      const listPrice = num(product!.price);
      if (body.price > listPrice) fail(400, `Counter must be at most ₹${listPrice}`);
      await tx.update(messages).set({ state: "countered" }).where(eq(messages.id, msgId));
      return addMessage(tx, id, side, { senderId: user.id, kind: "offer", price: body.price, state: "pending" });
    }
    // accept
    await tx.update(messages).set({ state: "accepted" }).where(eq(messages.id, msgId));
    if (msg.kind === "offer") {
      const price = num(msg.price);
      await tx
        .update(threads)
        .set({ status: "agreed", agreedPrice: String(price), agreedUntil: new Date(Date.now() + AGREED_WINDOW_MS) })
        .where(eq(threads.id, id));
      await addMessage(tx, id, side, { senderId: null, kind: "system", content: `Agreed at ₹${price}. Book within 24 hours to lock this price.` });
    } else {
      await tx.update(threads).set({ fulfillment: msg.mode }).where(eq(threads.id, id));
      await addMessage(tx, id, side, { senderId: null, kind: "system", content: `Confirmed: ${msg.mode === "pickup" ? "pickup from store" : "home delivery"}.` });
    }
    return null;
  });

  const [fresh] = await db.select().from(messages).where(eq(messages.id, msgId)).limit(1);
  return ok({ message: publicMessage(fresh, user.id), reply: result ? publicMessage(result, user.id) : null });
});
