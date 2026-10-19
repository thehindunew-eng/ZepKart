import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores, users } from "@/db/schema";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { ok, route, fail, safeUser } from "@/lib/api";
import { signupSchema } from "@/lib/validators";
import { CITIES, AREAS, type City } from "@/lib/ncr";

export const dynamic = "force-dynamic";

const DEFAULT_PIN: Record<City, string> = { Delhi: "110001", Noida: "201301", Gurugram: "122002" };

export const POST = route(async (req) => {
  const body = signupSchema.parse(await req.json());
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
  if (existing.length) fail(409, "An account with this email already exists");

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
    const city: City = body.city && (CITIES as readonly string[]).includes(body.city) ? (body.city as City) : "Delhi";
    await db.insert(stores).values({
      ownerId: user.id,
      shopName: body.shopName?.trim() || `${body.name.split(" ")[0]}'s Store`,
      city,
      locality: AREAS[city][0],
      pincode: DEFAULT_PIN[city],
      isOpen: false, // stays closed until the vendor finishes onboarding and opens
    });
  }

  const payload = safeUser(user);
  await setSessionCookie(payload);
  return ok({ user: payload }, 201);
});
