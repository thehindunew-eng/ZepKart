import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "zapkart-dev-secret-change-me";
const COOKIE_NAME = "zapkart_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  phone?: string | null;
  avatarUrl?: string | null;
};

export async function hashPassword(pw: string) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function signToken(user: SessionUser) {
  return jwt.sign(user, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser) {
  const token = signToken(user);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
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

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getSessionUserFull() {
  const s = await getSession();
  if (!s) return null;
  const rows = await db.select().from(users).where(eq(users.id, s.id)).limit(1);
  return rows[0] ?? null;
}

export function sessionFromRequest(req: Request): SessionUser | null {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/zapkart_session=([^;]+)/);
  if (!match) return null;
  try {
    const token = decodeURIComponent(match[1]);
    return verifyToken(token);
  } catch {
    return null;
  }
}
