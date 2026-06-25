import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shinon-study-pre-website-4b4066c4.onbld.com";
    const loginUrl = `${appUrl}/login`;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser || "noreply@studygarden.app";

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn("[send-welcome-email] SMTP not configured — skipping email send");
      return NextResponse.json({ ok: true, message: "SMTP not configured — email skipped" });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const displayName = name || "there";

    await transporter.sendMail({
      from: `"Study Garden" <${smtpFrom}>`,
      to: email,
      subject: "Welcome to Study Garden! 🌱",
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h1 style="color: #2D4A3E; font-size: 24px; margin-bottom: 8px;">Welcome to Study Garden, ${displayName}!</h1>
          <p style="color: #5C5751; font-size: 15px; line-height: 1.6;">
            Your account has been created successfully. The garden grows with you —
            small steps every day lead to great results.
          </p>
          <div style="margin: 24px 0;">
            <a href="${loginUrl}"
               style="display: inline-block; background: #2D4A3E; color: #fff; text-decoration: none;
                      padding: 12px 28px; border-radius: 12px; font-size: 14px; font-weight: 500;">
              Log In to Your Account
            </a>
          </div>
          <p style="color: #9B968E; font-size: 12px;">
            Or visit: <a href="${loginUrl}" style="color: #2D4A3E;">${loginUrl}</a>
          </p>
          <hr style="border: none; border-top: 1px solid #E8E0D5; margin: 24px 0;" />
          <p style="color: #9B968E; font-size: 11px;">
            Study Garden — Small steps every day.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-welcome-email] Failed:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
