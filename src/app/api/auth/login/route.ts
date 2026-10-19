import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { fail, ok, route, safeUser } from "@/lib/api";
import { loginSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export const POST = route(async (req) => {
  const { email, password } = loginSchema.parse(await req.json());
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const user = rows[0];
  // Same message for unknown email and wrong password, so accounts can't be probed.
  if (!user || !(await verifyPassword(password, user.passwordHash))) fail(401, "Incorrect email or password");
  const payload = safeUser(user);
  await setSessionCookie(payload);
  return ok({ user: payload });
});
