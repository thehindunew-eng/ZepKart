import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    const rows = await db.select().from(users).where(eq(users.email, String(email).toLowerCase().trim())).limit(1);
    const user = rows[0];
    if (!user) return NextResponse.json({ error: "No account found for this email" }, { status: 404 });
    const ok = await verifyPassword(String(password), user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    await setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role ?? "customer",
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    });
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone, avatarUrl: user.avatarUrl },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
