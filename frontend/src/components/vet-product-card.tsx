import { memo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { ShoppingCart, Heart, Star, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

interface VetProductCardProps {
  product: Product;
  index?: number;
}

export const VetProductCard = memo(function VetProductCard({ product, index = 0 }: VetProductCardProps) {
  const { addToCart } = useCart();
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);

  const img = product.images?.[0] ?? null;
  const hasDiscount = product.salePrice != null && product.salePrice < product.price;
  const displayPrice = product.salePrice ?? product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const inStock = product.stock > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.25), ease: "easeOut" }}
      className="h-full"
    >
      <Link href={`/product/${product.slug}`} className="block h-full">
        <div className="group h-full flex flex-col rounded-2xl border border-border bg-card shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
          {/* Image */}
          <div className="relative overflow-hidden bg-muted aspect-[4/3] shrink-0">
            {img && !imgError ? (
              <img
                src={img}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                <Package className="w-12 h-12" />
              </div>
            )}
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {hasDiscount && (
                <Badge className="bg-secondary text-secondary-foreground text-xs font-bold">
                  -{discountPct}%
                </Badge>
              )}
              {!inStock && (
                <Badge variant="outline" className="bg-card/90 text-xs font-semibold">
                  Out of stock
                </Badge>
              )}
            </div>
            {/* Rating */}
            {product.avgRating != null && product.avgRating > 0 && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-card/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold text-foreground">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {product.avgRating.toFixed(1)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col flex-1 p-4 gap-2">
            {(product.brand || product.vendorName) && (
              <div className="flex items-center gap-2">
                {product.brand && (
                  <span className="text-xs font-semibold text-primary uppercase tracking-wide">{product.brand}</span>
                )}
                {product.brand && product.vendorName && (
                  <span className="text-muted-foreground text-xs">·</span>
                )}
                {product.vendorName && (
                  <span className="text-xs text-muted-foreground truncate">{product.vendorName}</span>
                )}
              </div>
            )}
            <h3 className="font-semibold text-sm leading-snug line-clamp-2 text-foreground flex-1">
              {product.name}
            </h3>

            {/* Species tag */}
            {product.species && (
              <span className={cn(
                "self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                "bg-accent/10 text-accent"
              )}>
                {product.species}
              </span>
            )}

            {/* Price + Cart */}
            <div className="flex items-center justify-between gap-2 mt-auto pt-2">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-primary">
                  ${displayPrice.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-xs text-muted-foreground line-through">
                    ${product.price.toFixed(2)}
                  </span>
                )}
              </div>
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200",
                  "border border-primary-border",
                  added
                    ? "bg-secondary text-secondary-foreground"
                    : inStock
                    ? "bg-primary text-primary-foreground hover:opacity-90"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                aria-label="Add to cart"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                {added ? "Added" : "Add"}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
});
