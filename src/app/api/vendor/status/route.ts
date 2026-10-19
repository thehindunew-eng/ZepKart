import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { fail, ok, requireVendor, route } from "@/lib/api";
import { statusPatch } from "@/lib/validators";
import { vendorStore } from "@/lib/dto";
import { refreshStore, resolveSchedule } from "@/lib/store-status";

export const dynamic = "force-dynamic";

/**
 * Open/close the store. An open store only keeps a closing time; a closed store only
 * keeps an opening time. Toggling clears the schedule that no longer applies.
 */
export const PATCH = route(async (req) => {
  const { store } = await requireVendor();
  const body = statusPatch.parse(await req.json());
  const now = new Date();

  let isOpen = body.isOpen ?? store.isOpen;
  let nextOpeningAt = store.nextOpeningAt;
  let nextClosingAt = store.nextClosingAt;
  if (body.nextOpeningAt !== undefined) nextOpeningAt = body.nextOpeningAt ? new Date(body.nextOpeningAt) : null;
  if (body.nextClosingAt !== undefined) nextClosingAt = body.nextClosingAt ? new Date(body.nextClosingAt) : null;
  if (isOpen) nextOpeningAt = null;
  else nextClosingAt = null;

  if (!isOpen && nextOpeningAt && nextOpeningAt <= now) fail(400, "Opening time must be in the future");
  if (isOpen && nextClosingAt && nextClosingAt <= now) fail(400, "Closing time must be in the future");

  const resolved = resolveSchedule({ isOpen, nextOpeningAt, nextClosingAt }, now);
  const [updated] = await db
    .update(stores)
    .set({ isOpen: resolved.isOpen, nextOpeningAt: resolved.nextOpeningAt, nextClosingAt: resolved.nextClosingAt, updatedAt: now })
    .where(eq(stores.id, store.id))
    .returning();
  return ok({ store: vendorStore(await refreshStore(updated)) });
});
