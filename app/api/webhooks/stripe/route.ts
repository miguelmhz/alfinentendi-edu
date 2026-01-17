import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { 
  assignBookAccess, 
  createPurchaseRecord, 
  createSubscriptionRecord 
} from "@/lib/book-access-assignment";
import { 
  sendPurchaseSuccessNotification,
  sendSubscriptionActivatedNotification,
  sendPaymentFailedNotification,
} from "@/lib/payment-notifications";

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("No Stripe signature found");
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("Payment succeeded:", paymentIntent.id);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  const metadata = session.metadata;
  
  if (!metadata || !metadata.userId || !metadata.bookSanityId) {
    console.error("Missing metadata in session:", session.id);
    return;
  }

  const {
    userId,
    bookSanityId,
    bookName,
    purchaseType,
    subscriptionPlan,
    originalAmount,
    discountAmount,
    couponCode,
  } = metadata;

  const finalAmount = parseFloat(originalAmount) - parseFloat(discountAmount || "0");

  console.log("Processing checkout session:", {
    userId,
    bookSanityId,
    bookName,
    purchaseType,
    subscriptionPlan,
  });

  try {
    const planType = subscriptionPlan as "MONTHLY" | "QUARTERLY" | "ANNUAL" | "LIFETIME";

    const accessResult = await assignBookAccess(
      userId,
      bookSanityId,
      purchaseType as "SINGLE_BOOK" | "SUBSCRIPTION",
      planType
    );

    if (!accessResult.success) {
      console.error("Failed to assign book access:", accessResult.error);
      return;
    }

    const { purchase, transaction } = await createPurchaseRecord(
      userId,
      bookSanityId,
      purchaseType as "SINGLE_BOOK" | "SUBSCRIPTION",
      finalAmount,
      session.currency?.toUpperCase() || "MXN",
      session.payment_intent as string,
      planType
    );

    if (purchaseType === "SUBSCRIPTION" && planType !== "LIFETIME") {
      const subscription = await createSubscriptionRecord(
        userId,
        planType,
        session.subscription as string | undefined
      );

      await sendSubscriptionActivatedNotification(
        userId,
        planType,
        subscription.endDate
      );
    } else {
      await sendPurchaseSuccessNotification(
        userId,
        bookName,
        finalAmount,
        session.currency?.toUpperCase() || "MXN"
      );
    }

    await prisma.transaction.updateMany({
      where: {
        providerId: session.id,
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
        providerId: session.payment_intent as string,
      },
    });

    console.log("Successfully processed checkout session:", session.id);
  } catch (error) {
    console.error("Error in handleCheckoutSessionCompleted:", error);
    throw error;
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    const transaction = await prisma.transaction.findFirst({
      where: {
        providerId: paymentIntent.id,
      },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (transaction) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });

      await sendPaymentFailedNotification(
        transaction.userId,
        paymentIntent.last_payment_error?.message || "Error desconocido"
      );
    }

    console.log("Payment failed:", paymentIntent.id);
  } catch (error) {
    console.error("Error handling payment failed:", error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  try {
    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        user: {
          email: subscription.customer_email,
        },
      },
    });

    if (dbSubscription) {
      const status = subscription.status === "active" ? "ACTIVE" : 
                     subscription.status === "canceled" ? "CANCELED" : 
                     subscription.status === "past_due" ? "SUSPENDED" : "EXPIRED";

      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status,
          endDate: new Date(subscription.current_period_end * 1000),
          nextBillingDate: subscription.cancel_at_period_end 
            ? null 
            : new Date(subscription.current_period_end * 1000),
        },
      });
    }

    console.log("Subscription updated:", subscription.id);
  } catch (error) {
    console.error("Error handling subscription updated:", error);
  }
}

async function handleSubscriptionDeleted(subscription: any) {
  try {
    const dbSubscription = await prisma.subscription.findFirst({
      where: {
        user: {
          email: subscription.customer_email,
        },
      },
    });

    if (dbSubscription) {
      await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
          status: "CANCELED",
          canceledAt: new Date(),
        },
      });

      await prisma.bookAccess.updateMany({
        where: {
          userId: dbSubscription.userId,
          status: "ACTIVE",
        },
        data: {
          status: "EXPIRED",
          isActive: false,
        },
      });
    }

    console.log("Subscription deleted:", subscription.id);
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
  }
}
