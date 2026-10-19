import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, stores } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, phone, role } = body;
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    }
    const cleanEmail = String(email).toLowerCase().trim();
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
    if (existing.length) {
      return NextResponse.json({ error: "Email already registered. Please login." }, { status: 409 });
    }
    const passwordHash = await hashPassword(String(password));
    const safeRole = role === "vendor" ? "vendor" : "customer";
    const inserted = await db
      .insert(users)
      .values({
        email: cleanEmail,
        passwordHash,
        name: String(name).slice(0, 120),
        phone: phone ? String(phone).slice(0, 30) : null,
        role: safeRole,
      })
      .returning();
    const user = inserted[0];
    // auto-create a starter store for vendors
    if (safeRole === "vendor") {
      await db.insert(stores).values({
        ownerId: user.id,
        shopName: `${user.name.split(" ")[0]}'s Store`,
        description: "Welcome to my store! Update this description, timings and WhatsApp number from Settings.",
        dpUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
        phone: user.phone,
        whatsapp: user.phone,
        address: "Main Market Road",
        city: "New Delhi",
        isOpen: true,
        nextOpeningAt: "Opens 9:00 AM tomorrow",
        nextClosingAt: "Closes 10:00 PM today",
      });
    }
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ?? "customer",
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    });
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
