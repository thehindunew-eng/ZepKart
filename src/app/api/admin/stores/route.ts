import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { stores, users } from "@/db/schema";
import { ok, requireAdmin, route } from "@/lib/api";
import { num } from "@/lib/dto";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  await requireAdmin();
  const rows = await db
    .select({ s: stores, owner: users })
    .from(stores)
    .innerJoin(users, eq(stores.ownerId, users.id))
    .orderBy(desc(stores.createdAt));
  return ok({
    stores: rows.map((r) => ({
      id: r.s.id,
      shopName: r.s.shopName,
      city: r.s.city,
      locality: r.s.locality,
      isOpen: r.s.isOpen,
      plan: r.s.plan,
      planExpiresAt: r.s.planExpiresAt,
      pickupAvailable: r.s.pickupAvailable,
      deliveryAvailable: r.s.deliveryAvailable,
      deliveryFee: num(r.s.deliveryFee),
      freeDeliveryAbove: num(r.s.freeDeliveryAbove),
      minOrder: num(r.s.minOrder),
      ownerName: r.owner.name,
      ownerEmail: r.owner.email,
    })),
  });
});
