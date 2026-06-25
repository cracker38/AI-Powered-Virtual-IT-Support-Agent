import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, title, description, summary, priority, chatHistory, categoryId } = await req.json();

    if (!userId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const count = await (prisma as any).ticket.count();
    const ticketNumber = `TKT-${(count + 1).toString().padStart(4, "0")}`;

    // 2. Smart Routing: Find best technician matching expertise
    let category = null;
    if (categoryId) {
      category = await (prisma as any).ticketCategory.findUnique({
        where: { id: categoryId }
      });
    }

    const expertiseNeeded = category?.relatedExpertise?.split(",") || [];

    let technicians = [];
    
    if (expertiseNeeded.length > 0) {
      // Find technicians with matching expertise
      const allTechnicians = await (prisma as any).technician.findMany({
        where: { status: "AVAILABLE" },
        include: { user: true }
      });

      technicians = allTechnicians
        .filter((tech: any) => {
          const techExpertise = tech.expertise.split(",");
          return expertiseNeeded.some((exp: string) => techExpertise.includes(exp.trim()));
        })
        .sort((a: any, b: any) => a.currentWorkload - b.currentWorkload);
    }

    // Fallback if no matching expertise or no category: pick least busy available technician
    if (technicians.length === 0) {
      technicians = await (prisma as any).technician.findMany({
        where: { status: "AVAILABLE" },
        orderBy: { currentWorkload: "asc" },
        take: 1,
      });
    }

    const assignedTechnicianId = technicians[0]?.id || null;

    // 3. Calculate SLA Breach Time
    const now = new Date();
    let slaHours = 48; // Default Low
    if (priority === "MEDIUM") slaHours = 24;
    if (priority === "HIGH") slaHours = 4;
    if (priority === "CRITICAL") slaHours = 1;
    
    const slaBreachTime = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    // 4. Create Ticket
    const ticket = await (prisma as any).ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        summary,
        priority,
        userId,
        categoryId,
        assignedTechnicianId,
        slaBreachTime,
        chatHistory: typeof chatHistory === "string" ? chatHistory : JSON.stringify(chatHistory),
        status: assignedTechnicianId ? "IN_PROGRESS" : "OPEN",
      },
      include: {
        assignedTechnician: {
          include: {
            user: true
          }
        }
      }
    });

    // 5. Update workload if assigned
    if (assignedTechnicianId) {
      await (prisma as any).technician.update({
        where: { id: assignedTechnicianId },
        data: { currentWorkload: { increment: 1 } },
      });
    }

    // 6. Create Notification for User
    await (prisma as any).notification.create({
      data: {
        userId,
        ticketId: ticket.id,
        type: assignedTechnicianId ? "ASSIGNED" : "ESCALATED",
        message: assignedTechnicianId 
          ? `Your ticket ${ticketNumber} has been assigned to technician ${ticket.assignedTechnician?.user.name}.`
          : `Your ticket ${ticketNumber} has been created and is awaiting assignment.`,
        actionUrl: `/ticket-tracking/${ticket.id}`,
      }
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Ticket creation error:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}
