import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// GET /api/annotations?bookId=xxx - Fetch all annotations for a book
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get Prisma user ID by email
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true }
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const bookId = searchParams.get("bookId");

    console.log("📥 GET /api/annotations - bookId:", bookId, "Prisma userId:", dbUser.id, "Supabase userId:", user.id);

    if (!bookId) {
      return NextResponse.json(
        { error: "bookId is required" },
        { status: 400 }
      );
    }

    // Fetch annotations for the book
    // Include user's own annotations and shared annotations
    const annotations = await prisma.annotation.findMany({
      where: {
        bookId,
        userId: dbUser.id, // Use Prisma user ID, not Supabase ID
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("✅ Found", annotations.length, "annotations for bookId:", bookId, "Prisma userId:", dbUser.id);

    return NextResponse.json(annotations);
  } catch (error) {
    console.error("Error fetching annotations:", error);
    return NextResponse.json(
      { error: "Failed to fetch annotations" },
      { status: 500 }
    );
  }
}

// POST /api/annotations - Create a new annotation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure user exists in Prisma database
    // Check if user exists by email first (might have different ID)
    let dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { id: true }
    });

    // If user doesn't exist, create it
    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!.split('@')[0],
        },
        select: { id: true }
      });
    }

    const userId = dbUser.id;

    const body = await request.json();
    const {
      bookId,
      pageIndex,
      type,
      content,
      color,
      opacity,
      blendMode,
      strokeWidth,
      rect,
      segmentRects,
      inkPaths,
      lineCoordinates,
      vertices,
      customData,
      visibility,
    } = body;

    // Validate required fields
    if (!bookId || pageIndex === undefined || !type || !rect) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create annotation
    const annotation = await prisma.annotation.create({
      data: {
        userId: userId,
        bookId,
        pageIndex,
        type,
        content,
        color,
        opacity,
        blendMode: blendMode != null ? String(blendMode) : null,
        strokeWidth,
        rect,
        segmentRects,
        inkPaths,
        lineCoordinates,
        vertices,
        customData,
        visibility: visibility || "PRIVATE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(annotation, { status: 201 });
  } catch (error) {
    console.error("Error creating annotation:", error);
    return NextResponse.json(
      { error: "Failed to create annotation" },
      { status: 500 }
    );
  }
}
