import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchProducts } from "@/lib/api";
import { Product, formatPrice, AgeRange } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/product-card";
import { SkeletonCard } from "@/components/skeleton-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  PackageSearch,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { useSiteSettings } from "@/lib/use-site-settings";
import { textOnBg, colorForText } from "@/lib/site-settings";
import { useDebounce } from "@/hooks/use-debounce";
import { motion, AnimatePresence } from "framer-motion";

const ITEMS_PER_PAGE = 8;

type SortOption =
  | "relevant"
  | "priceAsc"
  | "priceDesc"
  | "nameAsc"
  | "nameDesc"
  | "newest";

type CurrencyFilter = "all" | "USD" | "IQD";

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "");
}

function scoreProduct(product: Product, queryTokens: string[]): number {
  if (queryTokens.length === 0) return 1;
  let score = 0;
  const name = normalizeText(product.name);
  const desc = normalizeText(product.description ?? "");
  for (const token of queryTokens) {
    if (token.length < 2) continue;
    if (name === token) score += 10;
    else if (name.startsWith(token)) score += 6;
    else if (name.includes(token)) score += 4;
    else if (desc.includes(token)) score += 2;
    else {
      const nameParts = name.split(/\s+/);
      const descParts = desc.split(/\s+/);
      const fuzzyMatch = [...nameParts, ...descParts].some(
        (w) =>
          (token.length >= 3 && w.includes(token.slice(0, -1))) ||
          (w.length >= 3 && token.includes(w.slice(0, -1)))
      );
      if (fuzzyMatch) score += 1;
    }
  }
  return score;
}

function matchesQuery(product: Product, queryTokens: string[]): boolean {
  if (queryTokens.length === 0) return true;
  const name = normalizeText(product.name);
  const desc = normalizeText(product.description ?? "");
  return queryTokens.every((token) => {
    if (token.length < 2) return true;
    if (name.includes(token) || desc.includes(token)) return true;
    const allWords = [...name.split(/\s+/), ...desc.split(/\s+/)];
    return allWords.some(
      (w) =>
        (token.length >= 3 && w.includes(token.slice(0, -1))) ||
        (w.length >= 3 && token.includes(w.slice(0, -1)))
    );
  });
}

