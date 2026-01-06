import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// PATCH /api/annotations/[id] - Update an annotation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    // Check if annotation exists and belongs to user
    const existingAnnotation = await prisma.annotation.findUnique({
      where: { id },
    });

    if (!existingAnnotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    if (existingAnnotation.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only update your own annotations" },
        { status: 403 }
      );
    }

    // Update annotation
    const updatedAnnotation = await prisma.annotation.update({
      where: { id },
      data: {
        content: body.content,
        color: body.color,
        opacity: body.opacity,
        blendMode: body.blendMode != null ? String(body.blendMode) : undefined,
        strokeWidth: body.strokeWidth,
        rect: body.rect,
        segmentRects: body.segmentRects,
        inkPaths: body.inkPaths,
        lineCoordinates: body.lineCoordinates,
        vertices: body.vertices,
        customData: body.customData,
        visibility: body.visibility,
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
        },
      },
    });

    return NextResponse.json(updatedAnnotation);
  } catch (error) {
    console.error("Error updating annotation:", error);
    return NextResponse.json(
      { error: "Failed to update annotation" },
      { status: 500 }
    );
  }
}

// DELETE /api/annotations/[id] - Delete an annotation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // Check if annotation exists and belongs to user
    const existingAnnotation = await prisma.annotation.findUnique({
      where: { id },
    });

    if (!existingAnnotation) {
      return NextResponse.json(
        { error: "Annotation not found" },
        { status: 404 }
      );
    }

    if (existingAnnotation.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own annotations" },
        { status: 403 }
      );
    }

    // Delete annotation (comments will be cascade deleted)
    await prisma.annotation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting annotation:", error);
    return NextResponse.json(
      { error: "Failed to delete annotation" },
      { status: 500 }
    );
  }
}
