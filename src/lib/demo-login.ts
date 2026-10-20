import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { DEMO_ADMIN, DEMO_CUSTOMERS, DEMO_VENDORS, DEMO_WHOLESALERS } from "@/lib/seed-data";
import { seedDemo } from "@/lib/seed";

export const DEMO_ROLES = ["customer", "vendor", "wholesaler", "admin"] as const;
export type DemoRole = (typeof DEMO_ROLES)[number];

/** The seeded account that stands in for each demo role on the /auth page. */
export const DEMO_ACCOUNT_EMAIL: Record<DemoRole, string> = {
  customer: DEMO_CUSTOMERS[0].email,
  vendor: DEMO_VENDORS[0].email,
  wholesaler: DEMO_WHOLESALERS[0].email,
  admin: DEMO_ADMIN.email,
};

async function demoDataPresent() {
  const [row] = await db.select({ id: users.id }).from(users).where(eq(users.email, DEMO_ACCOUNT_EMAIL.vendor)).limit(1);
  return !!row;
}

/**
 * Loads demo data when the database has none yet. Set DISABLE_DEMO_SEED=1 to turn this off;
 * the demo login then reports that demo accounts are unavailable instead of creating data.
 */
export async function ensureDemoData(): Promise<boolean> {
  if (await demoDataPresent()) return true;
  if (process.env.DISABLE_DEMO_SEED === "1") return false;
  try {
    await seedDemo();
  } catch (err) {
    // Two demo clicks at once can race on the unique email index; the loser just re-checks below.
    console.error("demo seed failed", err);
  }
  return demoDataPresent();
}

export async function demoAccount(role: DemoRole) {
  const [row] = await db.select().from(users).where(eq(users.email, DEMO_ACCOUNT_EMAIL[role])).limit(1);
  return row ?? null;
}
