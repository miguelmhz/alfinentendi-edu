import { client } from "@/lib/sanity/client";

interface Coupon {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableProducts?: string[];
  applicableCategories?: string[];
  maxUses?: number;
  minPurchaseAmount?: number;
  currentUses?: number;
}

export async function validateCoupon(
  couponCode: string,
  bookSanityId: string,
  purchaseAmount: number
): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> {
  try {
    const query = `*[_type == "coupon" && code == $code && isActive == true][0] {
      _id,
      code,
      discountType,
      discountValue,
      validFrom,
      validUntil,
      isActive,
      "applicableProducts": applicableProducts[]._ref,
      "applicableCategories": applicableCategories[]._ref,
      maxUses,
      minPurchaseAmount,
      "currentUses": count(*[_type == "purchase" && couponCode == ^.code])
    }`;

    const coupon = await client.fetch<Coupon>(query, { code: couponCode });

    if (!coupon) {
      return { valid: false, error: "Cupón no encontrado o inactivo" };
    }

    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = new Date(coupon.validUntil);

    if (now < validFrom) {
      return { valid: false, error: "El cupón aún no es válido" };
    }

    if (now > validUntil) {
      return { valid: false, error: "El cupón ha expirado" };
    }

    if (coupon.maxUses && coupon.currentUses && coupon.currentUses >= coupon.maxUses) {
      return { valid: false, error: "El cupón ha alcanzado su límite de usos" };
    }

    if (coupon.minPurchaseAmount && purchaseAmount < coupon.minPurchaseAmount) {
      return {
        valid: false,
        error: `El monto mínimo de compra es $${coupon.minPurchaseAmount}`,
      };
    }

    if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
      if (!coupon.applicableProducts.includes(bookSanityId)) {
        return { valid: false, error: "Este cupón no es aplicable a este libro" };
      }
    }

    return { valid: true, coupon };
  } catch (error) {
    console.error("Error validating coupon:", error);
    return { valid: false, error: "Error al validar el cupón" };
  }
}

export function calculateDiscount(
  amount: number,
  coupon: Coupon
): { discountAmount: number; finalAmount: number } {
  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = (amount * coupon.discountValue) / 100;
  } else {
    discountAmount = coupon.discountValue;
  }

  discountAmount = Math.min(discountAmount, amount);
  const finalAmount = Math.max(amount - discountAmount, 0);

  return { discountAmount, finalAmount };
}
