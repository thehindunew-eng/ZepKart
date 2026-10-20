import { desc } from "drizzle-orm";
import { db } from "@/db";
import { supportTickets } from "@/db/schema";
import { ok, requireAdmin, route } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(300);
  return ok({ tickets: rows });
});
