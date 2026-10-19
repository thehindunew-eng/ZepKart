import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payments } from "@/db/schema";
import { ok, requireVendor, route } from "@/lib/api";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const { store } = await requireVendor();
  const rows = await db.select().from(payments).where(eq(payments.storeId, store.id)).orderBy(desc(payments.createdAt)).limit(100);
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
