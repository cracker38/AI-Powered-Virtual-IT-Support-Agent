import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const broadcasts = await prisma.broadcastAlert.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(broadcasts);
  } catch (error) {
    console.error("Broadcasts GET error:", error);
    return NextResponse.json({ error: "Failed to retrieve broadcasts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Missing broadcast message" }, { status: 400 });
    }

    const broadcast = await prisma.broadcastAlert.create({
      data: { message: message.trim(), isActive: true },
    });
    return NextResponse.json(broadcast);
  } catch (error) {
    console.error("Broadcasts POST error:", error);
    return NextResponse.json({ error: "Failed to create broadcast" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, isActive } = await req.json();
    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Missing id or isActive" }, { status: 400 });
    }

    const update = await prisma.broadcastAlert.update({
      where: { id },
      data: { isActive },
    });
    return NextResponse.json(update);
  } catch (error) {
    console.error("Broadcasts PATCH error:", error);
    return NextResponse.json({ error: "Failed to update broadcast" }, { status: 500 });
  }
}
