import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { fail, ok, route, safeUser } from "@/lib/api";
import { profilePatch } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** Name and phone for any signed-in account. Email and role can't be changed here. */
export const PATCH = route(async (req) => {
  const user = await currentUser();
  if (!user) fail(401, "Please log in to continue");
  const body = profilePatch.parse(await req.json());
  const [row] = await db
    .update(users)
    .set({ name: body.name, phone: body.phone ? body.phone : null })
    .where(eq(users.id, user.id))
    .returning();
  return ok({ user: safeUser(row) });
});
