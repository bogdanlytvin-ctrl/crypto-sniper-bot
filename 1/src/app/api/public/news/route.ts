import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.newsArticle.findMany({
    where: { active: true },
    orderBy: { date: "desc" },
  });
  return NextResponse.json(items);
}
