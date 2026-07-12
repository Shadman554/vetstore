import { getAdminToken } from "./admin-auth";
import { getVendorToken } from "./vendor-auth";
import { getCustomerToken } from "./customer-auth";
import type {
  Product,
  Category,
  Vendor,
  Review,
  Coupon,
  Order,
  Customer,
  VendorAnalytics,
  RevenueSummary,
} from "./types";

export interface AppSettings {
  whatsappNumber: string;
  whatsappEnabled: boolean;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, options);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function headersFor(token: string | null): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const adminHeaders = () => headersFor(getAdminToken());
const vendorHeaders = () => headersFor(getVendorToken());
const customerHeaders = () => headersFor(getCustomerToken());

// ---------------------------------------------------------------------------
// Public catalog
// ---------------------------------------------------------------------------
export interface ProductFilters {
  category?: string;
  vendorId?: string;
  species?: string;
  brand?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  const qs = params.toString();
  return apiFetch<Product[]>(`/products${qs ? `?${qs}` : ""}`);
}

export async function fetchProduct(slug: string): Promise<Product> {
  return apiFetch<Product>(`/products/${slug}`);
}

export async function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>("/categories");
}

export async function fetchVendors(): Promise<Vendor[]> {
  return apiFetch<Vendor[]>("/vendors");
}

export async function fetchVendorBySlug(slug: string): Promise<Vendor> {
  return apiFetch<Vendor>(`/vendors/${slug}`);
}

export async function fetchReviews(productId: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/products/${productId}/reviews`);
}

export async function submitReview(
  productId: string,
  review: { rating: number; comment?: string; customerName?: string },
): Promise<Review> {
  return apiFetch<Review>(`/products/${productId}/reviews`, {
    method: "POST",
    headers: customerHeaders(),
    body: JSON.stringify(review),
  });
}

export async function validateCoupon(code: string, vendorIds: string[]): Promise<Coupon> {
  return apiFetch<Coupon>("/coupons/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, vendorIds }),
  });
}

// ---------------------------------------------------------------------------
// Orders / checkout
// ---------------------------------------------------------------------------
export interface CheckoutPayload {
  items: { productId: string; quantity: number }[];
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  couponCode?: string;
}

export async function placeOrder(payload: CheckoutPayload): Promise<Order> {
  return apiFetch<Order>("/orders", {
    method: "POST",
    headers: customerHeaders(),
    body: JSON.stringify(payload),
  });
}

export async function fetchOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${id}`);
}

