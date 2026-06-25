import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    const notifications = await (prisma as any).notification.findMany({
      where: userId ? { userId } : {},
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, isRead } = await req.json();

    const notification = await (prisma as any).notification.update({
      where: { id },
      data: { isRead },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Notification update error:", error);
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
