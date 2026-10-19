import { NextResponse } from "next/server";
import { getSessionUserFull } from "@/lib/auth";
import { db } from "@/db";
import { stores } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUserFull();
  if (!user) return NextResponse.json({ user: null });
  let store = null;
  if (user.role === "vendor") {
    const s = await db.select().from(stores).where(eq(stores.ownerId, user.id)).limit(1);
    store = s[0] ?? null;
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    },
    store,
  });
}
