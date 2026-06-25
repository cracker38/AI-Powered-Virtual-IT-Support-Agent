import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const logs = await (prisma as any).accessLog.findMany({
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Admin logs fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
