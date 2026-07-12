import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Store, Package, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchVendorBySlug, fetchProducts } from "@/lib/api";
import { VetProductCard } from "@/components/vet-product-card";

export default function VendorStorefront() {
  const [, params] = useRoute("/vendors/:slug");
  const slug = params?.slug ?? "";

  const { data: vendor, isLoading: vendorLoading, isError } = useQuery({
    queryKey: ["vendor", slug],
    queryFn: () => fetchVendorBySlug(slug),
    enabled: !!slug,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products", { vendorId: vendor?.id }],
    queryFn: () => fetchProducts({ vendorId: vendor!.id }),
    enabled: !!vendor?.id,
  });

  const activeProducts = products.filter((p) => p.status === "active");

  if (vendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <Store className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">Vendor not found</h1>
        <Link href="/vendors"><Button className="rounded-xl">Browse Vendors</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-primary/30 to-secondary/20 overflow-hidden">
        {vendor.bannerUrl ? (
          <img src={vendor.bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle, #0B6FB8 1px, transparent 1px)", backgroundSize: "30px 30px" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link href="/vendors">
            <button className="flex items-center gap-1.5 bg-card/90 backdrop-blur-sm text-sm font-semibold px-3 py-2 rounded-xl border border-border hover:bg-card transition-colors">
              <ArrowLeft className="w-4 h-4" /> All Vendors
            </button>
          </Link>
        </div>
      </div>

      {/* Vendor info card */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-12 mb-10">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col sm:flex-row gap-5 items-start">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl border-2 border-border bg-background flex items-center justify-center overflow-hidden shrink-0">
              {vendor.logoUrl ? (
                <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-display font-bold text-3xl text-primary/40">{vendor.name.charAt(0)}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{vendor.name}</h1>
                <Badge className="bg-secondary/10 text-secondary border-0 text-xs font-bold">
                  Verified Vendor
                </Badge>
              </div>
              {vendor.description && (
                <p className="text-muted-foreground text-sm leading-relaxed mb-3">{vendor.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {vendor.phone && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <Phone className="w-4 h-4 text-primary" /> {vendor.phone}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-medium">
                  <Package className="w-4 h-4 text-primary" /> {activeProducts.length} product{activeProducts.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products grid */}
        <div className="pb-16">
          <h2 className="font-display text-xl font-bold text-foreground mb-6">
            Products from {vendor.name}
          </h2>

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[3/4]" />
              ))}
            </div>
          ) : activeProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <Package className="w-14 h-14 text-muted-foreground/30" />
              <h3 className="font-display text-lg font-bold text-foreground">No products yet</h3>
              <p className="text-muted-foreground text-sm">This vendor hasn't listed any products yet.</p>
              <Link href="/shop">
                <Button variant="outline" className="rounded-xl mt-2">Browse All Products</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeProducts.map((product, i) => (
                <VetProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
