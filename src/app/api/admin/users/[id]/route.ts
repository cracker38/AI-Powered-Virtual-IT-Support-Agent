import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await req.json();
    const { name, email, password, role } = body;

    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await (prisma as any).user.update({
      where: { id: userId },
      data,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Admin user update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;

    await (prisma as any).user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin user delete error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
