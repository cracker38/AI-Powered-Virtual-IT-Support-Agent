import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const totalEscalated = await (prisma as any).ticket.count();
    const unresolvedEscalated = await (prisma as any).ticket.count({
      where: {
        status: { notIn: ["RESOLVED", "CLOSED"] }
      }
    });
    const knowledgeCount = await (prisma as any).knowledgeArticle.count();
    
    // For demo purposes, we'll return a count of notifications directed at technicians.
    const notificationCount = await (prisma as any).notification.count({
      where: { 
        isRead: false,
        message: { contains: "User replied" }
      }
    });

    return NextResponse.json({
      totalEscalated,
      unresolvedEscalated,
      knowledgeCount,
      notificationCount
    });
  } catch (error) {
    console.error("Sidebar stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
