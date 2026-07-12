import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchVendorProducts,
  createVendorProduct,
  updateVendorProduct,
  deleteVendorProduct,
  fetchCategories,
} from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Pencil, Trash2, Loader2, Package, X, ToggleLeft, ToggleRight, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { MultiImageUpload } from "@/components/image-upload";
import type { Product, Species } from "@/lib/types";

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "farm", label: "Farm" },
  { value: "other", label: "Other" },
];

interface ProductFormState {
  name: string;
  description: string;
  ingredients: string;
  sku: string;
  barcode: string;
  brand: string;
  categoryId: string;
  species: Species | "";
  price: string;
  salePrice: string;
  stock: string;
  weight: string;
  expirationDate: string;
  images: string[];
  status: "active" | "inactive";
}

const emptyForm = (): ProductFormState => ({
  name: "", description: "", ingredients: "", sku: "", barcode: "", brand: "",
  categoryId: "", species: "", price: "", salePrice: "", stock: "",
  weight: "", expirationDate: "", images: [], status: "active",
});

function productToForm(p: Product): ProductFormState {
  return {
    name: p.name,
    description: p.description ?? "",
    ingredients: p.ingredients ?? "",
    sku: p.sku ?? "",
    barcode: p.barcode ?? "",
    brand: p.brand ?? "",
    categoryId: p.categoryId ?? "",
    species: p.species ?? "",
    price: String(p.price),
    salePrice: p.salePrice != null ? String(p.salePrice) : "",
    stock: String(p.stock),
    weight: p.weight ?? "",
    expirationDate: p.expirationDate ? p.expirationDate.slice(0, 10) : "",
    images: p.images ?? [],
    status: p.status,
  };
}

function formToPayload(f: ProductFormState) {
  return {
    name: f.name,
    description: f.description || null,
    ingredients: f.ingredients || null,
    sku: f.sku || null,
    barcode: f.barcode || null,
    brand: f.brand || null,
    categoryId: f.categoryId || null,
    species: (f.species as Species) || null,
    price: parseFloat(f.price),
    salePrice: f.salePrice ? parseFloat(f.salePrice) : null,
    stock: parseInt(f.stock, 10),
    weight: f.weight || null,
    expirationDate: f.expirationDate || null,
    images: f.images.length ? f.images : null,
    status: f.status,
  };
}

function ConfirmDelete({ onConfirm, onCancel, isPending }: { onConfirm: () => void; onCancel: () => void; isPending: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onCancel}
    >
      <div className="bg-card border border-card-border rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="font-bold text-foreground">Delete product?</p>
            <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" onClick={onConfirm} disabled={isPending} className="flex-1">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Delete
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">Cancel</Button>
        </div>
      </div>
    </motion.div>
  );
}

function ProductForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial: ProductFormState;
  onSave: (f: ProductFormState) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<ProductFormState>(initial);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  function set(name: keyof ProductFormState, value: string | string[]) {
    setForm((p) => ({ ...p, [name]: value }));
  }

  function field(name: keyof ProductFormState) {
    return {
      name,
      value: form[name] as string,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        set(name, e.target.value),
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Images */}
      <MultiImageUpload
        values={form.images}
        onChange={(vals) => set("images", vals)}
        label="Product images"
        productName={form.name}
        productCode={form.sku}
      />

      {/* Basic */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="p-name">Product name *</Label>
          <Input id="p-name" {...field("name")} required placeholder="e.g. Frontline Plus for Dogs" />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="p-desc">Description</Label>
          <Textarea id="p-desc" {...field("description")} placeholder="Product description..." className="min-h-[80px] resize-none" />
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="p-ing">Ingredients</Label>
          <Textarea id="p-ing" {...field("ingredients")} placeholder="Active ingredients, composition..." className="min-h-[60px] resize-none" />
        </div>
      </div>

      {/* Classification */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-brand">Brand</Label>
          <Input id="p-brand" {...field("brand")} placeholder="e.g. Bayer" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-sku">SKU</Label>
          <Input id="p-sku" {...field("sku")} placeholder="e.g. FL-DOG-1" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-barcode">Barcode</Label>
          <Input id="p-barcode" {...field("barcode")} placeholder="EAN / UPC" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-weight">Weight</Label>
          <Input id="p-weight" {...field("weight")} placeholder="e.g. 250g" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-cat">Category</Label>
          <select
            id="p-cat"
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select category</option>
            {(categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-species">Species</Label>
          <select
            id="p-species"
            value={form.species}
            onChange={(e) => set("species", e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select species</option>
            {SPECIES_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-price">Price ($) *</Label>
          <Input id="p-price" type="number" min="0" step="0.01" {...field("price")} required placeholder="0.00" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-sale">Sale price ($)</Label>
          <Input id="p-sale" type="number" min="0" step="0.01" {...field("salePrice")} placeholder="Optional" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-stock">Stock *</Label>
          <Input id="p-stock" type="number" min="0" {...field("stock")} required placeholder="0" />
        </div>
      </div>

      {/* Expiration & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="p-exp">Expiration date</Label>
          <Input id="p-exp" type="date" {...field("expirationDate")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-status">Status</Label>
          <select
            id="p-status"
            value={form.status}
            onChange={(e) => set("status", e.target.value as "active" | "inactive")}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Save product
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function ProductCard({ product, onEdit, onDelete, onToggle }: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const img = product.images?.[0];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="bg-card border border-card-border rounded-xl p-4 flex items-center gap-4"
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden border border-border shrink-0 bg-muted">
        {img ? (
          <img src={img} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <p className="font-semibold text-foreground text-sm leading-tight">{product.name}</p>
          <Badge variant={product.status === "active" ? "secondary" : "outline"} className="text-xs">
            {product.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
          <span className="font-semibold text-foreground">${product.price.toFixed(2)}</span>
          {product.salePrice != null && (
            <span className="text-secondary font-semibold">Sale: ${product.salePrice.toFixed(2)}</span>
          )}
          <span>Stock: {product.stock}</span>
          {product.brand && <span>{product.brand}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggle}
          className="text-muted-foreground hover:text-primary transition-colors p-1"
          title={product.status === "active" ? "Deactivate" : "Activate"}
        >
          {product.status === "active"
            ? <ToggleRight className="w-5 h-5 text-secondary" />
            : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="text-muted-foreground hover:text-primary transition-colors p-1"
          title="Edit product"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive transition-colors p-1"
          title="Delete product"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

export function VendorProductsTab() {
  const qc = useQueryClient();
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["vendor-products"],
    queryFn: fetchVendorProducts,
  });

  const { mutate: createProduct, isPending: creating } = useMutation({
    mutationFn: (f: ProductFormState) => createVendorProduct(formToPayload(f)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: "Product created" });
      setMode("list");
    },
    onError: (err: Error) =>
      toast({ title: "Failed to create product", description: err.message, variant: "destructive" }),
  });

  const { mutate: updateProduct, isPending: updating } = useMutation({
    mutationFn: (f: ProductFormState) => updateVendorProduct(editingProduct!.id, formToPayload(f)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: "Product updated" });
      setMode("list");
      setEditingProduct(null);
    },
    onError: (err: Error) =>
      toast({ title: "Failed to update product", description: err.message, variant: "destructive" }),
  });

  const { mutate: deleteProduct, isPending: deleting } = useMutation({
    mutationFn: deleteVendorProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor-products"] });
      toast({ title: "Product deleted" });
      setDeletingId(null);
    },
    onError: (err: Error) =>
      toast({ title: "Failed to delete product", description: err.message, variant: "destructive" }),
  });

  const { mutate: toggleStatus } = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "inactive" }) =>
      updateVendorProduct(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vendor-products"] }),
    onError: (err: Error) =>
      toast({ title: "Failed to update status", description: err.message, variant: "destructive" }),
  });

  function openEdit(p: Product) {
    setEditingProduct(p);
    setMode("edit");
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );
  }

  const isFormMode = mode === "create" || mode === "edit";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground mb-0.5">Products</h2>
          <p className="text-sm text-muted-foreground">{products?.length ?? 0} listings</p>
        </div>
        {!isFormMode && (
          <Button onClick={() => setMode("create")}>
            <Plus className="w-4 h-4" />
            Add product
          </Button>
        )}
        {isFormMode && (
          <Button variant="outline" onClick={() => { setMode("list"); setEditingProduct(null); }}>
            <X className="w-4 h-4" />
            Cancel
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {isFormMode && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-muted/40 border border-border rounded-xl p-5"
          >
            <h3 className="font-semibold text-foreground mb-4">
              {mode === "create" ? "New Product" : `Editing: ${editingProduct?.name}`}
            </h3>
            <ProductForm
              initial={mode === "create" ? emptyForm() : productToForm(editingProduct!)}
              onSave={(f) => mode === "create" ? createProduct(f) : updateProduct(f)}
              onCancel={() => { setMode("list"); setEditingProduct(null); }}
              isPending={creating || updating}
            />
          </motion.div>
        )}

        {!isFormMode && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {!products?.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Package className="w-10 h-10 text-muted-foreground mb-3" />
                <p className="font-semibold text-foreground">No products yet</p>
                <p className="text-sm text-muted-foreground mt-1">Add your first product to start selling.</p>
                <Button className="mt-4" onClick={() => setMode("create")}>
                  <Plus className="w-4 h-4" />
                  Add product
                </Button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {products.map((p) => (
                  <div key={p.id} className="mb-3">
                    <ProductCard
                      product={p}
                      onEdit={() => openEdit(p)}
                      onDelete={() => setDeletingId(p.id)}
                      onToggle={() => toggleStatus({ id: p.id, status: p.status === "active" ? "inactive" : "active" })}
                    />
                  </div>
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingId && (
          <ConfirmDelete
            onConfirm={() => deleteProduct(deletingId)}
            onCancel={() => setDeletingId(null)}
            isPending={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
