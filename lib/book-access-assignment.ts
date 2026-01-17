import { prisma } from "@/lib/prisma";
import { client } from "@/lib/sanity/client";

interface AssignmentResult {
  success: boolean;
  bookAccessId?: string;
  error?: string;
}

export async function assignBookAccess(
  userId: string,
  bookSanityId: string,
  purchaseType: "SINGLE_BOOK" | "BOOK_BUNDLE" | "SUBSCRIPTION",
  subscriptionPlan?: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "LIFETIME"
): Promise<AssignmentResult> {
  try {
    const book = await prisma.book.findUnique({
      where: { sanityId: bookSanityId },
      select: { id: true },
    });

    if (!book) {
      const syncResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/books/sync-single`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sanityId: bookSanityId }),
        }
      );

      if (!syncResponse.ok) {
        return { success: false, error: "Libro no encontrado en la base de datos" };
      }

      const syncData = await syncResponse.json();
      if (!syncData.book) {
        return { success: false, error: "Error al sincronizar el libro" };
      }
    }

    const bookRecord = await prisma.book.findUnique({
      where: { sanityId: bookSanityId },
      select: { id: true },
    });

    if (!bookRecord) {
      return { success: false, error: "Error al obtener el libro" };
    }

    const startDate = new Date();
    let endDate: Date;

    if (purchaseType === "SINGLE_BOOK" && subscriptionPlan === "LIFETIME") {
      endDate = new Date("2099-12-31");
    } else if (subscriptionPlan === "MONTHLY") {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (subscriptionPlan === "QUARTERLY") {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6);
    } else if (subscriptionPlan === "ANNUAL") {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const bookAccess = await prisma.bookAccess.create({
      data: {
        userId,
        bookId: bookRecord.id,
        assignedBy: userId,
        startDate,
        endDate,
        isActive: true,
        status: "ACTIVE",
      },
    });

    return { success: true, bookAccessId: bookAccess.id };
  } catch (error) {
    console.error("Error assigning book access:", error);
    return { success: false, error: "Error al asignar acceso al libro" };
  }
}

export async function createPurchaseRecord(
  userId: string,
  bookSanityId: string,
  purchaseType: "SINGLE_BOOK" | "BOOK_BUNDLE" | "SUBSCRIPTION",
  price: number,
  currency: string,
  stripePaymentIntentId: string,
  subscriptionPlan?: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "LIFETIME"
) {
  try {
    let expiresAt: Date | null = null;

    if (subscriptionPlan && subscriptionPlan !== "LIFETIME") {
      const startDate = new Date();
      if (subscriptionPlan === "MONTHLY") {
        expiresAt = new Date(startDate);
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      } else if (subscriptionPlan === "QUARTERLY") {
        expiresAt = new Date(startDate);
        expiresAt.setMonth(expiresAt.getMonth() + 6);
      } else if (subscriptionPlan === "ANNUAL") {
        expiresAt = new Date(startDate);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      }
    }

    const purchase = await prisma.purchase.create({
      data: {
        userId,
        bookSanityId,
        purchaseType,
        price,
        currency,
        status: "COMPLETED",
        accessGranted: true,
        expiresAt,
      },
    });

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        type: purchaseType === "SUBSCRIPTION" ? "SUBSCRIPTION_PAYMENT" : "BOOK_PURCHASE",
        amount: price,
        currency,
        status: "COMPLETED",
        paymentProvider: "stripe",
        providerId: stripePaymentIntentId,
        purchaseId: purchase.id,
        metadata: {
          bookSanityId,
          subscriptionPlan,
        },
      },
    });

    return { purchase, transaction };
  } catch (error) {
    console.error("Error creating purchase record:", error);
    throw error;
  }
}

export async function createSubscriptionRecord(
  userId: string,
  planType: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "LIFETIME",
  stripeSubscriptionId?: string
) {
  try {
    const startDate = new Date();
    let endDate: Date;

    if (planType === "LIFETIME") {
      endDate = new Date("2099-12-31");
    } else if (planType === "MONTHLY") {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planType === "QUARTERLY") {
      endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 6);
    } else {
      endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        planType,
        status: "ACTIVE",
        startDate,
        endDate,
        autoRenew: planType !== "LIFETIME",
        nextBillingDate: planType !== "LIFETIME" ? endDate : null,
      },
    });

    return subscription;
  } catch (error) {
    console.error("Error creating subscription record:", error);
    throw error;
  }
}
