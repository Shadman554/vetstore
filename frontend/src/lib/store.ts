export type Currency = "USD" | "IQD";

export type AgeRange = "0-3" | "3-5" | "5+";

export interface Product {
  id: string;
  code: string;
  name: string;
  imageUrl?: string;
  images?: string[];
  description?: string;
  priceSingle: number;
  priceBulk: number;
  bulkMinQty?: number;
  currency: Currency;
  ageRange?: AgeRange | null;
  createdAt: string;
}

export function generateProductCode(num: number): string {
  return `WAW-${String(num).padStart(3, "0")}`;
}

export function getFirstImage(product: Product): string | undefined {
  if (product.images && product.images.length > 0) return product.images[0];
  return product.imageUrl;
}

export function formatPrice(price: number, currency: Currency = "USD"): string {
  if (currency === "IQD") {
    return `${Math.round(price).toLocaleString()} IQD`;
  }
  return `$${price.toFixed(2)}`;
}
