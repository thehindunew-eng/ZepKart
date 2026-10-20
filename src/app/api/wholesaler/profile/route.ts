import { eq } from "drizzle-orm";
import { db } from "@/db";
import { wholesalers } from "@/db/schema";
import { ok, requireWholesaler, route } from "@/lib/api";
import { wholesalerDto } from "@/lib/dto";
import { wholesalerProfilePatch } from "@/lib/validators";
import { AREAS, type City, cityFromPincode, geoFor } from "@/lib/ncr";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const { wholesaler } = await requireWholesaler();
  return ok({ wholesaler: wholesalerDto(wholesaler) });
});

export const PATCH = route(async (req) => {
  const { wholesaler } = await requireWholesaler();
  const body = wholesalerProfilePatch.parse(await req.json());
  const values: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["businessName", "description", "dpUrl", "gstin", "phone", "address", "locality", "pincode"] as const) {
    if (body[k] !== undefined) values[k] = body[k] === "" ? null : body[k];
  }
  if (body.city !== undefined) values.city = body.city;
  // A pincode pins the city; otherwise keep the chosen or current city.
  if (body.pincode) values.city = cityFromPincode(body.pincode) ?? body.city ?? wholesaler.city;
  if (body.locality !== undefined || body.city !== undefined || body.pincode !== undefined) {
    const city = String(values.city ?? wholesaler.city) as City;
    const locality = (values.locality as string | null | undefined) ?? wholesaler.locality ?? AREAS[city][0];
    const geo = geoFor(city, locality);
    values.lat = String(geo.lat);
    values.lng = String(geo.lng);
  }
  const [updated] = await db.update(wholesalers).set(values).where(eq(wholesalers.id, wholesaler.id)).returning();
  return ok({ wholesaler: wholesalerDto(updated) });
});
