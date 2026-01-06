import { prisma } from "@/lib/prisma";
import { AccessStatus } from "./generated/prisma";

/**
 * Verifica si un usuario tiene acceso activo a un libro
 */
export async function checkBookAccess(
  userId: string,
  bookId: string
): Promise<boolean> {
  try {
    const access = await prisma.bookAccess.findFirst({
      where: {
        userId,
        bookId,
        isActive: true,
        status: "ACTIVE",
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    return !!access;
  } catch (error) {
    console.error("Error verificando acceso al libro:", error);
    return false;
  }
}

/**
 * Verifica si un usuario tiene acceso a un libro por su sanityId
 */
export async function checkBookAccessBySanityId(
  userId: string,
  sanityId: string
): Promise<boolean> {
  try {
    const book = await prisma.book.findUnique({
      where: { sanityId },
      select: { id: true },
    });

    if (!book) {
      return false;
    }

    return await checkBookAccess(userId, book.id);
  } catch (error) {
    console.error("Error verificando acceso al libro:", error);
    return false;
  }
}

/**
 * Obtiene todos los libros a los que un usuario tiene acceso activo
 */
export async function getUserActiveBooks(userId: string) {
  try {
    const accesses = await prisma.bookAccess.findMany({
      where: {
        userId,
        isActive: true,
        status: "ACTIVE",
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        book: {
          select: {
            id: true,
            sanityId: true,
            title: true,
            subject: true,
            pdfUrl: true,
          },
        },
      },
    });

    return accesses.map((access) => access.book);
  } catch (error) {
    console.error("Error obteniendo libros del usuario:", error);
    return [];
  }
}

/**
 * Revoca el acceso de un usuario a un libro
 */
export async function revokeBookAccess(
  accessId: string,
  revokedBy: string,
): Promise<boolean> {
  try {
    await prisma.bookAccess.update({
      where: { id: accessId },
      data: {
        status: "REVOKED",
        isActive: false,
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("Error revocando acceso:", error);
    return false;
  }
}

/**
 * Extiende la fecha de expiración de un acceso
 */
export async function extendBookAccess(
  accessId: string,
  newEndDate: Date
): Promise<boolean> {
  try {
    await prisma.bookAccess.update({
      where: { id: accessId },
      data: {
        endDate: newEndDate,
        updatedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("Error extendiendo acceso:", error);
    return false;
  }
}

/**
 * Job para actualizar el estado de accesos expirados
 * Debe ejecutarse periódicamente (ej: cron job diario)
 */
export async function updateExpiredAccesses() {
  try {
    const result = await prisma.bookAccess.updateMany({
      where: {
        endDate: { lt: new Date() },
        status: "ACTIVE",
      },
      data: {
        status: "EXPIRED",
        isActive: false,
      },
    });

    console.log(`Actualizados ${result.count} accesos expirados`);
    return result.count;
  } catch (error) {
    console.error("Error actualizando accesos expirados:", error);
    return 0;
  }
}
