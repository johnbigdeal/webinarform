export async function GET() {
  let db = false;
  try {
    // lightweight DB check
    const { prisma } = await import("@/lib/prisma");
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  const ok = db;
  return Response.json({ ok, db }, { status: ok ? 200 : 503 });
}
