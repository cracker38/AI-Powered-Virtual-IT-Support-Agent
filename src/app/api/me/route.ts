import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const user = await (prisma as any).user.findUnique({
    where: { id: userId },
    include: { notificationPreferences: true }
  });

  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as any).id;
  const { name, password, emailUpdates, voiceEnabled } = await req.json();

  const updateData: any = {};
  if (name) updateData.name = name;
  if (password) updateData.password = await bcrypt.hash(password, 10);

  const updatedUser = await (prisma as any).user.update({
    where: { id: userId },
    data: {
      ...updateData,
      notificationPreferences: {
        upsert: {
          create: { emailUpdates: !!emailUpdates, voiceEnabled: !!voiceEnabled },
          update: { emailUpdates: !!emailUpdates, voiceEnabled: !!voiceEnabled }
        }
      }
    },
    include: { notificationPreferences: true }
  });

  return NextResponse.json(updatedUser);
}
