import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { ShoppingBag, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/lib/cart";
import { placeOrder } from "@/lib/api";
import { cn } from "@/lib/utils";

function FormField({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function Checkout() {
  const { lines, subtotal, clearCart } = useCart();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    const saved = sessionStorage.getItem("checkout-coupon");
    if (saved) { setCouponCode(saved); sessionStorage.removeItem("checkout-coupon"); }
  }, []);

  const orderMut = useMutation({
    mutationFn: () =>
      placeOrder({
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        customerName: name.trim(),
        customerPhone: phone.trim(),
        customerAddress: address.trim() || undefined,
        couponCode: couponCode.trim() || undefined,
      }),
    onSuccess: (order) => {
      clearCart();
      navigate(`/order/${order.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    orderMut.mutate();
  };

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <ShoppingBag className="w-14 h-14 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <Button onClick={() => navigate("/shop")} className="rounded-xl">Go to Shop</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="flex items-center gap-3 mb-8">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <h1 className="font-display text-3xl font-bold text-foreground">Secure Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 flex flex-col gap-5">
            <div className="rounded-2xl border border-border bg-card p-6 flex flex-col gap-5">
              <h2 className="font-display font-bold text-lg text-foreground border-b border-border pb-3">
                Delivery Information
              </h2>
              <FormField label="Full Name" required>
                <Input
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </FormField>
              <FormField label="Phone Number" required>
                <Input
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl"
                  type="tel"
                  required
                />
              </FormField>
              <FormField label="Delivery Address">
                <textarea
                  placeholder="Street address, city, country..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[90px] resize-y"
                />
              </FormField>
              <FormField label="Coupon Code">
                <Input
                  placeholder="Optional coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="rounded-xl"
                />
              </FormField>
            </div>

            {orderMut.isError && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-semibold">
                {(orderMut.error as Error).message || "Failed to place order. Please try again."}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={orderMut.isPending || !name.trim() || !phone.trim()}
              className="w-full rounded-xl h-12 font-bold text-base"
            >
              {orderMut.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</>
              ) : (
                <>Place Order — ${subtotal.toFixed(2)}</>
              )}
            </Button>
          </form>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display font-bold text-lg text-foreground mb-4 border-b border-border pb-3">
                Order Summary
              </h2>
              <div className="flex flex-col gap-3 mb-4">
                {lines.map((line) => {
                  const price = line.product.salePrice ?? line.product.price;
                  const img = line.product.images?.[0];
                  return (
                    <div key={line.product.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted border border-border overflow-hidden shrink-0">
                        {img ? (
                          <img src={img} alt={line.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-muted" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground line-clamp-1">{line.product.name}</p>
                        <p className="text-xs text-muted-foreground">x{line.quantity}</p>
                      </div>
                      <span className="text-xs font-bold text-foreground shrink-0">
                        ${(price * line.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border pt-3 flex justify-between items-center font-bold text-foreground">
                <span>Total</span>
                <span className="text-primary text-lg">${subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
