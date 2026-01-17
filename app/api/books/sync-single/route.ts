import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { sanityId } = await request.json();

    if (!sanityId) {
      return NextResponse.json(
        { error: "sanityId es requerido" },
        { status: 400 }
      );
    }

    const query = `*[_type == "book" && _id == $sanityId][0] {
      _id,
      name,
      slug,
      subject,
      grade,
      "pdfUrl": pdfFile.asset->url,
      "coverImage": coverImage.asset->url,
      isPublic,
      status
    }`;

    const sanityBook = await client.fetch(query, { sanityId });

    if (!sanityBook) {
      return NextResponse.json(
        { error: "Libro no encontrado en Sanity" },
        { status: 404 }
      );
    }

    const prismaBook = await prisma.book.upsert({
      where: { sanityId: sanityBook._id },
      update: {
        title: sanityBook.name,
        subject: sanityBook.subject || null,
        pdfUrl: sanityBook.pdfUrl || "",
        isActive: sanityBook.status === "published" || sanityBook.isPublic === true,
        updatedAt: new Date(),
      },
      create: {
        sanityId: sanityBook._id,
        title: sanityBook.name,
        subject: sanityBook.subject || null,
        pdfUrl: sanityBook.pdfUrl || "",
        isActive: sanityBook.status === "published" || sanityBook.isPublic === true,
        accessType: sanityBook.isPublic ? "public" : "restricted",
      },
    });

    return NextResponse.json({
      success: true,
      book: prismaBook,
      message: "Libro sincronizado exitosamente",
    });
  } catch (error: any) {
    console.error("Error sincronizando libro:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
