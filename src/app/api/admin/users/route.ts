import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await (prisma as any).user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await (prisma as any).user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "USER",
      }
    });

    return NextResponse.json(newUser);
  } catch (error) {
    console.error("Admin user creation error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
