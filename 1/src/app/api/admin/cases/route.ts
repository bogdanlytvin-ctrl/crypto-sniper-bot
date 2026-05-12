import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-auth";


export async function GET(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await prisma.caseStudy.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const data = await req.json();
  const item = await prisma.caseStudy.create({
    data: {
      title: data.title,
      description: data.description,
      tags: JSON.stringify(data.tags ?? []),
      amount: data.amount,
      image: data.image || "/images/case-medical-ai.png",
      order: data.order ?? 0,
      active: data.active ?? true,
    },
  });
  return NextResponse.json(item);
}
