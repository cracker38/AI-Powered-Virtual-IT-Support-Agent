import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

function generateTemporaryPassword() {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  return Array.from({ length: 10 }, () => charset[Math.floor(Math.random() * charset.length)]).join("");
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { securityQuestion: true },
    });

    if (!user) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({ found: true, securityQuestion: user.securityQuestion || null });
  } catch (error) {
    console.error("Password reset GET error:", error);
    return NextResponse.json({ error: "Unable to validate email" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, newPassword } = await req.json();
    if (!email || !newPassword) {
      return NextResponse.json({ success: false, message: "Email and new password are required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: false, message: "No matching account found." }, { status: 404 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { email }, data: { password: hashedPassword } });

    return NextResponse.json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Password reset POST error:", error);
    return NextResponse.json({ success: false, message: "Unable to reset password." }, { status: 500 });
  }
}
