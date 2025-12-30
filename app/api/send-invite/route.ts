import { NextResponse } from "next/server";
// @ts-ignore
import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import InviteUserEmail from "@/emails/invite-user";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, temporaryPassword, isResend } = body;

    if (!email || !temporaryPassword) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos" },
        { status: 400 }
      );
    }

    const subject = isResend 
      ? "Recordatorio: Acceso a Al Fin Entendí EDU"
      : "Bienvenido a Al Fin Entendí EDU";

    const loginUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/login`;

    const emailHtml = await render(
      InviteUserEmail({
        name,
        email,
        temporaryPassword,
        isResend,
        loginUrl,
      })
    );

    await transporter.sendMail({
      from: `"Al Fin Entendí EDU" <${process.env.SMTP_FROM}>`,
      to: email,
      subject: subject,
      html: emailHtml,
    });

    return NextResponse.json({ 
      success: true,
      message: "Email enviado exitosamente"
    });
  } catch (error: any) {
    console.error("Error enviando email:", error);
    return NextResponse.json(
      { error: error.message || "Error al enviar email" },
      { status: 500 }
    );
  }
}
