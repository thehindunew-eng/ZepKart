import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users, wholesalers } from "@/db/schema";
import { ok, requireAdmin, route } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await db
    .select({ w: wholesalers, u: users })
    .from(wholesalers)
    .innerJoin(users, eq(wholesalers.userId, users.id))
    .orderBy(desc(wholesalers.createdAt));
  return ok({
    wholesalers: rows.map((r) => ({
      id: r.w.id,
      businessName: r.w.businessName,
      city: r.w.city,
      locality: r.w.locality,
      rating: Number(r.w.rating),
      isVerified: r.w.isVerified,
      ownerName: r.u.name,
      ownerEmail: r.u.email,
    })),
  });
});
