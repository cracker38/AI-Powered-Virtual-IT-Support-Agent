import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const totalTickets = await prisma.ticket.count();
    const openTickets = await prisma.ticket.count({ where: { status: "OPEN" } });
    const resolvedTickets = await prisma.ticket.count({ where: { status: "RESOLVED" } });
    const aiResolved = await prisma.ticket.count({ where: { chatHistory: { not: null }, status: "RESOLVED" } });
    const humanResolved = resolvedTickets - aiResolved;
    const totalUsers = await prisma.user.count();
    const sentimentCounts = await prisma.chatMessage.groupBy({
      by: ["sentiment"],
      _count: { sentiment: true },
    });
    const positiveCount = sentimentCounts.find((row) => row.sentiment === "POSITIVE")?._count.sentiment ?? 0;
    const neutralCount = sentimentCounts.find((row) => row.sentiment === "NEUTRAL")?._count.sentiment ?? 0;
    const negativeCount = sentimentCounts.find((row) => row.sentiment === "NEGATIVE")?._count.sentiment ?? 0;

    const resolvedTicketsForAvg = await prisma.ticket.findMany({
      where: { status: "RESOLVED" },
      select: { createdAt: true, updatedAt: true },
    });
    const resolutionMinutes = resolvedTicketsForAvg.reduce((acc, ticket) => {
      const durationMs = ticket.updatedAt.getTime() - ticket.createdAt.getTime();
      return acc + Math.max(durationMs, 0);
    }, 0);
    const avgResolutionMinutes = resolvedTicketsForAvg.length > 0 ? resolutionMinutes / resolvedTicketsForAvg.length / 60000 : 0;

    const transcripts = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({
      totalTickets,
      openTickets,
      resolvedTickets,
      aiResolved,
      humanResolved,
      positiveCount,
      neutralCount,
      negativeCount,
      avgResolutionMinutes,
      totalUsers,
      transcripts,
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, newIntent } = await req.json();
    if (!id || !newIntent) {
      return NextResponse.json({ error: "Missing id or newIntent" }, { status: 400 });
    }

    const updated = await prisma.chatMessage.update({
      where: { id },
      data: { detectedIntent: newIntent },
    });

    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("Analytics PATCH error:", error);
    return NextResponse.json({ error: "Failed to update transcript" }, { status: 500 });
  }
}
