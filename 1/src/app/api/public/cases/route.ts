import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const items = await prisma.caseStudy.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(
    items.map((i) => ({ ...i, tags: JSON.parse(i.tags || "[]") as string[] }))
  );
}
