import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Truck, Award, Star, Package, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchProducts, fetchCategories, fetchVendors } from "@/lib/api";
import { VetProductCard } from "@/components/vet-product-card";
import { SITE_NAME } from "@/lib/config";
import type { Vendor, Category } from "@/lib/types";

const CATEGORY_ART: Record<string, { img: string; tint: string }> = {
  food: {
    img: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&q=80",
    tint: "from-orange-900/70",
  },
  medicine: {
    img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80",
    tint: "from-sky-900/70",
  },
  grooming: {
    img: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&q=80",
    tint: "from-pink-900/70",
  },
  accessories: {
    img: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&q=80",
    tint: "from-violet-900/70",
  },
  farm: {
    img: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&q=80",
    tint: "from-emerald-900/70",
  },
};
const FALLBACK_ART = { img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&q=80", tint: "from-neutral-900/70" };

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
        <div className="group flex flex-col rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center overflow-hidden border border-border shrink-0">
              {vendor.logoUrl ? (
                <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary/40">{vendor.name.charAt(0)}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{vendor.name}</div>
              <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-secondary">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" /> Open now
              </div>
            </div>
          </div>
          <div className="px-4 pb-4 flex items-center justify-between">
            <span className="text-xs text-muted-foreground line-clamp-1">{vendor.description || "Verified store"}</span>
            <span className="text-primary shrink-0"><ArrowRight className="w-3.5 h-3.5" /></span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function CategoryTile({ cat, index }: { cat: Category; index: number }) {
  const art = CATEGORY_ART[cat.slug] ?? FALLBACK_ART;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
    >
      <Link href={`/shop?category=${cat.slug}`}>
        <div className="group relative h-40 sm:h-48 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-lg transition-shadow">
          <img
            src={art.img}
            alt={cat.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className={`absolute inset-0 bg-gradient-to-t ${art.tint} via-black/10 to-transparent`} />
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            <h3 className="font-display font-bold text-lg text-white leading-tight drop-shadow-sm">{cat.name}</h3>
            <span className="self-start inline-flex items-center gap-1 bg-white text-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
              Shop now <ArrowRight className="w-3 h-3" />
            </span>
          </div>
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
      {/* Talabat-style search hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-orange-50/40 dark:from-primary/10 dark:to-transparent pb-10">
        <div className="absolute inset-0 opacity-[0.15]"
          style={{ backgroundImage: "radial-gradient(circle at 15% 20%, hsl(var(--primary)) 1px, transparent 1px), radial-gradient(circle at 85% 60%, hsl(var(--primary)) 1px, transparent 1px)", backgroundSize: "48px 48px" }}
        />
        <div className="relative container mx-auto px-4 pt-8 md:pt-12 flex flex-col items-center text-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="inline-block bg-primary text-primary-foreground font-display font-extrabold text-2xl md:text-3xl px-5 py-2 rounded-xl -rotate-1 shadow-sm"
          >
            {SITE_NAME}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight max-w-2xl"
          >
            Fast delivery of pet food, medicine & more
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-xl flex items-center gap-2 mt-1"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                readOnly
                onFocus={() => (window.location.href = "/shop")}
                placeholder="Search for food, medicine, toys..."
                className="w-full h-12 rounded-full pl-11 pr-4 text-sm text-foreground bg-white shadow-sm border-0 focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
              />
            </div>
            <Link href="/shop">
              <Button className="h-12 px-6 rounded-full font-bold shrink-0">Let's go</Button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"
          >
            <MapPin className="w-3.5 h-3.5 text-primary" /> Delivering to your area
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

      {/* Browse by category — Talabat-style tiles */}
      {categories.length > 0 && (
        <section className="py-8 container mx-auto px-4">
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat, i) => (
              <CategoryTile key={cat.id} cat={cat} index={i} />
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
                <Button variant="outline" className="hidden sm:flex rounded-full">
                  View All <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {featuredProducts.map((product, i) => (
                <VetProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
            <div className="mt-8 flex justify-center sm:hidden">
              <Link href="/shop">
                <Button className="rounded-full px-8">View All Products <ArrowRight className="w-4 h-4" /></Button>
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
              <Button variant="outline" className="hidden sm:flex rounded-full">
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
            <Button size="lg" className="rounded-full px-8 h-12 font-bold">
              Become a Vendor <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
