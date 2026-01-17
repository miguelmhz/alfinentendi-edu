import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ promotion: null });
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { roles: true },
    });

    if (!user) {
      return NextResponse.json({ promotion: null });
    }

    const now = new Date();

    const promotion = await prisma.promotion.findFirst({
      where: {
        isActive: true,
        startDate: { lte: now },
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
        targetRole: {
          hasSome: user.roles,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ promotion });
  } catch (error) {
    console.error("Error fetching active promotion:", error);
    return NextResponse.json({ promotion: null });
  }
}
