import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { restockLines, restockRequests } from "@/db/schema";
import { fail, ok, requireWholesaler, route } from "@/lib/api";
import { restockQuotes } from "@/lib/validators";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * Submit or update quotes on a request. qty 0 means the item cannot be supplied.
 * Only lines that have not been accepted yet can be quoted.
 */
export const PATCH = route<Ctx>(async (req, ctx) => {
  const { wholesaler } = await requireWholesaler();
  const { id } = await ctx.params;
  const body = restockQuotes.parse(await req.json());
  const [request] = await db
    .select()
    .from(restockRequests)
    .where(and(eq(restockRequests.id, id), eq(restockRequests.wholesalerId, wholesaler.id)))
    .limit(1);
  if (!request) fail(404, "Request not found");

  const lineIds = body.quotes.map((q) => q.lineId);
  const lines = await db
    .select()
    .from(restockLines)
    .where(and(eq(restockLines.requestId, request.id), inArray(restockLines.id, lineIds)));
  if (lines.length !== lineIds.length) fail(400, "Some items do not belong to this request");
  if (lines.some((l) => l.status === "accepted" || l.status === "received")) fail(409, "Accepted items can no longer be re-quoted");

  await db.transaction(async (tx) => {
    for (const q of body.quotes) {
      const declined = q.qty === 0;
      await tx
        .update(restockLines)
        .set({
          quotePrice: declined ? null : String(q.price),
          quoteQty: q.qty,
          status: declined ? "declined" : "quoted",
          updatedAt: new Date(),
        })
        .where(eq(restockLines.id, q.lineId));
    }
    await tx.update(restockRequests).set({ status: "quoted", updatedAt: new Date() }).where(eq(restockRequests.id, request.id));
  });
  return ok({ quoted: body.quotes.length, requestId: request.id });
});
