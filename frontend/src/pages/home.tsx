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
    <div className="flex flex-col items-center text-center gap-3 p-6">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
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
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-accent">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />
        <div className="relative container mx-auto px-4 py-20 md:py-28 flex flex-col items-center text-center gap-6">
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="bg-white/20 text-white border-white/30 text-xs font-semibold mb-2">
              Trusted by veterinary professionals
            </Badge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-4xl md:text-6xl font-extrabold text-white leading-tight max-w-3xl"
          >
            The Veterinary Marketplace Built for Pet Health
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-white/80 text-lg md:text-xl max-w-xl"
          >
            Shop clinician-approved food, medicine, and accessories from licensed veterinary clinics, pet stores, and pharmacies — all in one place.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 mt-2"
          >
            <Link href="/shop">
              <Button size="lg" className="bg-white text-primary font-bold border-0 hover:bg-white/90 px-8 h-12 rounded-xl">
                Shop Now <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/vendors">
              <Button size="lg" variant="outline" className="border-white/40 text-white bg-white/10 font-bold px-8 h-12 rounded-xl hover:bg-white/20">
                Browse Vendors
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Trust pillars */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-border">
            <TrustPillar icon={<ShieldCheck className="w-6 h-6" />} title="Clinician Approved" desc="Every vendor is vetted & licensed" />
            <TrustPillar icon={<Truck className="w-6 h-6" />} title="Fast Delivery" desc="From local clinics to your door" />
            <TrustPillar icon={<Award className="w-6 h-6" />} title="Quality Assured" desc="Premium veterinary-grade products" />
            <TrustPillar icon={<Star className="w-6 h-6" />} title="Trusted Reviews" desc="Real feedback from pet owners" />
          </div>
        </div>
      </section>

      {/* Browse by category */}
      {categories.length > 0 && (
        <section className="py-14 container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-foreground">Browse by Category</h2>
            <Link href="/shop">
              <span className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                All products <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat, i) => (
              <CategoryCard key={cat.id} cat={cat} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featuredProducts.length > 0 && (
        <section className="py-14 bg-muted/40">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
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
