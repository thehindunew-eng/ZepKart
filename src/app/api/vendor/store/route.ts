import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { ok, requireVendor, route } from "@/lib/api";
import { storeSettingsPatch } from "@/lib/validators";
import { vendorStore } from "@/lib/dto";
import { refreshStore } from "@/lib/store-status";
import { cityFromPincode } from "@/lib/ncr";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const { store } = await requireVendor();
  return ok({ store: vendorStore(await refreshStore(store)) });
});

export const PATCH = route(async (req) => {
  const { store } = await requireVendor();
  const body = storeSettingsPatch.parse(await req.json());
  const values: Record<string, unknown> = { ...body, updatedAt: new Date() };
  if (body.pincode) {
    // Keep city consistent with the pincode.
    values.city = cityFromPincode(body.pincode) ?? body.city ?? store.city;
  }
  for (const k of ["dpUrl", "coverUrl", "phone", "description", "openingHours"] as const) {
    if (body[k] === "") values[k] = null;
  }
  const [updated] = await db.update(stores).set(values).where(eq(stores.id, store.id)).returning();
  return ok({ store: vendorStore(updated) });
});
