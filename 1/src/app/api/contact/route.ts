import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendLeadNotification } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, company, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name: String(name).slice(0, 200),
        email: String(email).slice(0, 200),
        company: company ? String(company).slice(0, 200) : null,
        message: String(message).slice(0, 2000),
      },
    });

    // Send email notification (non-blocking)
    const emailConfig = await prisma.siteConfig.findUnique({ where: { key: "email" } });
    const notifyTo = emailConfig?.value || process.env.NOTIFY_EMAIL || "";
    if (notifyTo) {
      sendLeadNotification({ to: notifyTo, name: lead.name, email: lead.email, company: lead.company, message: lead.message })
        .catch((err) => console.error("[mailer]", err));
    }

    return NextResponse.json({ ok: true, id: lead.id });
  } catch (err) {
    console.error("[contact]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
