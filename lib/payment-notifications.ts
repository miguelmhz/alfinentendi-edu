import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendPurchaseSuccessNotification(
  userId: string,
  bookName: string,
  amount: number,
  currency: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) return;

    await prisma.notification.create({
      data: {
        userId,
        type: "PURCHASE_COMPLETED",
        title: "¡Compra exitosa!",
        message: `Has adquirido "${bookName}" por $${amount} ${currency}. Ya puedes acceder al libro.`,
        metadata: { bookName, amount, currency },
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Compra exitosa - Al Fin Entendí",
      html: `
        <h2>¡Gracias por tu compra!</h2>
        <p>Hola ${user.name || ""},</p>
        <p>Tu compra de <strong>${bookName}</strong> se ha completado exitosamente.</p>
        <p><strong>Monto:</strong> $${amount} ${currency}</p>
        <p>Ya puedes acceder a tu libro desde tu biblioteca.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/mis-libros" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver mis libros</a></p>
        <p>Saludos,<br>El equipo de Al Fin Entendí</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending purchase success notification:", error);
  }
}

export async function sendSubscriptionActivatedNotification(
  userId: string,
  planType: string,
  endDate: Date
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) return;

    await prisma.notification.create({
      data: {
        userId,
        type: "PURCHASE_COMPLETED",
        title: "Suscripción activada",
        message: `Tu suscripción ${planType} ha sido activada. Válida hasta ${endDate.toLocaleDateString()}.`,
        metadata: { planType, endDate: endDate.toISOString() },
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Suscripción activada - Al Fin Entendí",
      html: `
        <h2>¡Suscripción activada!</h2>
        <p>Hola ${user.name || ""},</p>
        <p>Tu suscripción <strong>${planType}</strong> ha sido activada exitosamente.</p>
        <p><strong>Válida hasta:</strong> ${endDate.toLocaleDateString()}</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/mis-libros" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Acceder a mis libros</a></p>
        <p>Saludos,<br>El equipo de Al Fin Entendí</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending subscription activated notification:", error);
  }
}

export async function sendAccessExpiringNotification(
  userId: string,
  bookName: string,
  expirationDate: Date
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) return;

    await prisma.notification.create({
      data: {
        userId,
        type: "ACCESS_EXPIRING",
        title: "Tu acceso está por expirar",
        message: `Tu acceso a "${bookName}" expirará el ${expirationDate.toLocaleDateString()}.`,
        metadata: { bookName, expirationDate: expirationDate.toISOString() },
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Tu acceso está por expirar - Al Fin Entendí",
      html: `
        <h2>Tu acceso está por expirar</h2>
        <p>Hola ${user.name || ""},</p>
        <p>Tu acceso a <strong>${bookName}</strong> expirará el <strong>${expirationDate.toLocaleDateString()}</strong>.</p>
        <p>Renueva tu suscripción para seguir disfrutando del contenido.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/suscripciones" style="background-color: #FF9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Renovar ahora</a></p>
        <p>Saludos,<br>El equipo de Al Fin Entendí</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending access expiring notification:", error);
  }
}

export async function sendAccessExpiredNotification(
  userId: string,
  bookName: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) return;

    await prisma.notification.create({
      data: {
        userId,
        type: "ACCESS_EXPIRED",
        title: "Tu acceso ha expirado",
        message: `Tu acceso a "${bookName}" ha expirado.`,
        metadata: { bookName },
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Tu acceso ha expirado - Al Fin Entendí",
      html: `
        <h2>Tu acceso ha expirado</h2>
        <p>Hola ${user.name || ""},</p>
        <p>Tu acceso a <strong>${bookName}</strong> ha expirado.</p>
        <p>Renueva tu suscripción para volver a acceder al contenido.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/libros" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Ver catálogo</a></p>
        <p>Saludos,<br>El equipo de Al Fin Entendí</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending access expired notification:", error);
  }
}

export async function sendPaymentFailedNotification(
  userId: string,
  reason: string
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    if (!user) return;

    await prisma.notification.create({
      data: {
        userId,
        type: "PAYMENT_FAILED",
        title: "Pago fallido",
        message: `Tu pago no pudo ser procesado. ${reason}`,
        metadata: { reason },
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: "Pago fallido - Al Fin Entendí",
      html: `
        <h2>Problema con tu pago</h2>
        <p>Hola ${user.name || ""},</p>
        <p>Tu pago no pudo ser procesado.</p>
        <p><strong>Razón:</strong> ${reason}</p>
        <p>Por favor, intenta nuevamente o contacta a tu banco.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/libros" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Intentar nuevamente</a></p>
        <p>Saludos,<br>El equipo de Al Fin Entendí</p>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending payment failed notification:", error);
  }
}
