import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import {
  CheckCircle2, Clock, Package, Truck, Home,
  Phone, MapPin, Tag, ShoppingBag, ArrowRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchOrder } from "@/lib/api";
import type { OrderStatus } from "@/lib/types";

const STATUS_STEPS: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_ICONS: Record<OrderStatus, React.ElementType> = {
  pending: Clock,
  confirmed: CheckCircle2,
  shipped: Truck,
  delivered: Home,
  cancelled: ShoppingBag,
};

function StatusTracker({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20">
        <ShoppingBag className="w-4 h-4 text-destructive" />
        <span className="text-sm font-semibold text-destructive">This order was cancelled</span>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="w-full">
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= currentIdx;
          const Icon = STATUS_ICONS[step];
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    done
                      ? "bg-primary border-primary text-primary-foreground shadow-md"
                      : "border-border text-muted-foreground bg-background"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${done ? "text-primary" : "text-muted-foreground"}`}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-5 ${idx < currentIdx ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id!),
    enabled: !!id,
    staleTime: 1000 * 30,
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <ShoppingBag className="w-14 h-14 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">Order not found</h1>
        <Button onClick={() => navigate("/shop")} className="rounded-xl">Browse Products</Button>
      </div>
    );
  }

  const hasDiscount = order.discountTotal > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-2xl">

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 border-2 border-green-200 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="font-display text-3xl font-black text-foreground mb-1">Order Confirmed!</h1>
          <p className="text-muted-foreground text-sm">
            Thank you, <span className="font-semibold text-foreground">{order.customerName}</span>. Your order has been placed.
          </p>
          <p className="font-mono text-xs text-muted-foreground mt-1">
            Order #{order.id.slice(-8).toUpperCase()}
          </p>
        </div>

        {/* Status tracker */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-5">Order Status</h2>
          <StatusTracker status={order.status} />
        </div>

        {/* Order items */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4">Items Ordered</h2>
          <div className="space-y-3">
            {(order.items ?? []).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{fmt(item.unitPrice)} × {item.quantity}</p>
                  </div>
                </div>
                <span className="font-bold text-foreground shrink-0">{fmt(item.lineTotal)}</span>
              </div>
            ))}
          </div>

          {/* Price breakdown */}
          <div className="mt-5 pt-4 border-t border-border space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{fmt(order.subtotal)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-green-600 font-semibold">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  Discount {order.couponCode && <span className="font-mono text-xs">({order.couponCode})</span>}
                </span>
                <span>−{fmt(order.discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-foreground text-base pt-1 border-t border-border">
              <span>Total Paid</span>
              <span className="text-primary">{fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery details */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4">Delivery Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="font-semibold">{order.customerPhone}</p>
              </div>
            </div>
            {order.customerAddress && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-semibold">{order.customerAddress}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Placed</p>
                <p className="font-semibold">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate("/shop")}
            size="lg"
            className="flex-1 rounded-xl font-bold"
          >
            Continue Shopping <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button
            onClick={() => navigate("/")}
            size="lg"
            variant="outline"
            className="flex-1 rounded-xl font-bold"
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
