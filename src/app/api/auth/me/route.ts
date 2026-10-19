import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { currentUser } from "@/lib/auth";
import { ok, route, safeUser } from "@/lib/api";
import { refreshStore } from "@/lib/store-status";
import { vendorStore } from "@/lib/dto";

export const dynamic = "force-dynamic";

export const GET = route(async () => {
  const user = await currentUser();
  if (!user) return ok({ user: null, store: null });
  let store = null;
  if (user.role === "vendor") {
    const rows = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
    if (rows[0]) store = vendorStore(await refreshStore(rows[0]));
  }
  return ok({ user: safeUser(user), store });
});
