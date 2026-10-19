import { eq } from "drizzle-orm";
import { db } from "@/db";
import { stores } from "@/db/schema";

type StatusFields = { isOpen: boolean; nextOpeningAt: Date | null; nextClosingAt: Date | null };

/**
 * Applies scheduled transitions: an open store whose closing time has passed closes,
 * and a closed store whose opening time has passed opens. Returns the resolved fields.
 */
export function resolveSchedule(s: StatusFields, now = new Date()): StatusFields & { changed: boolean } {
  let { isOpen, nextOpeningAt, nextClosingAt } = s;
  let changed = false;
  if (isOpen && nextClosingAt && nextClosingAt <= now) {
    isOpen = false;
    nextClosingAt = null;
    changed = true;
  }
  if (!isOpen && nextOpeningAt && nextOpeningAt <= now) {
    isOpen = true;
    nextOpeningAt = null;
    changed = true;
  }
  return { isOpen, nextOpeningAt, nextClosingAt, changed };
}

/** Loads a store, applies any due schedule transition, and persists it. */
export async function refreshStore<T extends typeof stores.$inferSelect>(store: T): Promise<T> {
  const r = resolveSchedule(store);
  if (!r.changed) return store;
  const [updated] = await db
    .update(stores)
    .set({ isOpen: r.isOpen, nextOpeningAt: r.nextOpeningAt, nextClosingAt: r.nextClosingAt, updatedAt: new Date() })
    .where(eq(stores.id, store.id))
    .returning();
  return updated as T;
}
