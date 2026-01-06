import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Webhook endpoint para sincronizar libros desde Sanity
export async function POST(request: Request) {
  try {
    // Verificar autenticación (opcional: agregar secret key para webhooks)
    const webhookSecret = request.headers.get("x-sanity-webhook-secret");
    
    if (webhookSecret !== process.env.SANITY_WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { _id: sanityId, title, slug, subject, gradeId, pdfUrl, coverImage, isActive } = body;

    if (!sanityId || !title) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: sanityId y title" },
        { status: 400 }
      );
    }

    // Crear o actualizar libro en Prisma
    const book = await prisma.book.upsert({
      where: { sanityId },
      update: {
        title,
        subject: subject || null,
        pdfUrl: pdfUrl || "",
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
      create: {
        sanityId,
        title,
        subject: subject || null,
        pdfUrl: pdfUrl || "",
        isActive: isActive !== undefined ? isActive : true,
        accessType: "restricted",
      },
    });

    return NextResponse.json({ 
      success: true, 
      book,
      message: "Libro sincronizado exitosamente" 
    });
  } catch (error) {
    console.error("Error sincronizando libro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// Endpoint manual para sincronizar todos los libros desde Sanity
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { roles: true },
    });

    if (!user?.roles.includes("ADMIN")) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar esta acción" },
        { status: 403 }
      );
    }

    // Aquí podrías hacer una llamada a Sanity para obtener todos los libros
    // y sincronizarlos. Por ahora retornamos los libros existentes.
    const books = await prisma.book.findMany({
      select: {
        id: true,
        sanityId: true,
        title: true,
        subject: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({ 
      books,
      count: books.length,
      message: "Libros obtenidos exitosamente" 
    });
  } catch (error) {
    console.error("Error obteniendo libros:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
