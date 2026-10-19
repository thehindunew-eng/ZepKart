import { eq } from "drizzle-orm";
import { db } from "@/db";
import { threads } from "@/db/schema";
import { AGREED_WINDOW_MS, addMessage, publicMessage, threadAccess } from "@/lib/threads";
import { fail, ok, requireUser, route } from "@/lib/api";
import { messageCreate } from "@/lib/validators";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const POST = route<Ctx>(async (req, ctx) => {
  const user = await requireUser();
  const { id } = await ctx.params;
  const body = messageCreate.parse(await req.json());
  const { store, product, side } = await threadAccess(id, user);
  const senderId = user.id;

  if (body.kind === "text") {
    const m = await addMessage(db, id, side, { senderId, kind: "text", content: body.content });
    return ok({ message: publicMessage(m, user.id) }, 201);
  }

  if (body.kind === "offer") {
    if (!product!.bargainEnabled) fail(409, "Bargaining is not enabled for this item");
    const listPrice = num(product!.price);
    if (body.price > listPrice) fail(400, `Offer must be at most ₹${listPrice}`);
    const floor = product!.floorPrice == null ? null : num(product!.floorPrice);

    // Customer offers at or above the (hidden) floor are accepted automatically.
    const autoAccept = side === "customer" && floor != null && body.price >= floor;
    const agreed = Math.min(body.price, listPrice);
    const m = await db.transaction(async (tx) => {
      const offer = await addMessage(tx, id, side, {
        senderId,
        kind: "offer",
        price: body.price,
        content: body.content,
        state: autoAccept ? "accepted" : "pending",
      });
      if (autoAccept) {
        await tx
          .update(threads)
          .set({ status: "agreed", agreedPrice: String(agreed), agreedUntil: new Date(Date.now() + AGREED_WINDOW_MS) })
          .where(eq(threads.id, id));
        await addMessage(tx, id, side, { senderId: null, kind: "system", content: `Offer accepted at ₹${agreed}. Book within 24 hours to lock this price.` });
      }
      return offer;
    });
    return ok({ message: publicMessage(m, user.id) }, 201);
  }

  // Pickup / delivery request.
  if (body.mode === "pickup" && !store!.pickupAvailable) fail(409, "This store does not offer pickup");
  if (body.mode === "delivery" && !store!.deliveryAvailable) fail(409, "This store does not offer delivery");
  if (side === "vendor") fail(400, "Use confirm or decline on the customer's request");
  const m = await addMessage(db, id, side, { senderId, kind: "fulfillment", mode: body.mode, content: body.content, state: "pending" });
  return ok({ message: publicMessage(m, user.id) }, 201);
});
