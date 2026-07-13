import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, Award, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchProducts, fetchCategories, fetchVendors } from "@/lib/api";
import { VetProductCard } from "@/components/vet-product-card";
import { SITE_NAME } from "@/lib/config";
import type { Vendor, Category } from "@/lib/types";

function TrustPillar({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 p-3 md:p-4">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <div className="font-bold text-sm text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
      </div>
    </div>
  );
}

function VendorCard({ vendor, index }: { vendor: Vendor; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.35 }}
    >
      <Link href={`/vendors/${vendor.slug}`}>
        <div className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border">
            {vendor.logoUrl ? (
              <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary/40">{vendor.name.charAt(0)}</span>
            )}
          </div>
          <div className="text-center">
            <div className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{vendor.name}</div>
            {vendor.description && (
              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{vendor.description}</div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const colors = [
    "bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground",
    "bg-secondary/10 text-secondary hover:bg-secondary hover:text-secondary-foreground",
    "bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground",
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={`/shop?category=${cat.slug}`}>
        <div className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer border border-transparent hover:border-current ${colors[index % 3]}`}>
          {cat.name}
        </div>
      </Link>
    </motion.div>
  );
}

export default function Home() {
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => fetchProducts({ sort: "newest" }),
    staleTime: 30_000,
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });
  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    staleTime: 60_000,
  });

  const approvedVendors = vendors.filter((v) => v.status === "approved").slice(0, 8);
  const featuredProducts = products.filter((p) => p.status === "active").slice(0, 8);

  return (
    <div className="min-h-screen">
      {/* Compact hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />
        <div className="relative container mx-auto px-4 py-8 md:py-10 flex flex-col items-center text-center gap-3">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-display text-2xl md:text-3xl font-extrabold text-white leading-tight max-w-2xl"
          >
            Shop trusted pet food, medicine & accessories
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-xl relative mt-1"
          >
            <input
              type="text"
              readOnly
              onFocus={() => (window.location.href = "/shop")}
              placeholder="Search for food, medicine, accessories..."
              className="w-full h-12 rounded-xl pl-11 pr-4 text-sm text-foreground bg-white shadow-sm border-0 focus:outline-none focus:ring-2 focus:ring-white/60 cursor-pointer"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.div>
        </div>
      </section>

      {/* Trust pillars - slim strip */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            <TrustPillar icon={<ShieldCheck className="w-5 h-5" />} title="Clinician Approved" desc="Vetted & licensed" />
            <TrustPillar icon={<Truck className="w-5 h-5" />} title="Fast Delivery" desc="To your door" />
            <TrustPillar icon={<Award className="w-5 h-5" />} title="Quality Assured" desc="Vet-grade products" />
            <TrustPillar icon={<Star className="w-5 h-5" />} title="Trusted Reviews" desc="Real pet owner feedback" />
          </div>
        </div>
      </section>

      {/* Browse by category */}
      {categories.length > 0 && (
        <section className="py-6 container mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Featured products - shown immediately, no long scroll */}
      {featuredProducts.length > 0 && (
        <section className="pb-14 bg-muted/40">
          <div className="container mx-auto px-4 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground">Popular Products</h2>
                <p className="text-muted-foreground text-sm mt-1">Top picks from our verified vendors</p>
              </div>
              <Link href="/shop">
                <Button variant="outline" className="hidden sm:flex rounded-xl">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product, i) => (
                <VetProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
            <div className="mt-8 flex justify-center sm:hidden">
              <Link href="/shop">
                <Button className="rounded-xl px-8">View All Products <ArrowRight className="w-4 h-4" /></Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Approved vendors */}
      {approvedVendors.length > 0 && (
        <section className="py-14 container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">Approved Vendor Stores</h2>
              <p className="text-muted-foreground text-sm mt-1">Licensed clinics, pharmacies, and pet stores</p>
            </div>
            <Link href="/vendors">
              <Button variant="outline" className="hidden sm:flex rounded-xl">
                All Vendors <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {approvedVendors.map((vendor, i) => (
              <VendorCard key={vendor.id} vendor={vendor} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-secondary/10 to-primary/10 border-t border-border">
        <div className="container mx-auto px-4 text-center flex flex-col items-center gap-4">
          <Package className="w-10 h-10 text-primary" />
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
            Are you a veterinary clinic or pet store?
          </h2>
          <p className="text-muted-foreground max-w-md">
            Join {SITE_NAME} as an approved vendor and reach thousands of pet owners seeking trusted products.
          </p>
          <Link href="/vendors/register">
            <Button size="lg" className="rounded-xl px-8 h-12 font-bold">
              Become a Vendor <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
