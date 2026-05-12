import nodemailer from "nodemailer";

export function getTransport() {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_PORT } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendLeadNotification(opts: {
  to: string;
  name: string;
  email: string;
  company?: string | null;
  message: string;
}) {
  const transport = getTransport();
  if (!transport || !opts.to) return;

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transport.sendMail({
    from: `"Oh My Grant" <${from}>`,
    to: opts.to,
    subject: `Нова заявка від ${opts.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <h2 style="color:#0B1E3F;margin-bottom:4px">Нова заявка з сайту</h2>
        <p style="color:#6B7280;margin-top:0;font-size:14px">Oh My Grant — контактна форма</p>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0"/>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#6B7280;font-size:14px;width:120px">Ім'я</td><td style="padding:8px 0;font-weight:600;color:#111827">${opts.name}</td></tr>
          <tr><td style="padding:8px 0;color:#6B7280;font-size:14px">Email</td><td style="padding:8px 0"><a href="mailto:${opts.email}" style="color:#00D4AA;text-decoration:none">${opts.email}</a></td></tr>
          ${opts.company ? `<tr><td style="padding:8px 0;color:#6B7280;font-size:14px">Компанія</td><td style="padding:8px 0;color:#111827">${opts.company}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#6B7280;font-size:14px;vertical-align:top">Повідомлення</td><td style="padding:8px 0;color:#111827;line-height:1.6">${opts.message.replace(/\n/g, "<br/>")}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:20px 0"/>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/leads" style="display:inline-block;padding:10px 20px;background:#0B1E3F;color:white;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">
          Переглянути в адмінці
        </a>
      </div>
    `,
  });
}
