import { eq } from "drizzle-orm";
import { timingSafeEqual } from "node:crypto";
import { db } from "@/db";
import { stores, users, wholesalers } from "@/db/schema";
import { adminAccessPassword, hashPassword, setSessionCookie } from "@/lib/auth";
import { ok, route, fail, safeUser } from "@/lib/api";
import { signupSchema } from "@/lib/validators";
import { CITIES, AREAS, geoFor, type City } from "@/lib/ncr";

export const dynamic = "force-dynamic";

const DEFAULT_PIN: Record<City, string> = { Delhi: "110001", Noida: "201301", Gurugram: "122002" };

function samePassword(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const POST = route(async (req) => {
  const body = signupSchema.parse(await req.json());
  if (body.role === "admin") {
    const expected = adminAccessPassword();
    if (!expected || !samePassword(body.adminCode ?? "", expected)) fail(403, "Admin access password is incorrect");
  }
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
  if (existing.length) fail(409, "An account with this email already exists");

  const city: City = body.city && (CITIES as readonly string[]).includes(body.city) ? (body.city as City) : "Delhi";
  const locality = AREAS[city][0];
  const geo = geoFor(city, locality);

  const [user] = await db
    .insert(users)
    .values({
      email: body.email,
      passwordHash: await hashPassword(body.password),
      name: body.name,
      phone: body.phone || null,
      role: body.role,
    })
    .returning();

  if (body.role === "vendor") {
    await db.insert(stores).values({
      ownerId: user.id,
      shopName: body.shopName?.trim() || `${body.name.split(" ")[0]}'s Store`,
      city,
      locality,
      pincode: DEFAULT_PIN[city],
      lat: String(geo.lat),
      lng: String(geo.lng),
      isOpen: false, // stays closed until the vendor finishes onboarding and opens
    });
  }

  if (body.role === "wholesaler") {
    await db.insert(wholesalers).values({
      userId: user.id,
      businessName: body.shopName?.trim() || `${body.name.split(" ")[0]} Traders`,
      gstin: body.gstin || null,
      phone: body.phone || null,
      city,
      locality,
      pincode: DEFAULT_PIN[city],
      lat: String(geo.lat),
      lng: String(geo.lng),
    });
  }

  const payload = safeUser(user);
  await setSessionCookie(payload);
  return ok({ user: payload }, 201);
});
