import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";

export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    // In a real app, we would verify the user's role here
    // For now, let's assume the user is the technician John (from our seed)
    const userEmail = session?.user?.email || "tech@cypadi.com";

    const user = await (prisma as any).user.findUnique({
      where: { email: userEmail },
      include: { technicianProfile: true }
    });

    if (!user || !(user as any).technicianProfile) {
      return NextResponse.json({ error: "Technician not found" }, { status: 404 });
    }

    const tickets = await (prisma as any).ticket.findMany({
      where: { assignedTechnicianId: (user as any).technicianProfile.id },
      include: {
        user: { select: { name: true, email: true } },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Fetch technician tickets error:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}
