import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { ok, requireUser, route, fail } from "@/lib/api";
import { orderLines } from "@/lib/validators";
import { priceOrder } from "@/lib/orders";
import { refreshStore } from "@/lib/store-status";

export const dynamic = "force-dynamic";

/** Server-side price preview: includes agreed bargain prices and GST breakdown. */
export const POST = route(async (req) => {
  const user = await requireUser("customer");
  const input = orderLines.parse(await req.json());
  const rows = await db.select().from(stores).where(eq(stores.id, input.storeId)).limit(1);
  if (!rows[0]) fail(404, "Store not found");
  const store = await refreshStore(rows[0]);
  const priced = await priceOrder(store, user.id, input);
  return ok({ quote: priced, storeOpen: store.isOpen });
});
