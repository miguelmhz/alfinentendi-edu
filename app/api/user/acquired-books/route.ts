import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const now = new Date();

    // Get active book accesses
    const bookAccesses = await prisma.bookAccess.findMany({
      where: {
        userId: user.id,
        isActive: true,
        status: "ACTIVE",
        endDate: { gte: now },
      },
      include: {
        book: {
          select: {
            sanityId: true,
          },
        },
      },
    });

    // Get book IDs from Sanity
    const sanityIds = bookAccesses.map(access => access.book.sanityId);

    if (sanityIds.length === 0) {
      return NextResponse.json({ books: [] });
    }

    // Fetch book details from Sanity
    const query = `*[_type == "book" && _id in $ids] {
      _id,
      name,
      slug,
      "authors": authors[]->{ name, slug },
      coverImage {
        asset-> {
          _id,
          url
        }
      }
    }`;

    const sanityBooks = await client.fetch(query, { ids: sanityIds });

    // Merge with access information
    const booksWithAccess = sanityBooks.map((book: any) => {
      const access = bookAccesses.find(a => a.book.sanityId === book._id);
      return {
        ...book,
        expiresAt: access?.endDate,
        accessType: "subscription", // Can be enhanced to differentiate purchase vs subscription
      };
    });

    return NextResponse.json({ books: booksWithAccess });
  } catch (error) {
    console.error("Error fetching acquired books:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
