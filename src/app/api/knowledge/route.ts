import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const articles = await prisma.knowledgeArticle.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(articles);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { title, content, category, tags } = await req.json();
    const article = await prisma.knowledgeArticle.create({
      data: { title, content, category, tags },
    });
    return NextResponse.json(article);
  } catch (error) {
    console.error("Knowledge API Error:", error);
    return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
  }
}
