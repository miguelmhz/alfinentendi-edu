import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { client as sanityClient } from "@/lib/sanity/client";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { bookSlug } = body;

    if (!bookSlug) {
      return NextResponse.json(
        { error: "bookSlug es requerido" },
        { status: 400 }
      );
    }

    // Obtener libro desde Sanity
    const query = `*[_type == "book" && slug.current == $slug][0] {
      _id,
      name,
      isPublic
    }`;

    const book = await sanityClient.fetch(query, { slug: bookSlug });

    if (!book) {
      return NextResponse.json(
        { error: "Libro no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el libro sea público
    if (!book.isPublic) {
      return NextResponse.json(
        { error: "Este libro no es gratuito" },
        { status: 400 }
      );
    }

    // Obtener o crear el libro en Prisma
    let prismaBook = await prisma.book.findUnique({
      where: { sanityId: book._id },
      select: { id: true },
    });

    if (!prismaBook) {
      // Sincronizar libro si no existe
      const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/books/sync-single`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sanityId: book._id }),
      });

      if (syncResponse.ok) {
        const syncData = await syncResponse.json();
        prismaBook = { id: syncData.book.id };
      } else {
        return NextResponse.json(
          { error: "Error al sincronizar libro" },
          { status: 500 }
        );
      }
    }

    // Verificar si ya tiene acceso
    const now = new Date();
    const existingAccess = await prisma.bookAccess.findFirst({
      where: {
        userId: user.id,
        bookId: prismaBook.id,
        isActive: true,
        status: "ACTIVE",
        endDate: { gte: now },
      },
    });

    if (existingAccess) {
      return NextResponse.json({
        success: true,
        message: "Ya tienes acceso a este libro",
        alreadyHasAccess: true,
      });
    }

    // Crear acceso permanente al libro gratuito
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 100); // Acceso por 100 años (prácticamente permanente)

    await prisma.bookAccess.create({
      data: {
        userId: user.id,
        bookId: prismaBook.id,
        assignedBy: user.id, // Auto-asignado
        startDate: now,
        endDate: endDate,
        isActive: true,
        status: "ACTIVE",
      },
    });

    // Crear registro de compra gratuita
    await prisma.purchase.create({
      data: {
        userId: user.id,
        bookSanityId: book._id,
        purchaseType: "SINGLE_BOOK",
        price: 0,
        currency: "USD",
        status: "COMPLETED",
        accessGranted: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `¡${book.name} ha sido agregado a tu biblioteca!`,
    });
  } catch (error) {
    console.error("Error al reclamar libro gratuito:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
