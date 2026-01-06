import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";
import { TeacherDashboard } from "@/components/dashboard/teacher-dashboard";
import { CoordinatorDashboard } from "@/components/dashboard/coordinator-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export default async function Home() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: data.claims.email as string },
    include: {
      school: {
        select: {
          name: true,
          id: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const primaryRole = user.roles[0];

  if (primaryRole === "STUDENT") {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [activeBooks, unreadNotifications, recentComments, expiringAccess] = await Promise.all([
      prisma.bookAccess.count({
        where: {
          userId: user.id,
          isActive: true,
          status: "ACTIVE",
          endDate: { gte: now },
        },
      }),
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
      prisma.guideComment.count({
        where: {
          userId: user.id,
          createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.bookAccess.count({
        where: {
          userId: user.id,
          isActive: true,
          status: "ACTIVE",
          endDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
    ]);

    return (
      <div className="container mx-auto p-6">
        <StudentDashboard
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
          }}
          stats={{
            activeBooks,
            unreadNotifications,
            recentComments,
            expiringAccess,
          }}
        />
      </div>
    );
  }

  if (primaryRole === "TEACHER") {
    const [totalStudents, activeGroups, assignedBooks, unreadNotifications, recentComments, pendingReviews] = await Promise.all([
      prisma.userGroup.count({
        where: {
          group: {
            teacherId: user.id,
          },
        },
      }),
      prisma.group.count({
        where: {
          teacherId: user.id,
        },
      }),
      prisma.bookAssignment.count({
        where: {
          assignedBy: user.id,
          isActive: true,
        },
      }),
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
      prisma.guideComment.count({
        where: {
          createdAt: { gte: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.commentReport.count({
        where: {
          status: "pending",
        },
      }),
    ]);

    return (
      <div className="container mx-auto p-6">
        <TeacherDashboard
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
          }}
          stats={{
            totalStudents,
            activeGroups,
            assignedBooks,
            unreadNotifications,
            recentComments,
            pendingReviews,
          }}
        />
      </div>
    );
  }

  if (primaryRole === "COORDINATOR") {
    if (!user.schoolId) {
      return <div className="container mx-auto p-6">Error: Coordinador sin escuela asignada</div>;
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const [totalStudents, totalTeachers, activeLicenses, expiringLicenses, unreadNotifications] = await Promise.all([
      prisma.user.count({
        where: {
          schoolId: user.schoolId,
          roles: { has: "STUDENT" },
          status: "ACTIVE",
        },
      }),
      prisma.user.count({
        where: {
          schoolId: user.schoolId,
          roles: { has: "TEACHER" },
          status: "ACTIVE",
        },
      }),
      prisma.schoolBookLicense.count({
        where: {
          schoolId: user.schoolId,
          isActive: true,
          endDate: { gte: now },
        },
      }),
      prisma.schoolBookLicense.count({
        where: {
          schoolId: user.schoolId,
          isActive: true,
          endDate: {
            gte: now,
            lte: thirtyDaysFromNow,
          },
        },
      }),
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
    ]);

    return (
      <div className="container mx-auto p-6">
        <CoordinatorDashboard
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
          }}
          stats={{
            totalStudents,
            totalTeachers,
            activeLicenses,
            expiringLicenses,
            unreadNotifications,
            schoolName: user.school?.name || "Escuela",
          }}
        />
      </div>
    );
  }

  if (primaryRole === "ADMIN") {
    const now = new Date();

    const [totalSchools, totalUsers, totalLicenses, activeBooks, unreadNotifications, pendingReports] = await Promise.all([
      prisma.school.count(),
      prisma.user.count({
        where: {
          status: "ACTIVE",
        },
      }),
      prisma.schoolBookLicense.count({
        where: {
          isActive: true,
          endDate: { gte: now },
        },
      }),
      prisma.book.count({
        where: {
          isActive: true,
        },
      }),
      prisma.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      }),
      prisma.commentReport.count({
        where: {
          status: "pending",
        },
      }),
    ]);

    return (
      <div className="container mx-auto p-6">
        <AdminDashboard
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
          }}
          stats={{
            totalSchools,
            totalUsers,
            totalLicenses,
            activeBooks,
            unreadNotifications,
            pendingReports,
            systemHealth: "healthy",
          }}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Rol no reconocido</h1>
        <p className="text-muted-foreground">Por favor contacta al administrador.</p>
      </div>
    </div>
  );
}
