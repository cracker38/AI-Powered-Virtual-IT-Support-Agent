import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const { title, content, category, tags } = await req.json();
    const article = await prisma.knowledgeArticle.update({
      where: { id },
      data: {
        title,
        content,
        category,
        tags,
      },
    });

    return NextResponse.json(article);
  } catch (error) {
    console.error("Knowledge API Error:", error);
    return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await prisma.knowledgeArticle.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Knowledge API Error:", error);
    return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
  }
}
