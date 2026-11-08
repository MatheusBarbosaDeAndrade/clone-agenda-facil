import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

export function buildEmailHtml({ title, paragraphs, button }) {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;color:#1b2a4a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;padding:32px" cellpadding="0" cellspacing="0">
  <tr><td style="font-size:20px;font-weight:bold;padding-bottom:16px">AgendaFácil</td></tr>
  <tr><td style="font-size:18px;font-weight:bold;padding-bottom:12px">${escapeHtml(title)}</td></tr>
  ${paragraphs.map((p) => `<tr><td style="font-size:14px;line-height:22px;color:#4b5563;padding-bottom:12px">${escapeHtml(p)}</td></tr>`).join("")}
  ${button ? `<tr><td style="padding:12px 0 20px"><a href="${escapeHtml(button.href)}" style="background:#1b2a4a;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:bold;font-size:14px;display:inline-block">${escapeHtml(button.label)}</a></td></tr>` : ""}
  <tr><td style="font-size:12px;color:#9ca3af">Se você não solicitou esta ação, ignore este e-mail.</td></tr>
  </table></td></tr></table></body></html>`;
}

export async function sendEmail({ to, subject, text, html }) {
  const transport = getTransporter();
  if (!transport) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[email] SMTP não configurado — e-mail não enviado:",
        subject,
      );
      return false;
    }
    console.log(`\n[email:dev] Para: ${to}\nAssunto: ${subject}\n${text}\n`);
    return true;
  }
  try {
    await transport.sendMail({
      from:
        process.env.EMAIL_FROM ||
        "AgendaFácil <nao-responda@agendafacil.com.br>",
      to,
      subject,
      text,
      html,
    });
    return true;
  } catch (error) {
    console.error("[email] falha no envio:", error.message);
    return false;
  }
}
