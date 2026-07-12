import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Store, ArrowRight, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetchVendors } from "@/lib/api";

export default function Vendors() {
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: fetchVendors,
    staleTime: 60_000,
  });

  const approved = vendors.filter((v) => v.status === "approved");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> All vendors are verified
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Approved Vendor Directory
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Shop from licensed veterinary clinics, certified pharmacies, and trusted pet stores — all vetted by our team.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse h-44" />
            ))}
          </div>
        ) : approved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <Store className="w-14 h-14 text-muted-foreground/30" />
            <h2 className="font-display text-xl font-bold text-foreground">No vendors yet</h2>
            <p className="text-muted-foreground">Check back soon — new stores are joining regularly.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6 font-medium">
              {approved.length} approved vendor{approved.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {approved.map((vendor, i) => (
                <motion.div
                  key={vendor.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.35 }}
                >
                  <Link href={`/vendors/${vendor.slug}`}>
                    <div className="group flex flex-col rounded-2xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden cursor-pointer">
                      {/* Banner */}
                      <div className="relative h-24 bg-gradient-to-br from-primary/20 to-secondary/20 overflow-hidden">
                        {vendor.bannerUrl ? (
                          <img src={vendor.bannerUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: "radial-gradient(circle, #0B6FB8 1px, transparent 1px)", backgroundSize: "20px 20px" }}
                          />
                        )}
                        {/* Logo */}
                        <div className="absolute bottom-0 left-4 translate-y-1/2 w-12 h-12 rounded-xl border-2 border-card bg-card shadow-sm overflow-hidden flex items-center justify-center">
                          {vendor.logoUrl ? (
                            <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-lg text-primary">{vendor.name.charAt(0)}</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-8 px-4 pb-4 flex flex-col gap-1.5 flex-1">
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                          {vendor.name}
                        </h3>
                        {vendor.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {vendor.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-auto pt-2 text-primary text-xs font-semibold">
                          View Store <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
