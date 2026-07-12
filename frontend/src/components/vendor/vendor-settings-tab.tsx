import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchVendorMe, updateVendorMe } from "@/lib/api";
import { motion } from "framer-motion";
import { Loader2, Save, User, Phone, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

export function VendorSettingsTab() {
  const qc = useQueryClient();

  const { data: vendor, isLoading } = useQuery({
    queryKey: ["vendor-me"],
    queryFn: fetchVendorMe,
  });

  const [form, setForm] = useState({
    name: "",
    phone: "",
    description: "",
    logoUrl: "",
    bannerUrl: "",
  });

  useEffect(() => {
    if (vendor) {
      setForm({
        name: vendor.name ?? "",
        phone: vendor.phone ?? "",
        description: vendor.description ?? "",
        logoUrl: vendor.logoUrl ?? "",
        bannerUrl: vendor.bannerUrl ?? "",
      });
    }
  }, [vendor]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updateVendorMe({
        name: form.name,
        phone: form.phone || null,
        description: form.description || null,
        logoUrl: form.logoUrl || null,
        bannerUrl: form.bannerUrl || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-me"] });
      toast({ title: "Store settings saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to save settings", description: err.message, variant: "destructive" });
    },
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate();
  }

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-0.5">Store Settings</h2>
        <p className="text-sm text-muted-foreground">Update your public storefront details.</p>
      </div>

      {/* Status banner */}
      {vendor && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${
          vendor.status === "approved"
            ? "bg-green-50 border-green-200 text-green-800"
            : vendor.status === "pending"
            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            vendor.status === "approved" ? "bg-green-500" : vendor.status === "pending" ? "bg-yellow-500" : "bg-red-500"
          }`} />
          Account status: <span className="capitalize">{vendor.status}</span>
          {vendor.commissionRate != null && (
            <span className="ml-auto text-xs font-normal opacity-75">
              Commission: {vendor.commissionRate}%
            </span>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="s-name">Business name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="s-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="pl-9"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-phone">Phone number</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="s-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-description">Store description</Label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Textarea
              id="s-description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="pl-9 min-h-[90px] resize-none"
              placeholder="Describe your clinic or store..."
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-logo">Logo URL</Label>
          <div className="relative">
            <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="s-logo"
              name="logoUrl"
              type="url"
              value={form.logoUrl}
              onChange={handleChange}
              className="pl-9"
              placeholder="https://..."
            />
          </div>
          {form.logoUrl && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={form.logoUrl}
              alt="Logo preview"
              className="w-16 h-16 rounded-xl object-cover border border-border mt-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="s-banner">Banner URL</Label>
          <div className="relative">
            <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="s-banner"
              name="bannerUrl"
              type="url"
              value={form.bannerUrl}
              onChange={handleChange}
              className="pl-9"
              placeholder="https://..."
            />
          </div>
          {form.bannerUrl && (
            <motion.img
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={form.bannerUrl}
              alt="Banner preview"
              className="w-full h-24 rounded-xl object-cover border border-border mt-1"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          )}
        </div>

        <Button type="submit" disabled={isPending} className="w-full">
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save settings
        </Button>
      </form>
    </div>
  );
}
