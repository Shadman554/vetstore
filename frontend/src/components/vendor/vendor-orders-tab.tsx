import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVendorOrders, updateVendorOrderStatus } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { Order, OrderStatus } from "@/lib/types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-purple-100 text-purple-800 border-purple-200",
  delivered: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-red-100 text-red-800 border-red-200",
};

const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateVendorOrderStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-orders"] });
      toast({ title: "Order status updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to update order", description: err.message, variant: "destructive" });
    },
  });

  const next = NEXT_STATUS[order.status];
  const canCancel = order.status === "pending" || order.status === "confirmed";

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/40 transition-colors"
      >
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div>
            <p className="text-xs text-muted-foreground">Order</p>
            <p className="text-sm font-semibold text-foreground">#{order.id.slice(-6).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Customer</p>
            <p className="text-sm font-medium text-foreground">{order.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold text-foreground">{fmt(order.total)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-4 pb-4 pt-3 space-y-4">
              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items</p>
                <div className="space-y-1.5">
                  {(order.items ?? []).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-foreground">{item.productName} <span className="text-muted-foreground">x{item.quantity}</span></span>
                      <span className="font-medium">{fmt(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.customerPhone}</p>
                </div>
                {order.customerAddress && (
                  <div>
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="font-medium">{order.customerAddress}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                {order.couponCode && (
                  <div>
                    <p className="text-xs text-muted-foreground">Coupon</p>
                    <p className="font-mono font-medium">{order.couponCode}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {next && (
                  <Button
                    size="sm"
                    disabled={isPending}
                    onClick={() => updateStatus({ id: order.id, status: next })}
                  >
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    Mark as {next.charAt(0).toUpperCase() + next.slice(1)}
                  </Button>
                )}
                {canCancel && (
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={isPending}
                    onClick={() => updateStatus({ id: order.id, status: "cancelled" })}
                  >
                    Cancel
                  </Button>
                )}
                {order.status === "delivered" && (
                  <Badge variant="secondary" className="self-center">Completed</Badge>
                )}
                {order.status === "cancelled" && (
                  <Badge variant="destructive" className="self-center">Cancelled</Badge>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function VendorOrdersTab() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: fetchVendorOrders,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-0.5">Orders</h2>
          <p className="text-sm text-muted-foreground">{orders?.length ?? 0} incoming orders</p>
        </div>
      </div>

      {!orders?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground mt-1">Orders from customers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
