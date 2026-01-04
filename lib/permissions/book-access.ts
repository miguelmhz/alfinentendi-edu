import { prisma } from "@/lib/prisma";

export interface BookAccessCheck {
  hasAccess: boolean;
  reason?: string;
  assignmentType?: string;
}

/**
 * Verifica si un usuario tiene acceso a un libro específico
 * Considera: asignaciones directas, por grupo, grado, escuela, y libros públicos
 */
export async function checkBookAccess(
  userId: string,
  bookSanityId: string
): Promise<BookAccessCheck> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        schoolId: true,
        roles: true,
        groups: {
          select: {
            id: true,
            gradeId: true,
          },
        },
      },
    });

    if (!user) {
      return { hasAccess: false, reason: "Usuario no encontrado" };
    }

    const now = new Date();

    // 1. Verificar asignación directa al estudiante/profesor
    const directAssignment = await prisma.bookAssignment.findFirst({
      where: {
        bookSanityId,
        assignedToType: user.roles.includes("TEACHER") ? "teacher" : "student",
        assignedToId: userId,
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
    });

    if (directAssignment) {
      return { hasAccess: true, assignmentType: "direct" };
    }

    // 2. Verificar asignación por grupo (solo para profesores con grupos)
    if (user.groups.length > 0) {
      const groupIds = user.groups.map(g => g.id);
      const groupAssignment = await prisma.bookAssignment.findFirst({
        where: {
          bookSanityId,
          assignedToType: "group",
          assignedToId: { in: groupIds },
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      });

      if (groupAssignment) {
        return { hasAccess: true, assignmentType: "group" };
      }
    }

    // 3. Verificar asignación por grado
    if (user.groups.length > 0) {
      const gradeIds = user.groups.map(g => g.gradeId);
      const gradeAssignment = await prisma.bookAssignment.findFirst({
        where: {
          bookSanityId,
          assignedToType: "grade",
          assignedToId: { in: gradeIds },
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      });

      if (gradeAssignment) {
        return { hasAccess: true, assignmentType: "grade" };
      }
    }

    // 4. Verificar asignación por escuela
    if (user.schoolId) {
      const schoolAssignment = await prisma.bookAssignment.findFirst({
        where: {
          bookSanityId,
          assignedToType: "school",
          assignedToId: user.schoolId,
          isActive: true,
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      });

      if (schoolAssignment) {
        return { hasAccess: true, assignmentType: "school" };
      }
    }

    // 5. Si no hay asignaciones, no tiene acceso
    return { hasAccess: false, reason: "No tienes asignado este libro" };
  } catch (error) {
    console.error("Error verificando acceso al libro:", error);
    return { hasAccess: false, reason: "Error al verificar acceso" };
  }
}

/**
 * Obtiene todos los libros a los que un usuario tiene acceso
 */
export async function getUserBooks(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        schoolId: true,
        roles: true,
        groups: {
          select: {
            id: true,
            gradeId: true,
          },
        },
      },
    });

    if (!user) {
      return [];
    }

    const now = new Date();
    const assignedToIds: string[] = [userId];

    if (user.schoolId) assignedToIds.push(user.schoolId);
    if (user.groups.length > 0) {
      assignedToIds.push(...user.groups.map(g => g.id));
      assignedToIds.push(...user.groups.map(g => g.gradeId));
    }

    const assignments = await prisma.bookAssignment.findMany({
      where: {
        assignedToId: { in: assignedToIds },
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: now } },
        ],
      },
      select: {
        bookSanityId: true,
      },
      distinct: ["bookSanityId"],
    });

    return assignments.map(a => a.bookSanityId);
  } catch (error) {
    console.error("Error obteniendo libros del usuario:", error);
    return [];
  }
}

/**
 * Verifica si un usuario puede acceder a una guía
 * Las guías solo son accesibles para profesores que tienen acceso al libro
 */
export async function checkGuideAccess(
  userId: string,
  bookSanityId: string
): Promise<BookAccessCheck> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    if (!user) {
      return { hasAccess: false, reason: "Usuario no encontrado" };
    }

    if (!user.roles.includes("TEACHER") && !user.roles.includes("COORDINATOR") && !user.roles.includes("ADMIN")) {
      return { hasAccess: false, reason: "Solo los profesores pueden acceder a las guías" };
    }

    const bookAccess = await checkBookAccess(userId, bookSanityId);
    
    if (!bookAccess.hasAccess) {
      return { hasAccess: false, reason: "No tienes acceso al libro asociado a esta guía" };
    }

    return { hasAccess: true };
  } catch (error) {
    console.error("Error verificando acceso a la guía:", error);
    return { hasAccess: false, reason: "Error al verificar acceso" };
  }
}
