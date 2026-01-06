import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

// DELETE /api/annotations/comments/[id] - Delete a comment
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

    // Check if comment exists and belongs to user
    const existingComment = await prisma.annotationComment.findUnique({
      where: { id },
    });

    if (!existingComment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    if (existingComment.userId !== user.id) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own comments" },
        { status: 403 }
      );
    }

    // Delete comment
    await prisma.annotationComment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
