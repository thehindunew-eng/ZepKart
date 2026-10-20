import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { ok, requireAdRequester, route } from "@/lib/api";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";

/** Payment history for the signed-in vendor store or wholesaler. */
export const GET = route(async () => {
  const { storeId, wholesalerId } = await requireAdRequester();
  const scope = storeId ? eq(payments.storeId, storeId) : eq(payments.wholesalerId, wholesalerId!);
  const rows = await db.select().from(payments).where(scope).orderBy(desc(payments.createdAt)).limit(100);
  return ok({
    payments: rows.map((p) => ({
      id: p.id,
      reference: p.reference,
      purpose: p.purpose,
      amount: num(p.amount),
      method: p.method,
      masked: p.maskedDetails,
      status: p.status,
      campaignId: p.campaignId,
      createdAt: p.createdAt,
    })),
  });
});
