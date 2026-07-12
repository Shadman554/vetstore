import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVendorCoupons, createVendorCoupon, updateVendorCoupon, deleteVendorCoupon } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import type { Coupon } from "@/lib/types";

function CouponRow({ coupon, onToggle, onDelete }: { coupon: Coupon; onToggle: () => void; onDelete: () => void }) {
  const fmt = (c: Coupon) =>
    c.discountType === "percent" ? `${c.discountValue}% off` : `$${c.discountValue} off`;

  const expired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4"
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <Tag className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-foreground text-sm">{coupon.code}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${coupon.active && !expired ? "bg-green-100 text-green-800 border-green-200" : "bg-muted text-muted-foreground border-border"}`}>
            {expired ? "Expired" : coupon.active ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {fmt(coupon)} {coupon.expiresAt && `· Expires ${new Date(coupon.expiresAt).toLocaleDateString()}`}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-primary transition-colors"
          title={coupon.active ? "Deactivate" : "Activate"}
        >
          {coupon.active ? (
            <ToggleRight className="w-6 h-6 text-secondary" />
          ) : (
            <ToggleLeft className="w-6 h-6" />
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive transition-colors"
          title="Delete coupon"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

function CreateCouponForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    code: "",
    discountType: "percent" as "percent" | "fixed",
    discountValue: "",
    expiresAt: "",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      createVendorCoupon({
        code: form.code.toUpperCase(),
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        expiresAt: form.expiresAt || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-coupons"] });
      toast({ title: "Coupon created" });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Failed to create coupon", description: err.message, variant: "destructive" });
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-muted/40 border border-border rounded-xl p-5"
    >
      <h3 className="font-semibold text-foreground mb-4">New Coupon</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="code">Coupon code</Label>
          <Input
            id="code"
            name="code"
            placeholder="SAVE20"
            value={form.code}
            onChange={handleChange}
            className="font-mono uppercase"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="discountType">Discount type</Label>
          <select
            id="discountType"
            name="discountType"
            value={form.discountType}
            onChange={handleChange}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed amount ($)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="discountValue">
            {form.discountType === "percent" ? "Discount %" : "Discount amount"}
          </Label>
          <Input
            id="discountValue"
            name="discountValue"
            type="number"
            min="0"
            step="0.01"
            placeholder={form.discountType === "percent" ? "20" : "5.00"}
            value={form.discountValue}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expiresAt">
            Expiry date <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="expiresAt"
            name="expiresAt"
            type="date"
            value={form.expiresAt}
            onChange={handleChange}
          />
        </div>

        <div className="sm:col-span-2 flex gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create coupon
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  );
}

export function VendorCouponsTab() {
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["vendor-coupons"],
    queryFn: fetchVendorCoupons,
  });

  const { mutate: toggleCoupon } = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateVendorCoupon(id, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-coupons"] }),
    onError: (err: Error) =>
      toast({ title: "Failed to update coupon", description: err.message, variant: "destructive" }),
  });

  const { mutate: deleteCoupon } = useMutation({
    mutationFn: deleteVendorCoupon,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-coupons"] });
      toast({ title: "Coupon deleted" });
    },
    onError: (err: Error) =>
      toast({ title: "Failed to delete coupon", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-0.5">Coupons & Discounts</h2>
          <p className="text-sm text-muted-foreground">{coupons?.length ?? 0} coupons</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4" />
          New coupon
        </Button>
      </div>

      <AnimatePresence>
        {showForm && <CreateCouponForm onClose={() => setShowForm(false)} />}
      </AnimatePresence>

      {!coupons?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tag className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="font-semibold text-foreground">No coupons yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create a coupon to offer discounts to customers.</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {coupons.map((c) => (
            <CouponRow
              key={c.id}
              coupon={c}
              onToggle={() => toggleCoupon({ id: c.id, active: !c.active })}
              onDelete={() => deleteCoupon(c.id)}
            />
          ))}
        </AnimatePresence>
      )}
    </div>
  );
}
