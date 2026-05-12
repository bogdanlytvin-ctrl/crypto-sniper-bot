import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";


export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.newsArticle.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const item = await prisma.newsArticle.create({
    data: {
      title: data.title,
      excerpt: data.excerpt,
      content: data.content || "",
      category: data.category,
      image: data.image || "/images/news-featured.png",
      date: data.date ? new Date(data.date) : new Date(),
      active: data.active ?? true,
    },
  });
  return NextResponse.json(item);
}
