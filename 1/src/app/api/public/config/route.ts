import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PUBLIC_KEYS = ["email", "phone", "address", "linkedin", "facebook", "instagram", "telegram", "calendly", "stats_clients", "stats_funding", "stats_guarantee"];

export async function GET() {
  const configs = await prisma.siteConfig.findMany({ where: { key: { in: PUBLIC_KEYS } } });
  const result: Record<string, string> = {};
  for (const c of configs) result[c.key] = c.value;
  return NextResponse.json(result);
}
