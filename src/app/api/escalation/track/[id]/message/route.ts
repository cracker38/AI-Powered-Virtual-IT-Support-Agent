import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const { content, sender, userId, technicianId } = await req.json();

    const message = await (prisma as any).ticketMessage.create({
      data: {
        ticketId,
        content,
        sender, // "USER" or "TECHNICIAN"
        userId,
        technicianId,
      },
    });

    // If it's a technician reply, notify the user
    if (sender === "TECHNICIAN") {
      const ticket = await (prisma as any).ticket.findUnique({
        where: { id: ticketId },
        select: { userId: true, ticketNumber: true }
      });
      
      if (ticket) {
        await (prisma as any).notification.create({
          data: {
            userId: ticket.userId,
            ticketId,
            type: "COMMENTED",
            message: `A technician has responded to your ticket ${ticket.ticketNumber}.`,
            actionUrl: `/ticket-tracking/${ticketId}`,
          }
        });
      }
    } 
    // If it's a user reply, notify the technician
    else if (sender === "USER") {
      const ticket = await (prisma as any).ticket.findUnique({
        where: { id: ticketId },
        select: { assignedTechnician: { include: { user: true } }, ticketNumber: true }
      });

      if (ticket && ticket.assignedTechnician) {
        await (prisma as any).notification.create({
          data: {
            userId: (ticket.assignedTechnician.user as any).id,
            ticketId,
            type: "COMMENTED",
            message: `User replied to ticket ${ticket.ticketNumber}.`,
            actionUrl: `/technician/tickets/${ticketId}`,
          }
        });
      }
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error("Message create error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
