import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fetchProducts, fetchCategories, fetchVendors, type ProductFilters } from "@/lib/api";
import { VetProductCard } from "@/components/vet-product-card";
import type { Species } from "@/lib/types";

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "farm", label: "Farm" },
  { value: "other", label: "Other" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

export default function Shop() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [species, setSpecies] = useState("");
  const [brand, setBrand] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filters: ProductFilters = {
    q: search || undefined,
    category: category || undefined,
    species: species || undefined,
    brand: brand || undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort,
  };

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
    staleTime: 15_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 60_000,
  });

  const activeFilterCount = [category, species, brand, minPrice, maxPrice].filter(Boolean).length;

  const clearFilters = useCallback(() => {
    setCategory("");
    setSpecies("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl text-sm h-10"
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl flex items-center gap-2 shrink-0"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs ml-0.5 h-4 px-1.5">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </Button>
          <div className="hidden sm:block shrink-0">
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="rounded-xl w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border bg-muted/30"
          >
            <div className="container mx-auto px-4 py-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* Category */}
              <Select value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Species */}
              <Select value={species || "all"} onValueChange={(v) => setSpecies(v === "all" ? "" : v)}>
                <SelectTrigger className="rounded-xl text-sm">
                  <SelectValue placeholder="Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  {SPECIES_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Brand */}
              <Input
                placeholder="Brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="rounded-xl text-sm"
              />

              {/* Price range */}
              <Input
                placeholder="Min price"
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="rounded-xl text-sm"
              />
              <Input
                placeholder="Max price"
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="rounded-xl text-sm"
              />

              {/* Sort mobile */}
              <div className="sm:hidden col-span-2">
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="rounded-xl text-sm w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <X className="w-3.5 h-3.5" /> Clear filters
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              {search ? `Results for "${search}"` : "All Products"}
            </h1>
            {!isLoading && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {products.length} product{products.length !== 1 ? "s" : ""} found
              </p>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[3/1] sm:aspect-[3/4]" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">No products found</h2>
            <p className="text-muted-foreground max-w-sm">
              Try adjusting your search or filters to find what you are looking for.
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearFilters} className="rounded-xl mt-2">
                Clear all filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {products.map((product, i) => (
              <VetProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
