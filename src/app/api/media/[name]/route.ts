import { readStoredFile } from "@/lib/media";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ name: string }> }) {
  const { name } = await ctx.params;
  const file = await readStoredFile(name);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(file.buf), {
    headers: {
      "Content-Type": file.mime,
      "Content-Length": String(file.buf.length),
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Accept-Ranges": "bytes",
    },
  });
}
