import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
});

export const STRIPE_CONFIG = {
  currency: "mxn",
  paymentMethods: ["card", "oxxo"],
  successUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/mis-libros?payment=success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/mis-libros?payment=cancelled`,
};
