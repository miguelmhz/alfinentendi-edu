import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { stripe, STRIPE_CONFIG } from "@/lib/stripe";
import { client } from "@/lib/sanity/client";
import { validateCoupon, calculateDiscount } from "@/lib/coupon-validation";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: "No autenticado" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: authUser.email! },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { 
      bookSlug, 
      subscriptionPlan, 
      couponCode 
    } = body;

    if (!bookSlug) {
      return NextResponse.json(
        { error: "Slug del libro es requerido" },
        { status: 400 }
      );
    }

    const bookQuery = `*[_type == "book" && slug.current == $slug][0] {
      _id,
      name,
      price,
      "subscriptionPrices": {
        "monthly": monthlyPrice,
        "quarterly": quarterlyPrice,
        "annual": annualPrice,
        "lifetime": lifetimePrice
      }
    }`;

    const book = await client.fetch(bookQuery, { slug: bookSlug });

    if (!book) {
      return NextResponse.json(
        { error: "Libro no encontrado" },
        { status: 404 }
      );
    }

    let amount = 0;
    let purchaseType: "SINGLE_BOOK" | "SUBSCRIPTION" = "SINGLE_BOOK";
    let planType: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "LIFETIME" | undefined;

    if (subscriptionPlan) {
      purchaseType = "SUBSCRIPTION";
      planType = subscriptionPlan.toUpperCase() as "MONTHLY" | "QUARTERLY" | "ANNUAL" | "LIFETIME";
      
      const priceMap: Record<string, string> = {
        MONTHLY: "monthly",
        QUARTERLY: "quarterly",
        ANNUAL: "annual",
        LIFETIME: "lifetime",
      };

      const priceKey = priceMap[planType];
      amount = book.subscriptionPrices?.[priceKey] || book.price || 0;
    } else {
      amount = book.price || 0;
      planType = "LIFETIME";
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Precio no válido para este libro" },
        { status: 400 }
      );
    }

    let finalAmount = amount;
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode) {
      const validation = await validateCoupon(couponCode, book._id, amount);
      
      if (validation.valid && validation.coupon) {
        const discount = calculateDiscount(amount, validation.coupon);
        finalAmount = discount.finalAmount;
        discountAmount = discount.discountAmount;
        appliedCoupon = validation.coupon;
      }
    }

    const amountInCents = Math.round(finalAmount * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: STRIPE_CONFIG.paymentMethods as any,
      line_items: [
        {
          price_data: {
            currency: STRIPE_CONFIG.currency,
            product_data: {
              name: book.name,
              description: subscriptionPlan 
                ? `Suscripción ${subscriptionPlan} - ${book.name}`
                : `Compra única - ${book.name}`,
              metadata: {
                bookSanityId: book._id,
                bookName: book.name,
              },
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: STRIPE_CONFIG.successUrl,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        bookSanityId: book._id,
        bookName: book.name,
        purchaseType,
        subscriptionPlan: planType || "",
        originalAmount: amount.toString(),
        discountAmount: discountAmount.toString(),
        couponCode: couponCode || "",
      },
    });

    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: purchaseType === "SUBSCRIPTION" ? "SUBSCRIPTION_PAYMENT" : "BOOK_PURCHASE",
        amount: finalAmount,
        currency: STRIPE_CONFIG.currency.toUpperCase(),
        status: "PENDING",
        paymentProvider: "stripe",
        providerId: session.id,
        metadata: {
          bookSanityId: book._id,
          bookName: book.name,
          subscriptionPlan: planType,
          originalAmount: amount,
          discountAmount,
          couponCode,
        },
      },
    });

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}
