import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { render } from "@react-email/components";
import MagicLinkEmail from "@/emails/magic-link";

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
    const { email, name, magicLink } = body;

    if (!email || !magicLink) {
      return NextResponse.json(
        { error: "Email y magic link son requeridos" },
        { status: 400 }
      );
    }

    const subject = "Activa tu cuenta en Al Fin Entendí EDU";

    const emailHtml = await render(
      MagicLinkEmail({
        name: name || email,
        magicLink,
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
      message: "Magic link enviado exitosamente"
    });
  } catch (error: any) {
    console.error("Error enviando magic link:", error);
    return NextResponse.json(
      { error: error.message || "Error al enviar magic link" },
      { status: 500 }
    );
  }
}
