import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tickets = await prisma.ticket.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        ticketMessages: { orderBy: { createdAt: "asc" } },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Admin Tickets GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve tickets" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticketId, content, userId } = await req.json();

    if (!ticketId || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create the reply message
    const message = await prisma.ticketMessage.create({
      data: {
        ticketId,
        sender: "TECHNICIAN", // Admin acts as technician here
        content,
      },
    });

    // 2. Notify the user
    if (userId) {
      await prisma.notification.create({
        data: {
          userId,
          ticketId,
          type: "COMMENTED",
          message: `An admin replied to your ticket.`,
          actionUrl: `/tickets/${ticketId}`,
        },
      });
    }

    // 3. Update ticket status if it was open (optional, but good practice)
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "IN_PROGRESS" },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Admin Tickets POST error:", error);
    return NextResponse.json({ error: "Failed to add reply" }, { status: 500 });
  }
}
