export type VendorStatus = "pending" | "approved" | "rejected";
export type ProductStatus = "active" | "inactive";
export type Species = "dog" | "cat" | "bird" | "farm" | "other";
export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type DiscountType = "percent" | "fixed";

export interface Vendor {
  id: string;
  slug: string;
  name: string;
  email?: string;
  phone?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  status: VendorStatus;
  commissionRate?: number | null;
  createdAt: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
}

export interface Product {
  id: string;
  vendorId: string;
  vendorName?: string;
  vendorSlug?: string;
  vendorLogoUrl?: string | null;
  slug: string;
  sku?: string | null;
  barcode?: string | null;
  brand?: string | null;
  categoryId?: string | null;
  species?: Species | null;
  name: string;
  description?: string | null;
  ingredients?: string | null;
  images?: string[] | null;
  price: number;
  salePrice?: number | null;
  stock: number;
  weight?: string | null;
  expirationDate?: string | null;
  status: ProductStatus;
  avgRating?: number | null;
  reviewCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Review {
  id: string;
  productId: string;
  customerId?: string | null;
  customerName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface Coupon {
  id: string;
  vendorId?: string | null;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  expiresAt?: string | null;
  active: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  vendorId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  commissionRate: number;
  commissionAmount: number;
}

export interface Order {
  id: string;
  customerId?: string | null;
  customerName: string;
  customerPhone: string;
  customerAddress?: string | null;
  status: OrderStatus;
  subtotal: number;
  discountTotal: number;
  commissionTotal: number;
  total: number;
  couponCode?: string | null;
  createdAt: string;
  items?: OrderItem[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  createdAt: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface VendorAnalytics {
  revenue: number;
  netRevenue: number;
  commissionPaid: number;
  unitsSold: number;
  orderLineCount: number;
  totalProducts: number;
  activeProducts: number;
}

export interface RevenueSummary {
  totalOrders: number;
  totalSales: number;
  totalCommission: number;
  vendors: { total: number; pending: number; approved: number };
}
