import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;

    const ticket = await (prisma as any).ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTechnician: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        category: true,
        user: {
          select: {
            name: true,
          }
        },
        ticketMessages: {
          orderBy: { createdAt: "asc" }
        }
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Fetch ticket error:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ticketId } = await params;
    const { status } = await req.json();

    const updatedTicket = await (prisma as any).ticket.update({
      where: { id: ticketId },
      data: { status }
    });

    // Create a notification for the user if ticket was resolved
    if (status === "RESOLVED") {
      await (prisma as any).notification.create({
        data: {
          userId: updatedTicket.userId,
          ticketId: updatedTicket.id,
          type: "RESOLVED",
          message: `Your ticket ${updatedTicket.ticketNumber} has been marked as resolved.`,
          actionUrl: `/ticket-tracking/${updatedTicket.id}`,
        }
      });
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Update ticket status error:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
