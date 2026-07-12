import { useState } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, ShoppingCart, Heart, Package, ChevronLeft, ChevronRight,
  Store, Tag, ShieldCheck, Minus, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchProduct, fetchReviews, submitReview, addToWishlist, removeFromWishlist, fetchWishlist } from "@/lib/api";
import { useCart } from "@/lib/cart";
import { isCustomerLoggedIn } from "@/lib/customer-auth";
import { VetProductCard } from "@/components/vet-product-card";
import { fetchProducts } from "@/lib/api";
import { cn } from "@/lib/utils";

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          onMouseEnter={() => onChange && setHover(n)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={cn(
              "w-5 h-5 transition-colors",
              n <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const [, params] = useRoute("/product/:slug");
  const slug = params?.slug ?? "";
  const [, navigate] = useLocation();
  const { addToCart } = useCart();
  const qc = useQueryClient();
  const loggedIn = isCustomerLoggedIn();

  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [wishlistToggling, setWishlistToggling] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: () => fetchReviews(product!.id),
    enabled: !!product?.id,
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: fetchWishlist,
    enabled: loggedIn,
  });

  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["products", { vendorId: product?.vendorId }],
    queryFn: () => fetchProducts({ vendorId: product!.vendorId }),
    enabled: !!product?.vendorId,
    select: (all) => all.filter((p) => p.id !== product?.id).slice(0, 4),
  });

  const isWishlisted = wishlist.some((p) => p.id === product?.id);

  const submitReviewMut = useMutation({
    mutationFn: () =>
      submitReview(product!.id, { rating, comment, customerName: reviewerName || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews", product?.id] });
      setReviewSubmitted(true);
      setComment("");
      setReviewerName("");
      setRating(5);
    },
  });

  const toggleWishlist = async () => {
    if (!loggedIn) { navigate("/account/login"); return; }
    setWishlistToggling(true);
    try {
      if (isWishlisted) {
        await removeFromWishlist(product!.id);
      } else {
        await addToWishlist(product!.id);
      }
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    } finally {
      setWishlistToggling(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, qty);
    setCartAdded(true);
    setTimeout(() => setCartAdded(false), 1800);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container mx-auto px-4 py-20 text-center flex flex-col items-center gap-4">
        <Package className="w-16 h-16 text-muted-foreground/30" />
        <h1 className="font-display text-2xl font-bold">Product not found</h1>
        <Link href="/shop"><Button className="rounded-xl">Back to Shop</Button></Link>
      </div>
    );
  }

  const images = product.images?.length ? product.images : [];
  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice != null && product.salePrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.price - product.salePrice!) / product.price) * 100)
    : 0;
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <Link href="/shop">
            <span className="flex items-center gap-1 hover:text-primary transition-colors font-medium cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Shop
            </span>
          </Link>
          <span>/</span>
          {product.vendorName && (
            <>
              <Link href={`/vendors/${product.vendorSlug}`}>
                <span className="hover:text-primary transition-colors cursor-pointer">{product.vendorName}</span>
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground font-medium line-clamp-1">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16 mb-16">
          {/* Images */}
          <div className="flex flex-col gap-3">
            <div className="relative rounded-2xl overflow-hidden bg-muted aspect-square border border-border">
              {images.length > 0 ? (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/20">
                  <Package className="w-24 h-24" />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImg((activeImg - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-md border border-border"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImg((activeImg + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/90 backdrop-blur-sm flex items-center justify-center shadow-md border border-border"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
              {hasDiscount && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-secondary text-secondary-foreground font-bold">
                    -{discountPct}% OFF
                  </Badge>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      "shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                      i === activeImg ? "border-primary" : "border-border opacity-60 hover:opacity-100"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="flex flex-col gap-5">
            {/* Vendor */}
            {product.vendorName && (
              <Link href={`/vendors/${product.vendorSlug}`}>
                <div className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline cursor-pointer w-fit">
                  <Store className="w-4 h-4" />
                  {product.vendorName}
                </div>
              </Link>
            )}

            {/* Name + badges */}
            <div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground leading-tight mb-3">
                {product.name}
              </h1>
              <div className="flex flex-wrap gap-2">
                {product.brand && (
                  <Badge variant="outline" className="font-semibold text-xs">
                    <Tag className="w-3 h-3 mr-1" /> {product.brand}
                  </Badge>
                )}
                {product.species && (
                  <Badge className="bg-accent/10 text-accent border-0 font-semibold text-xs capitalize">
                    {product.species}
                  </Badge>
                )}
                {inStock ? (
                  <Badge className="bg-secondary/10 text-secondary border-0 font-semibold text-xs">
                    <ShieldCheck className="w-3 h-3 mr-1" /> In Stock
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">Out of Stock</Badge>
                )}
              </div>
            </div>

            {/* Rating summary */}
            {product.avgRating != null && product.avgRating > 0 && (
              <div className="flex items-center gap-2">
                <StarRating value={Math.round(product.avgRating)} />
                <span className="text-sm font-semibold text-foreground">{product.avgRating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">({product.reviewCount ?? reviews.length} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="font-display text-4xl font-extrabold text-primary">
                ${displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-muted-foreground line-through font-medium">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground leading-relaxed text-base">
                {product.description}
              </p>
            )}

            {/* Qty + cart */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center font-bold text-sm">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                  disabled={!inStock}
                  className="w-10 h-10 flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button
                size="lg"
                disabled={!inStock}
                onClick={handleAddToCart}
                className={cn(
                  "flex-1 rounded-xl h-11 font-bold transition-all",
                  cartAdded && "bg-secondary border-secondary-border"
                )}
              >
                <ShoppingCart className="w-4 h-4" />
                {cartAdded ? "Added to Cart!" : "Add to Cart"}
              </Button>
              <button
                onClick={toggleWishlist}
                disabled={wishlistToggling}
                className={cn(
                  "w-11 h-11 rounded-xl border flex items-center justify-center transition-all",
                  isWishlisted
                    ? "bg-red-50 border-red-200 text-red-500"
                    : "border-border hover:border-primary hover:text-primary"
                )}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
              </button>
            </div>

            {/* Stock info */}
            {inStock && product.stock <= 10 && (
              <p className="text-sm text-amber-600 font-semibold">
                Only {product.stock} left in stock
              </p>
            )}

            {/* Vendor card mini */}
            {product.vendorName && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border mt-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {product.vendorLogoUrl ? (
                    <img src={product.vendorLogoUrl} alt={product.vendorName} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium">Sold by</p>
                  <p className="font-semibold text-sm text-foreground truncate">{product.vendorName}</p>
                </div>
                <Link href={`/vendors/${product.vendorSlug}`}>
                  <Button variant="outline" size="sm" className="rounded-lg shrink-0 text-xs">
                    View Store
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Ingredients */}
        {product.ingredients && (
          <div className="mb-12 p-6 rounded-2xl border border-border bg-card">
            <h2 className="font-display text-lg font-bold text-foreground mb-3">Ingredients</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">{product.ingredients}</p>
          </div>
        )}

        {/* Reviews */}
        <div className="mb-16">
          <h2 className="font-display text-2xl font-bold text-foreground mb-6">
            Customer Reviews
            {reviews.length > 0 && (
              <span className="text-muted-foreground font-normal text-lg ml-2">({reviews.length})</span>
            )}
          </h2>

          {reviews.length === 0 ? (
            <div className="py-10 text-center rounded-2xl bg-muted/30 border border-border">
              <Star className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-muted-foreground font-medium">No reviews yet. Be the first to review this product.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {reviews.map((review, i) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-5 rounded-2xl border border-border bg-card"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-sm text-foreground">{review.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <StarRating value={review.rating} />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground leading-relaxed mt-2">{review.comment}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Submit review */}
          <div className="p-6 rounded-2xl border border-border bg-card">
            <h3 className="font-display text-lg font-bold text-foreground mb-4">Write a Review</h3>
            {reviewSubmitted ? (
              <div className="text-center py-6">
                <ShieldCheck className="w-10 h-10 text-secondary mx-auto mb-2" />
                <p className="font-semibold text-foreground">Thank you for your review!</p>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); submitReviewMut.mutate(); }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Your Rating</label>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Your Name</label>
                  <input
                    className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 py-1 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                    placeholder="Your name (optional)"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground mb-1.5 block">Your Review</label>
                  <textarea
                    className="flex w-full rounded-xl border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm min-h-[100px] resize-y"
                    placeholder="Share your experience with this product..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={submitReviewMut.isPending}
                  className="rounded-xl w-fit px-8"
                >
                  {submitReviewMut.isPending ? "Submitting..." : "Submit Review"}
                </Button>
                {submitReviewMut.isError && (
                  <p className="text-sm text-destructive">
                    Failed to submit review. Please try again.
                  </p>
                )}
              </form>
            )}
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="border-t border-border pt-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">
              More from {product.vendorName ?? "this vendor"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p, i) => (
                <VetProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