// ---------------------------------------------------------------------------
// Customer auth
// ---------------------------------------------------------------------------
export async function registerCustomer(data: { name: string; email: string; password: string; phone?: string }) {
  return apiFetch<{ token: string; customer: Customer }>("/customers/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function loginCustomer(email: string, password: string) {
  return apiFetch<{ token: string; customer: Customer }>("/customers/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchCustomerMe(): Promise<Customer> {
  return apiFetch<Customer>("/customers/me", { headers: customerHeaders() });
}

export async function fetchCustomerOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/customers/me/orders", { headers: customerHeaders() });
}

export async function fetchWishlist(): Promise<Product[]> {
  return apiFetch<Product[]>("/customers/me/wishlist", { headers: customerHeaders() });
}

export async function addToWishlist(productId: string): Promise<void> {
  await apiFetch("/customers/me/wishlist", {
    method: "POST",
    headers: customerHeaders(),
    body: JSON.stringify({ productId }),
  });
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiFetch(`/customers/me/wishlist/${productId}`, {
    method: "DELETE",
    headers: customerHeaders(),
  });
}

// ---------------------------------------------------------------------------
// Vendor auth & dashboard
// ---------------------------------------------------------------------------
export async function registerVendor(data: { name: string; email: string; password: string; phone?: string; description?: string }) {
  return apiFetch<{ vendor: Vendor; message: string }>("/vendors/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function loginVendor(email: string, password: string) {
  return apiFetch<{ token: string; vendor: Vendor }>("/vendors/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchVendorMe(): Promise<Vendor> {
  return apiFetch<Vendor>("/vendors/me", { headers: vendorHeaders() });
}

export async function updateVendorMe(updates: Partial<Vendor>): Promise<Vendor> {
  return apiFetch<Vendor>("/vendors/me", {
    method: "PUT",
    headers: vendorHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function fetchVendorProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/vendors/me/products", { headers: vendorHeaders() });
}

export type ProductInput = Omit<Product, "id" | "vendorId" | "vendorName" | "vendorSlug" | "vendorLogoUrl" | "slug" | "createdAt" | "updatedAt" | "avgRating" | "reviewCount">;

export async function createVendorProduct(product: Partial<ProductInput>): Promise<Product> {
  return apiFetch<Product>("/vendors/me/products", {
    method: "POST",
    headers: vendorHeaders(),
    body: JSON.stringify(product),
  });
}

export async function updateVendorProduct(id: string, updates: Partial<ProductInput>): Promise<Product> {
  return apiFetch<Product>(`/vendors/me/products/${id}`, {
    method: "PUT",
    headers: vendorHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deleteVendorProduct(id: string): Promise<void> {
  await apiFetch(`/vendors/me/products/${id}`, { method: "DELETE", headers: vendorHeaders() });
}

export async function fetchVendorOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/vendors/me/orders", { headers: vendorHeaders() });
}

export async function updateVendorOrderStatus(orderId: string, status: string): Promise<Order> {
  return apiFetch<Order>(`/vendors/me/orders/${orderId}/status`, {
    method: "PUT",
    headers: vendorHeaders(),
    body: JSON.stringify({ status }),
  });
}

export async function fetchVendorCoupons(): Promise<Coupon[]> {
  return apiFetch<Coupon[]>("/vendors/me/coupons", { headers: vendorHeaders() });
}

export async function createVendorCoupon(data: { code: string; discountType: string; discountValue: number; expiresAt?: string }): Promise<Coupon> {
  return apiFetch<Coupon>("/vendors/me/coupons", {
    method: "POST",
    headers: vendorHeaders(),
    body: JSON.stringify(data),
  });
}

export async function updateVendorCoupon(id: string, updates: Partial<Coupon>): Promise<Coupon> {
  return apiFetch<Coupon>(`/vendors/me/coupons/${id}`, {
    method: "PUT",
    headers: vendorHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deleteVendorCoupon(id: string): Promise<void> {
  await apiFetch(`/vendors/me/coupons/${id}`, { method: "DELETE", headers: vendorHeaders() });
}

export async function fetchVendorAnalytics(): Promise<VendorAnalytics> {
  return apiFetch<VendorAnalytics>("/vendors/me/analytics", { headers: vendorHeaders() });
}

// ---------------------------------------------------------------------------
// Admin: marketplace management
// ---------------------------------------------------------------------------
export async function fetchAdminVendors(status?: string): Promise<Vendor[]> {
  return apiFetch<Vendor[]>(`/admin/vendors${status ? `?status=${status}` : ""}`, { headers: adminHeaders() });
}

export async function updateVendorStatus(vendorId: string, status: string): Promise<Vendor> {
  return apiFetch<Vendor>(`/admin/vendors/${vendorId}/status`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({ status }),
  });
}

export async function updateVendorCommission(vendorId: string, commissionRate: number | null): Promise<Vendor> {
  return apiFetch<Vendor>(`/admin/vendors/${vendorId}/commission`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({ commissionRate }),
  });
}

export async function fetchPlatformCommissionRate(): Promise<number> {
  const data = await apiFetch<{ commissionRate: number }>("/admin/commission-rate", { headers: adminHeaders() });
  return data.commissionRate;
}

export async function updatePlatformCommissionRate(commissionRate: number): Promise<number> {
  const data = await apiFetch<{ commissionRate: number }>("/admin/commission-rate", {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({ commissionRate }),
  });
  return data.commissionRate;
}

export async function fetchAdminProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/admin/products", { headers: adminHeaders() });
}

export async function createAdminProduct(product: Partial<ProductInput> & { vendorId: string }): Promise<Product> {
  return apiFetch<Product>("/admin/products", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify(product),
  });
}

export async function updateAdminProduct(id: string, updates: Partial<ProductInput> & { vendorId?: string }): Promise<Product> {
  return apiFetch<Product>(`/admin/products/${id}`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function deleteAdminProduct(id: string): Promise<void> {
  await apiFetch(`/admin/products/${id}`, { method: "DELETE", headers: adminHeaders() });
}

export async function fetchAdminOrders(): Promise<Order[]> {
  return apiFetch<Order[]>("/admin/orders", { headers: adminHeaders() });
}

export async function fetchAdminRevenue(): Promise<RevenueSummary> {
  return apiFetch<RevenueSummary>("/admin/revenue", { headers: adminHeaders() });
}

export async function createCategory(name: string): Promise<Category> {
  return apiFetch<Category>("/admin/categories", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ name }),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch(`/admin/categories/${id}`, { method: "DELETE", headers: adminHeaders() });
}

// ---------------------------------------------------------------------------
// Site settings (unchanged)
// ---------------------------------------------------------------------------
export async function fetchSettings(): Promise<AppSettings> {
  return apiFetch<AppSettings>("/settings");
}

export async function updateWhatsAppNumber(number: string): Promise<AppSettings> {
  return apiFetch<AppSettings>("/admin/settings", {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({ whatsappNumber: number }),
  });
}

export async function updateWhatsAppEnabled(enabled: boolean): Promise<AppSettings> {
  return apiFetch<AppSettings>("/admin/settings", {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({ whatsappEnabled: enabled }),
  });
}

export async function changeAdminPin(currentPin: string, newPin: string): Promise<void> {
  await apiFetch<{ success: boolean }>("/admin/change-pin", {
    method: "POST",
    headers: adminHeaders(),
    body: JSON.stringify({ currentPin, newPin }),
  });
}

export interface LoginLog {
  id: string;
  timestamp: string;
  success: boolean;
  ip: string | null;
  userAgent: string | null;
  reason: string | null;
}

export async function fetchLoginLogs(): Promise<LoginLog[]> {
  return apiFetch<LoginLog[]>("/admin/login-logs", { headers: adminHeaders() });
}
