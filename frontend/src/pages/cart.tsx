import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, Trash2, Plus, Minus, Tag, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import { validateCoupon } from "@/lib/api";
import type { Coupon, CartLine } from "@/lib/types";
import { cn } from "@/lib/utils";

function groupByVendor(lines: CartLine[]): Record<string, CartLine[]> {
  return lines.reduce<Record<string, CartLine[]>>((acc, line) => {
    const key = line.product.vendorName ?? "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(line);
    return acc;
  }, {});
}

export default function Cart() {
  const { lines, updateQuantity, removeFromCart, subtotal } = useCart();
  const [, navigate] = useLocation();
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  const vendorGroups = groupByVendor(lines);

  const couponMut = useMutation({
    mutationFn: () => {
      const vendorIds = [...new Set(lines.map((l) => l.product.vendorId))];
      return validateCoupon(couponCode.trim(), vendorIds);
    },
    onSuccess: (coupon) => {
      setAppliedCoupon(coupon);
      setCouponError("");
    },
    onError: (err: Error) => {
      setCouponError(err.message || "Invalid coupon code.");
      setAppliedCoupon(null);
    },
  });

  const discount = appliedCoupon
    ? appliedCoupon.discountType === "percent"
      ? (subtotal * appliedCoupon.discountValue) / 100
      : appliedCoupon.discountValue
    : 0;

  const total = Math.max(0, subtotal - discount);

  if (lines.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4 text-center">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/40" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground">Add products from our catalog to get started.</p>
        </div>
        <Link href="/shop">
          <Button className="rounded-xl px-8 h-11 font-bold">
            Browse Products <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <h1 className="font-display text-3xl font-bold text-foreground mb-8">
          Your Cart
          <span className="text-muted-foreground font-normal text-xl ml-3">
            ({lines.length} item{lines.length !== 1 ? "s" : ""})
          </span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Line items */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {Object.entries(vendorGroups).map(([vendorName, vendorLines]) => (
              <div key={vendorName} className="rounded-2xl border border-border bg-card overflow-hidden">
                {/* Vendor header */}
                <div className="px-5 py-3 bg-muted/50 border-b border-border flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
                    <Package className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="font-semibold text-sm text-foreground">{vendorName}</span>
                  <Badge variant="outline" className="text-xs ml-auto">
                    {vendorLines.length} item{vendorLines.length !== 1 ? "s" : ""}
                  </Badge>
                </div>

                <div className="divide-y divide-border">
                  <AnimatePresence>
                    {vendorLines.map((line) => {
                      const displayPrice = line.product.salePrice ?? line.product.price;
                      const img = line.product.images?.[0];
                      return (
                        <motion.div
                          key={line.product.id}
                          initial={{ opacity: 1 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex gap-4 p-5"
                        >
                          {/* Image */}
                          <div className="w-16 h-16 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
                            {img ? (
                              <img src={img} alt={line.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-7 h-7 text-muted-foreground/30" />
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <Link href={`/product/${line.product.slug}`}>
                              <h3 className="font-semibold text-sm text-foreground leading-snug hover:text-primary transition-colors cursor-pointer line-clamp-2">
                                {line.product.name}
                              </h3>
                            </Link>
                            {line.product.brand && (
                              <p className="text-xs text-muted-foreground mt-0.5">{line.product.brand}</p>
                            )}
                            <div className="flex items-center justify-between mt-3 gap-3">
                              {/* Qty stepper */}
                              <div className="flex items-center gap-0 border border-border rounded-lg overflow-hidden">
                                <button
                                  onClick={() => updateQuantity(line.product.id, line.quantity - 1)}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors text-sm"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-8 text-center font-bold text-sm">{line.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(line.product.id, line.quantity + 1)}
                                  disabled={line.quantity >= line.product.stock}
                                  className="w-8 h-8 flex items-center justify-center hover:bg-muted transition-colors text-sm disabled:opacity-40"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              {/* Price */}
                              <span className="font-bold text-base text-primary">
                                ${(displayPrice * line.quantity).toFixed(2)}
                              </span>
                              {/* Remove */}
                              <button
                                onClick={() => removeFromCart(line.product.id)}
                                className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-destructive/10"
                                aria-label="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-2xl border border-border bg-card p-6 flex flex-col gap-5">
              <h2 className="font-display text-lg font-bold text-foreground">Order Summary</h2>

              {/* Coupon */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-foreground">Coupon Code</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                    className="rounded-xl text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => couponMut.mutate()}
                    disabled={!couponCode.trim() || couponMut.isPending}
                    className="rounded-xl shrink-0"
                  >
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {couponError && <p className="text-xs text-destructive font-medium">{couponError}</p>}
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-secondary/10 rounded-xl px-3 py-2">
                    <span className="text-xs font-bold text-secondary">{appliedCoupon.code} applied</span>
                    <button
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={() => { setAppliedCoupon(null); setCouponCode(""); }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="flex flex-col gap-2 text-sm border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-secondary font-semibold">
                    <span>Discount</span>
                    <span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-base text-foreground border-t border-border pt-2 mt-1">
                  <span>Total</span>
                  <span className="text-primary text-lg">${total.toFixed(2)}</span>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full rounded-xl h-12 font-bold"
                onClick={() => {
                  const state = appliedCoupon ? { coupon: appliedCoupon.code } : {};
                  navigate("/checkout");
                  if (appliedCoupon) {
                    sessionStorage.setItem("checkout-coupon", appliedCoupon.code);
                  }
                }}
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </Button>

              <Link href="/shop">
                <p className="text-center text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer font-medium">
                  Continue Shopping
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
