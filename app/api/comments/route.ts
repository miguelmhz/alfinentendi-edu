import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// POST /api/comments - Create a new comment on an annotation
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { annotationId, content } = body;

    if (!annotationId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify annotation exists
    const annotation = await prisma.annotation.findUnique({
      where: { id: annotationId },
    });

    if (!annotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    // Create comment
    const comment = await prisma.annotationComment.create({
      data: {
        annotationId,
        userId: dbUser.id,
        content,
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

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
