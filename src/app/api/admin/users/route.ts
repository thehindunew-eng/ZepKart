import { desc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ok, requireAdmin, route } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await db.select().from(users).orderBy(desc(users.createdAt)).limit(500);
  return ok({
    users: rows.map((u) => ({ id: u.id, name: u.name, email: u.email, phone: u.phone, role: u.role, createdAt: u.createdAt })),
  });
});
