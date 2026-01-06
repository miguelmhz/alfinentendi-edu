import { client } from "@/lib/sanity/client";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params.id;

    // Intentar buscar por slug primero, luego por _id
    const query = `*[_type == "book" && (slug.current == $id || _id == $id)][0] {
      _id,
      name,
      slug,
      description,
      "authors": authors[]->{ name, slug, bio, image },
      "categories": categories[]->{ name, slug },
      coverImage {
        asset-> {
          _id,
          url
        }
      },
      file {
        asset-> {
          _id,
          url
        }
      },
      preview {
        asset-> {
          _id,
          url
        }
      },
      isbn,
      publishedDate,
      pages,
      format,
      status,
      price,
      purchaseLink,
      isPublic
    }`;

    const book = await client.fetch(query, { id });

    if (!book) {
      return NextResponse.json(
        { error: "Libro no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ book });
  } catch (error) {
    console.error("Error obteniendo libro:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
