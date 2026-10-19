import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { products, restockLines, restockRequests } from "@/db/schema";
import { fail, ok, requirePremium, requireVendor, route } from "@/lib/api";
import { num } from "@/lib/dto";
import { restockLineAction } from "@/lib/validators";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Vendor actions on a wholesaler quote:
 *  accept   (quoted -> accepted)
 *  decline  (quoted -> declined)
 *  received (accepted -> received): adds the quantity to stock and records the new cost.
 */
export const PATCH = route<Ctx>(async (req, ctx) => {
  const { store } = await requireVendor();
  requirePremium(store);
  const { id } = await ctx.params;
  const { action } = restockLineAction.parse(await req.json());

  const [row] = await db
    .select({ line: restockLines, request: restockRequests })
    .from(restockLines)
    .innerJoin(restockRequests, eq(restockLines.requestId, restockRequests.id))
    .where(eq(restockLines.id, id))
    .limit(1);
  if (!row || row.request.storeId !== store.id) fail(404, "Restock item not found");
  const { line, request } = row;

  const updated = await db.transaction(async (tx) => {
    if (action === "accept" || action === "decline") {
      if (line.status !== "quoted") fail(409, "Only a quoted item can be accepted or declined");
      const [u] = await tx
        .update(restockLines)
        .set({ status: action === "accept" ? "accepted" : "declined", updatedAt: new Date() })
        .where(eq(restockLines.id, line.id))
        .returning();
      return u;
    }
    // received
    if (line.status !== "accepted") fail(409, "Accept the quote before marking it received");
    const qty = line.quoteQty ?? line.qty;
    if (line.productId) {
      const [p] = await tx.select().from(products).where(and(eq(products.id, line.productId), eq(products.storeId, store.id))).limit(1);
      if (p) {
        const newStock = p.stockQty + qty;
        await tx
          .update(products)
          .set({ stockQty: newStock, inStock: true, costPrice: line.quotePrice, updatedAt: new Date() })
          .where(eq(products.id, p.id));
      }
    }
    const [u] = await tx.update(restockLines).set({ status: "received", updatedAt: new Date() }).where(eq(restockLines.id, line.id)).returning();
    return u;
  });

  // Keep the request summary in step with its lines.
  const siblings = await db.select({ status: restockLines.status }).from(restockLines).where(eq(restockLines.requestId, request.id));
  const open = siblings.some((s) => ["requested", "quoted", "accepted"].includes(s.status));
  const nextStatus = open ? (siblings.some((s) => s.status === "quoted") ? "quoted" : "open") : "closed";
  await db.update(restockRequests).set({ status: nextStatus, updatedAt: new Date() }).where(eq(restockRequests.id, request.id));

  return ok({
    line: {
      id: updated.id,
      status: updated.status,
      quotePrice: updated.quotePrice == null ? null : num(updated.quotePrice),
      quoteQty: updated.quoteQty,
    },
    requestStatus: nextStatus,
  });
});

