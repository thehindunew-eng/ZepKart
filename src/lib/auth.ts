import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export const COOKIE_NAME = "zepkart_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

function jwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET is not set");
  return "zepkart-dev-only-secret";
}

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

export function signSession(user: SessionUser) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone ?? null, avatarUrl: user.avatarUrl ?? null },
    jwtSecret(),
    { expiresIn: "7d" },
  );
}

export function verifySession(token: string): SessionUser | null {
  try {
    return jwt.verify(token, jwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const store = await cookies();
  store.set(COOKIE_NAME, signSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Returns the current user with fresh data from the database, or null. */
export async function currentUser() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const session = verifySession(token);
  if (!session) return null;
  const rows = await db.select().from(users).where(eq(users.id, session.id)).limit(1);
  return rows[0] ?? null;
}