export default function Catalog() {
  const { t, isRtl, lang } = useI18n();
  const { settings } = useSiteSettings();
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("relevant");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>("all");
  const [ageRangeFilter, setAgeRangeFilter] = useState<AgeRange | "all">("all");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(search, 200);

  const allPrices = useMemo(
    () => products.map((p) => p.priceSingle),
    [products]
  );
  const globalMin = Math.floor(Math.min(...allPrices, 0));
  const globalMax = Math.ceil(Math.max(...allPrices, 0));

  const sortLocale = lang === "AR" ? "ar" : lang === "KU" ? "ckb" : "en";

  const queryTokens = useMemo(
    () =>
      normalizeText(debouncedSearch)
        .split(/\s+/)
        .filter((t) => t.length >= 1),
    [debouncedSearch]
  );

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      if (!matchesQuery(p, queryTokens)) return false;
      if (currencyFilter !== "all" && p.currency !== currencyFilter)
        return false;
      if (ageRangeFilter !== "all" && (p.ageRange ?? null) !== ageRangeFilter) return false;
      const min = minPrice !== "" ? parseFloat(minPrice) : null;
      const max = maxPrice !== "" ? parseFloat(maxPrice) : null;
      if (min !== null && !isNaN(min) && p.priceSingle < min) return false;
      if (max !== null && !isNaN(max) && p.priceSingle > max) return false;
      return true;
    });

    if (sortBy === "relevant" && queryTokens.length > 0) {
      result = result
        .map((p) => ({ p, score: scoreProduct(p, queryTokens) }))
        .sort((a, b) => b.score - a.score)
        .map(({ p }) => p);
    } else if (sortBy === "priceAsc") {
      result = [...result].sort((a, b) => a.priceSingle - b.priceSingle);
    } else if (sortBy === "priceDesc") {
      result = [...result].sort((a, b) => b.priceSingle - a.priceSingle);
    } else if (sortBy === "nameAsc") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, sortLocale));
    } else if (sortBy === "nameDesc") {
      result = [...result].sort((a, b) => b.name.localeCompare(a.name, sortLocale));
    } else if (sortBy === "newest") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [products, queryTokens, sortBy, minPrice, maxPrice, currencyFilter, ageRangeFilter, sortLocale]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy, minPrice, maxPrice, currencyFilter, ageRangeFilter]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(e.target as Node)
      ) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasActiveFilters =
    sortBy !== "relevant" ||
    minPrice !== "" ||
    maxPrice !== "" ||
    currencyFilter !== "all" ||
    ageRangeFilter !== "all";

  const activeFilterCount = [
    sortBy !== "relevant",
    minPrice !== "",
    maxPrice !== "",
    currencyFilter !== "all",
    ageRangeFilter !== "all",
  ].filter(Boolean).length;

  function clearAllFilters() {
    setSortBy("relevant");
    setMinPrice("");
    setMaxPrice("");
    setCurrencyFilter("all");
    setAgeRangeFilter("all");
  }

  const sortOptions: { key: SortOption; label: string }[] = [
    { key: "relevant", label: t("catalog.sort.relevant") },
    { key: "priceAsc", label: t("catalog.sort.priceAsc") },
    { key: "priceDesc", label: t("catalog.sort.priceDesc") },
    { key: "nameAsc", label: t("catalog.sort.nameAsc") },
    { key: "nameDesc", label: t("catalog.sort.nameDesc") },
    { key: "newest", label: t("catalog.sort.newest") },
  ];

  const heroGradient = `linear-gradient(135deg, ${settings.color1} 0%, ${settings.color3} 55%, ${settings.color2} 100%)`;
  const pageBadgeText = textOnBg(settings.color1);
  const accentText = colorForText(settings.color3);

  const filterPanel = (
    <AnimatePresence>
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="bg-white dark:bg-card border border-border rounded-2xl p-4 mt-3 shadow-md grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("catalog.sortBy")}
              </p>
              <div className="flex flex-col gap-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setSortBy(opt.key)}
                    className={`text-sm text-start px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      sortBy === opt.key
                        ? "text-white"
                        : "text-foreground hover:bg-muted"
                    }`}
                    style={
                      sortBy === opt.key
                        ? { background: settings.color3, color: textOnBg(settings.color3) }
                        : {}
                    }
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("catalog.priceRange")}
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  placeholder={t("catalog.minPrice")}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="h-9 rounded-xl text-sm"
                />
                <span className="text-muted-foreground font-bold">—</span>
                <Input
                  type="number"
                  min={0}
                  placeholder={t("catalog.maxPrice")}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="h-9 rounded-xl text-sm"
                />
              </div>
              {(globalMin !== Infinity || globalMax !== -Infinity) && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {formatPrice(globalMin, "USD")} – {formatPrice(globalMax, "USD")}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("catalog.currency")}
              </p>
              <div className="flex gap-2 flex-wrap">
                {(["all", "USD", "IQD"] as CurrencyFilter[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrencyFilter(c)}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      currencyFilter === c
                        ? "border-transparent"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                    style={
                      currencyFilter === c
                        ? {
                            background: settings.color2,
                            color: textOnBg(settings.color2),
                            borderColor: settings.color2,
                          }
                        : {}
                    }
                  >
                    {c === "all" ? t("catalog.allCurrencies") : c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {t("catalog.ageRange")}
              </p>
              <div className="flex gap-2 flex-wrap">
                {(["all", "0-3", "3-5", "5+"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAgeRangeFilter(r as AgeRange | "all")}
                    className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      ageRangeFilter === r
                        ? "border-transparent"
                        : "border-border bg-background hover:bg-muted"
                    }`}
                    style={
                      ageRangeFilter === r
                        ? {
                            background: settings.color3,
                            color: textOnBg(settings.color3),
                            borderColor: settings.color3,
                          }
                        : {}
                    }
                  >
                    {r === "all" ? t("form.ageRange.any") : t(`catalog.ageRange.${r}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const activeChips = (
    <AnimatePresence>
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="flex flex-wrap items-center gap-2 mt-2"
        >
          {sortBy !== "relevant" && (
            <Chip
              label={sortOptions.find((s) => s.key === sortBy)!.label}
              onRemove={() => setSortBy("relevant")}
              color={settings.color3}
            />
          )}
          {minPrice !== "" && (
            <Chip
              label={`≥ ${formatPrice(parseFloat(minPrice) || 0, "USD")}`}
              onRemove={() => setMinPrice("")}
              color={settings.color1}
            />
          )}
          {maxPrice !== "" && (
            <Chip
              label={`≤ ${formatPrice(parseFloat(maxPrice) || 0, "USD")}`}
              onRemove={() => setMaxPrice("")}
              color={settings.color1}
            />
          )}
          {currencyFilter !== "all" && (
            <Chip
              label={currencyFilter}
              onRemove={() => setCurrencyFilter("all")}
              color={settings.color2}
            />
          )}
          {ageRangeFilter !== "all" && (
            <Chip
              label={t(`catalog.ageRange.${ageRangeFilter}`)}
              onRemove={() => setAgeRangeFilter("all")}
              color={settings.color3}
            />
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            {t("catalog.clearFilters")}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div>
      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden">
        <div
          className="relative overflow-hidden px-5 pt-5 pb-6"
          style={{ background: heroGradient }}
        >
          <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" />
          <div className={`relative z-10 ${isRtl ? "text-right" : "text-left"}`}>
            <p className="font-display text-xl font-bold text-white leading-snug drop-shadow-sm">
              {t("catalog.tagline1")}
            </p>
            <p className="font-sans text-sm text-white/85 mt-1 font-medium leading-relaxed">
              {t("catalog.tagline2")}
            </p>
          </div>
        </div>

        <div className="px-4 -mt-4 relative z-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div
                className={`absolute inset-y-0 ${isRtl ? "right-0 pr-4" : "left-0 pl-4"} flex items-center pointer-events-none`}
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="search"
                className={`${isRtl ? "pr-11 pl-4" : "pl-11 pr-4"} h-12 rounded-2xl border-2 bg-white dark:bg-card shadow-lg font-sans text-sm`}
                placeholder={t("catalog.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="mobile-input-search"
              />
              {search && (
                <button
                  className={`absolute inset-y-0 ${isRtl ? "left-0 pl-3" : "right-0 pr-3"} flex items-center`}
                  onClick={() => setSearch("")}
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters((v) => !v)}
              className="relative h-12 w-12 shrink-0 rounded-2xl bg-white dark:bg-card shadow-lg border-2 flex items-center justify-center transition-colors"
              style={
                showFilters || hasActiveFilters
                  ? { borderColor: settings.color3, background: settings.color3 }
                  : { borderColor: "transparent" }
              }
            >
              <SlidersHorizontal
                className="h-5 w-5"
                style={
                  showFilters || hasActiveFilters
                    ? { color: textOnBg(settings.color3) }
                    : { color: settings.color3 }
                }
              />
              {activeFilterCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
                  style={{
                    background: settings.color1,
                    color: textOnBg(settings.color1),
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {filterPanel}
          {activeChips}
        </div>

        <div className="px-4 pt-4 pb-2">
          {filteredProducts.length > 0 && (
            <p className="text-xs font-semibold text-muted-foreground">
              {t("catalog.results", { count: filteredProducts.length })}
            </p>
          )}
        </div>

        <div className="px-4 pb-4">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div
                className="p-5 rounded-full mb-4"
                style={{ background: `${settings.color1}22` }}
              >
                <PackageSearch
                  className="h-10 w-10"
                  style={{ color: settings.color1 }}
                />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">
                {t("catalog.noResults")}
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-3 text-sm font-bold underline underline-offset-2"
                  style={{ color: accentText }}
                >
                  {t("catalog.clearFilters")}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {paginatedProducts.map((product, index) => (
                  <div key={product.id} className="min-h-[220px]">
                    <ProductCard product={product} index={index} />
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <Button
                    variant="outline"
                    className="rounded-full w-11 h-11 p-0 border-2"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="mobile-btn-prev-page"
                  >
                    {isRtl ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </Button>
                  <div
                    className="font-display font-bold text-sm px-4 py-2 rounded-full shadow-sm"
                    style={{ background: settings.color1, color: pageBadgeText }}
                  >
                    {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full w-11 h-11 p-0 border-2"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    data-testid="mobile-btn-next-page"
                  >
                    {isRtl ? (
                      <ChevronLeft className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:block">
        <div className="relative overflow-hidden bg-white dark:bg-card border-b-2 border-border">
          <div
            className={`absolute top-0 w-2 h-full ${isRtl ? "right-0" : "left-0"}`}
            style={{ background: settings.color3 }}
          />
          <div
            className={`absolute top-0 w-2 h-full ${isRtl ? "right-2" : "left-2"}`}
            style={{ background: settings.color2 }}
          />
          <div
            className={`absolute top-0 w-2 h-full ${isRtl ? "right-4" : "left-4"}`}
            style={{ background: settings.color1 }}
          />
          <div className="container mx-auto px-6 py-8 md:py-10 ps-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p
                  className="font-display text-lg md:text-2xl font-semibold leading-snug"
                  style={{ color: settings.color3 }}
                >
                  {t("catalog.tagline1")}
                </p>
                <p className="font-sans text-sm md:text-base text-muted-foreground mt-1 font-medium">
                  {t("catalog.tagline2")}
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-96">
                  <div
                    className={`absolute inset-y-0 ${isRtl ? "right-0 pr-4" : "left-0 pl-4"} flex items-center pointer-events-none`}
                  >
                    <Search className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    type="search"
                    className={`${isRtl ? "pr-12 pl-10" : "pl-12 pr-10"} h-12 rounded-2xl border-2 bg-background font-sans`}
                    placeholder={t("catalog.search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    data-testid="input-search"
                  />
                  {search && (
                    <button
                      className={`absolute inset-y-0 ${isRtl ? "left-0 pl-3" : "right-0 pr-3"} flex items-center`}
                      onClick={() => setSearch("")}
                    >
                      <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="relative h-12 px-4 rounded-2xl border-2 flex items-center gap-2 font-bold text-sm transition-all"
                  style={
                    showFilters || hasActiveFilters
                      ? {
                          background: settings.color3,
                          borderColor: settings.color3,
                          color: textOnBg(settings.color3),
                        }
                      : {
                          borderColor: "var(--border)",
                          background: "var(--background)",
                          color: "var(--foreground)",
                        }
                  }
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  {t("catalog.filters")}
                  {activeFilterCount > 0 && (
                    <span
                      className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
                      style={{
                        background: settings.color1,
                        color: textOnBg(settings.color1),
                      }}
                    >
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => setShowSortMenu((v) => !v)}
                    className="relative h-12 px-4 rounded-2xl border-2 border-border flex items-center gap-2 font-bold text-sm bg-background hover:bg-muted transition-all"
                  >
                    <ArrowUpDown className="h-4 w-4" style={{ color: settings.color2 }} />
                    <span className="hidden lg:inline">{sortOptions.find((s) => s.key === sortBy)?.label}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <AnimatePresence>
                    {showSortMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className={`absolute top-14 ${isRtl ? "left-0" : "right-0"} z-50 bg-white dark:bg-card border border-border rounded-2xl shadow-xl py-2 min-w-[200px]`}
                      >
                        {sortOptions.map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => {
                              setSortBy(opt.key);
                              setShowSortMenu(false);
                            }}
                            className={`w-full text-start px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted ${
                              sortBy === opt.key ? "font-bold" : ""
                            }`}
                            style={
                              sortBy === opt.key
                                ? { color: colorForText(settings.color3) }
                                : {}
                            }
                          >
                            {opt.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {filterPanel}
            {activeChips}
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 md:py-8">
          {filteredProducts.length > 0 && (
            <p className="text-sm font-semibold text-muted-foreground mb-4">
              {debouncedSearch || hasActiveFilters
                ? t("catalog.showing", {
                    count: filteredProducts.length,
                    total: products.length,
                  })
                : t("catalog.results", { count: filteredProducts.length })}
            </p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center bg-white dark:bg-card rounded-3xl border-2 border-dashed border-border">
              <div
                className="p-5 rounded-full mb-4"
                style={{ background: `${settings.color1}22` }}
              >
                <PackageSearch
                  className="h-12 w-12"
                  style={{ color: settings.color1 }}
                />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                {t("catalog.noResults")}
              </h2>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="mt-4 text-sm font-bold underline underline-offset-2"
                  style={{ color: accentText }}
                >
                  {t("catalog.clearFilters")}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {paginatedProducts.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-12">
                  <Button
                    variant="outline"
                    className="rounded-full w-12 h-12 p-0 border-2 font-bold"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    data-testid="btn-prev-page"
                  >
                    {isRtl ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      <ChevronLeft className="h-5 w-5" />
                    )}
                  </Button>
                  <div
                    className="font-display font-bold text-base px-5 py-2 rounded-full shadow-sm"
                    style={{ background: settings.color1, color: pageBadgeText }}
                  >
                    {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-full w-12 h-12 p-0 border-2 font-bold"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    data-testid="btn-next-page"
                  >
                    {isRtl ? (
                      <ChevronLeft className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({
  label,
  onRemove,
  color,
}: {
  label: string;
  onRemove: () => void;
  color: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: `${color}22`, color: colorForText(color) }}
    >
      {label}
      <button
        onClick={onRemove}
        className="opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );
}
