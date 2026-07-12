import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminVendors,
  updateVendorStatus,
  updateVendorCommission,
  fetchPlatformCommissionRate,
  updatePlatformCommissionRate,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  deleteAdminProduct,
  fetchAdminOrders,
  fetchAdminRevenue,
  fetchCategories,
  createCategory,
  deleteCategory,
  fetchSettings,
  updateWhatsAppNumber,
  type ProductInput,
} from "@/lib/api";
import type { Product, Vendor, OrderStatus, Species } from "@/lib/types";
import { useInactivityLogout } from "@/hooks/use-inactivity-logout";
import { useToast } from "@/hooks/use-toast";
import { SiteSettingsModal } from "@/components/site-settings-modal";
import { MultiImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DollarSign,
  Package,
  Store,
  Receipt,
  Settings2,
  Trash2,
  Edit2,
  Check,
  X,
  Plus,
  Phone,
} from "lucide-react";

const SPECIES_OPTIONS: Species[] = ["dog", "cat", "bird", "farm", "other"];

const productFormSchema = z.object({
  name: z.string().min(2, "Name is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  categoryId: z.string().optional(),
  species: z.enum(["dog", "cat", "bird", "farm", "other"]).optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  price: z.coerce.number().min(0.01),
  salePrice: z.coerce.number().optional().or(z.literal(0)),
  stock: z.coerce.number().min(0),
  status: z.enum(["active", "inactive"]),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

function ProductFormFields({
  form,
  vendors,
  categories,
}: {
  form: ReturnType<typeof useForm<ProductFormValues>>;
  vendors: Vendor[];
  categories: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product name</FormLabel>
            <FormControl>
              <Input className="rounded-xl border-2" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="vendorId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Vendor</FormLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger className="rounded-xl border-2 w-full">
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="rounded-xl border-2 w-full">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="species"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Species</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="rounded-xl border-2 w-full">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SPECIES_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="brand"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Brand</FormLabel>
            <FormControl>
              <Input className="rounded-xl border-2" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea className="rounded-xl border-2 resize-none" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="images"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <MultiImageUpload
                values={field.value ?? []}
                onChange={field.onChange}
                label="Images"
                productName={form.watch("name")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price ($)</FormLabel>
              <FormControl>
                <Input className="rounded-xl border-2" type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="salePrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sale price ($)</FormLabel>
              <FormControl>
                <Input className="rounded-xl border-2" type="number" step="0.01" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stock</FormLabel>
              <FormControl>
                <Input className="rounded-xl border-2" type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Status</FormLabel>
            <div className="flex rounded-xl border-2 overflow-hidden">
              {(["active", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => field.onChange(s)}
                  className={`flex-1 py-2 text-sm font-bold capitalize transition-colors border-l-2 first:border-l-0 ${
                    field.value === s ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </FormItem>
        )}
      />
    </div>
  );
}

function toFormValues(p?: Product | null): ProductFormValues {
  return {
    name: p?.name ?? "",
    vendorId: p?.vendorId ?? "",
    categoryId: p?.categoryId ?? undefined,
    species: p?.species ?? undefined,
    brand: p?.brand ?? "",
    description: p?.description ?? "",
    images: p?.images ?? [],
    price: p?.price ?? 0,
    salePrice: p?.salePrice ?? 0,
    stock: p?.stock ?? 0,
    status: p?.status ?? "active",
  };
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleInactivityLogout = useCallback(() => {
    toast({ title: "You were logged out due to inactivity", variant: "destructive" });
    setTimeout(() => window.location.reload(), 1200);
  }, [toast]);
  useInactivityLogout(handleInactivityLogout);

  const [showSettings, setShowSettings] = useState(false);
  const [whatsappInput, setWhatsappInput] = useState("");
  const [whatsappSaved, setWhatsappSaved] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [commissionInputs, setCommissionInputs] = useState<Record<string, string>>({});
  const [platformCommissionInput, setPlatformCommissionInput] = useState("");

  const { data: revenue } = useQuery({ queryKey: ["admin-revenue"], queryFn: fetchAdminRevenue });
  const { data: vendors = [] } = useQuery({ queryKey: ["admin-vendors"], queryFn: () => fetchAdminVendors() });
  const { data: products = [] } = useQuery({ queryKey: ["admin-products"], queryFn: fetchAdminProducts });
  const { data: orders = [] } = useQuery({ queryKey: ["admin-orders"], queryFn: fetchAdminOrders });
  const { data: categories = [] } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });
  const { data: platformCommission } = useQuery({ queryKey: ["platform-commission"], queryFn: fetchPlatformCommissionRate });
  const { data: settings } = useQuery({ queryKey: ["settings"], queryFn: fetchSettings, staleTime: 60_000 });

  const pendingVendors = useMemo(() => vendors.filter((v) => v.status === "pending"), [vendors]);
  const approvedVendors = useMemo(() => vendors.filter((v) => v.status === "approved"), [vendors]);

  const invalidateAdmin = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-revenue"] });
    queryClient.invalidateQueries({ queryKey: ["admin-vendors"] });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateVendorStatus(id, status),
    onSuccess: () => {
      invalidateAdmin();
      toast({ title: "Vendor status updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const commissionMutation = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number | null }) => updateVendorCommission(id, rate),
    onSuccess: () => {
      invalidateAdmin();
      toast({ title: "Commission override saved" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const platformCommissionMutation = useMutation({
    mutationFn: (rate: number) => updatePlatformCommissionRate(rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-commission"] });
      toast({ title: "Platform commission rate saved" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const createCategoryMutation = useMutation({
    mutationFn: (name: string) => createCategory(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewCategoryName("");
      toast({ title: "Category added" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "Category deleted", variant: "destructive" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const createProductMutation = useMutation({
    mutationFn: (data: ProductFormValues) =>
      createAdminProduct({
        ...data,
        salePrice: data.salePrice || undefined,
        categoryId: data.categoryId || undefined,
      } as Partial<ProductInput> & { vendorId: string }),
    onSuccess: () => {
      invalidateAdmin();
      setAddProductOpen(false);
      toast({ title: "Product added" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormValues }) =>
      updateAdminProduct(id, {
        ...data,
        salePrice: data.salePrice || undefined,
        categoryId: data.categoryId || undefined,
      }),
    onSuccess: () => {
      invalidateAdmin();
      setEditingProduct(null);
      toast({ title: "Product updated" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => deleteAdminProduct(id),
    onSuccess: () => {
      invalidateAdmin();
      toast({ title: "Product deleted", variant: "destructive" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const saveWhatsAppMutation = useMutation({
    mutationFn: updateWhatsAppNumber,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setWhatsappInput(data.whatsappNumber);
      setWhatsappSaved(true);
      setTimeout(() => setWhatsappSaved(false), 2000);
      toast({ title: "WhatsApp number saved" });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const addForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(),
  });

  const editForm = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: toFormValues(editingProduct),
  });

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    editForm.reset(toFormValues(p));
  };

  const handleSaveWhatsApp = () => {
    const cleaned = whatsappInput.replace(/\D/g, "");
    if (!cleaned) return;
    saveWhatsAppMutation.mutate(cleaned);
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-5xl font-black text-primary tracking-tight">Admin</h1>
          <p className="text-muted-foreground mt-1">Marketplace operations & vendor oversight</p>
        </div>
        <Button variant="outline" className="rounded-2xl border-2 font-bold flex items-center gap-2 shrink-0 mt-1" onClick={() => setShowSettings(true)}>
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">Site Settings</span>
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-3xl border-2 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary"><Receipt className="w-7 h-7" /></div>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Orders</div>
              <div className="text-2xl font-black">{revenue?.totalOrders ?? 0}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-2 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-secondary/10 rounded-2xl text-secondary"><DollarSign className="w-7 h-7" /></div>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Gross Sales</div>
              <div className="text-2xl font-black">${(revenue?.totalSales ?? 0).toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-2 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-accent/10 rounded-2xl text-accent"><DollarSign className="w-7 h-7" /></div>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Commission Earned</div>
              <div className="text-2xl font-black">${(revenue?.totalCommission ?? 0).toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-3xl border-2 shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-2xl text-primary"><Store className="w-7 h-7" /></div>
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase">Vendors</div>
              <div className="text-2xl font-black">{revenue?.vendors.approved ?? 0} <span className="text-sm text-muted-foreground font-semibold">/ {revenue?.vendors.pending ?? 0} pending</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {settings?.whatsappEnabled && (
        <Card className="rounded-3xl border-2 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-[#25D366]/10 rounded-2xl"><Phone className="w-6 h-6 text-[#25D366]" /></div>
              <div>
                <div className="font-bold text-base">WhatsApp Support Number</div>
                <div className="text-xs text-muted-foreground">Shown to customers for support inquiries</div>
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                className="rounded-xl border-2 font-mono text-base flex-1"
                placeholder="e.g. 9647501234567"
                value={whatsappInput}
                onChange={(e) => { setWhatsappInput(e.target.value); setWhatsappSaved(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleSaveWhatsApp()}
              />
              <Button onClick={handleSaveWhatsApp} className={`rounded-xl font-bold px-5 shrink-0 transition-colors ${whatsappSaved ? "bg-[#25D366] hover:bg-[#25D366]" : ""}`}>
                {whatsappSaved ? <Check className="w-4 h-4" /> : "Save"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="vendors" className="w-full">
        <TabsList className="rounded-2xl border-2 mb-6 h-auto flex-wrap">
          <TabsTrigger value="vendors" className="rounded-xl font-bold">Vendors</TabsTrigger>
          <TabsTrigger value="products" className="rounded-xl font-bold">Products</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-xl font-bold">Orders</TabsTrigger>
          <TabsTrigger value="categories" className="rounded-xl font-bold">Categories</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-xl font-bold">Commission</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-4">
          {pendingVendors.length > 0 && (
            <Card className="rounded-3xl border-2 shadow-sm border-amber-300">
              <CardHeader><CardTitle className="text-lg">Pending approval ({pendingVendors.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {pendingVendors.map((v) => (
                  <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border-2 bg-muted/30">
                    <div>
                      <div className="font-bold">{v.name}</div>
                      <div className="text-xs text-muted-foreground">{v.email} {v.phone ? `· ${v.phone}` : ""}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-xl font-bold" onClick={() => statusMutation.mutate({ id: v.id, status: "approved" })}>
                        <Check className="w-4 h-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl font-bold text-destructive" onClick={() => statusMutation.mutate({ id: v.id, status: "rejected" })}>
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-3xl border-2 shadow-sm">
            <CardHeader><CardTitle className="text-lg">All vendors</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {vendors.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border-2">
                  <div>
                    <div className="font-bold flex items-center gap-2">
                      {v.name}
                      <Badge variant={v.status === "approved" ? "default" : v.status === "pending" ? "secondary" : "destructive"} className="capitalize">{v.status}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{v.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="rounded-xl border-2 w-28 text-sm"
                      type="number"
                      placeholder={`default`}
                      value={commissionInputs[v.id] ?? (v.commissionRate != null ? String(v.commissionRate) : "")}
                      onChange={(e) => setCommissionInputs((s) => ({ ...s, [v.id]: e.target.value }))}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl font-bold"
                      onClick={() => {
                        const raw = commissionInputs[v.id];
                        commissionMutation.mutate({ id: v.id, rate: raw === "" || raw == null ? null : Number(raw) });
                      }}
                    >
                      Set %
                    </Button>
                    {v.status === "approved" ? (
                      <Button size="sm" variant="outline" className="rounded-xl font-bold text-destructive" onClick={() => statusMutation.mutate({ id: v.id, status: "rejected" })}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" className="rounded-xl font-bold" onClick={() => statusMutation.mutate({ id: v.id, status: "approved" })}>
                        Approve
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {vendors.length === 0 && <div className="text-center py-10 text-muted-foreground">No vendors yet.</div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-xl font-bold" onClick={() => addForm.reset(toFormValues())}>
                  <Plus className="w-4 h-4 mr-1" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[520px] rounded-3xl max-h-[90vh] flex flex-col">
                <DialogHeader><DialogTitle>Add product</DialogTitle></DialogHeader>
                <Form {...addForm}>
                  <form
                    onSubmit={addForm.handleSubmit((data) => createProductMutation.mutate(data))}
                    className="space-y-4 py-2 overflow-y-auto flex-1 pr-1"
                  >
                    <ProductFormFields form={addForm} vendors={approvedVendors} categories={categories} />
                    <Button type="submit" className="w-full rounded-xl font-bold" disabled={createProductMutation.isPending}>
                      {createProductMutation.isPending ? "Saving…" : "Create product"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {products.map((p) => (
              <Card key={p.id} className="rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col sm:flex-row">
                <div className="sm:w-40 h-40 sm:h-auto bg-muted shrink-0">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>
                  )}
                </div>
                <div className="p-5 flex-1 flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{p.name}</h3>
                      <div className="text-xs text-muted-foreground">{p.vendorName ?? "Unknown vendor"}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="outline" size="icon" className="rounded-xl" onClick={() => openEdit(p)}>
                        <Edit2 className="h-4 w-4 text-primary" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="icon" className="rounded-xl text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-3xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={() => deleteProductMutation.mutate(p.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={p.status === "active" ? "default" : "secondary"} className="capitalize">{p.status}</Badge>
                    {p.species && <Badge variant="outline" className="capitalize">{p.species}</Badge>}
                    <Badge variant="outline">Stock: {p.stock}</Badge>
                  </div>
                  <div className="flex items-baseline gap-2 mt-auto">
                    {p.salePrice ? (
                      <>
                        <span className="text-lg font-black text-primary">${p.salePrice.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground line-through">${p.price.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="text-lg font-black">${p.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {products.length === 0 && <div className="text-center py-16 text-muted-foreground">No products yet.</div>}
          </div>

          <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
            <DialogContent className="sm:max-w-[520px] rounded-3xl max-h-[90vh] flex flex-col">
              <DialogHeader><DialogTitle>Edit product</DialogTitle></DialogHeader>
              <Form {...editForm}>
                <form
                  onSubmit={editForm.handleSubmit((data) => editingProduct && updateProductMutation.mutate({ id: editingProduct.id, data }))}
                  className="space-y-4 py-2 overflow-y-auto flex-1 pr-1"
                >
                  <ProductFormFields form={editForm} vendors={approvedVendors} categories={categories} />
                  <Button type="submit" className="w-full rounded-xl font-bold" disabled={updateProductMutation.isPending}>
                    {updateProductMutation.isPending ? "Saving…" : "Save changes"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="orders" className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="rounded-2xl border-2 shadow-sm">
              <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-bold">{o.customerName} <span className="text-xs text-muted-foreground font-mono">#{o.id.slice(0, 8)}</span></div>
                  <div className="text-xs text-muted-foreground">{o.customerPhone} · {new Date(o.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className="capitalize" variant={o.status === "delivered" ? "default" : o.status === "cancelled" ? "destructive" : "secondary"}>{o.status}</Badge>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground uppercase font-bold">Total</div>
                    <div className="font-black text-lg">${o.total.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {orders.length === 0 && <div className="text-center py-16 text-muted-foreground">No orders yet.</div>}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="rounded-3xl border-2 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Add a category</CardTitle></CardHeader>
            <CardContent className="flex gap-3">
              <Input
                className="rounded-xl border-2 flex-1"
                placeholder="e.g. Dental Care"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && newCategoryName.trim() && createCategoryMutation.mutate(newCategoryName.trim())}
              />
              <Button
                className="rounded-xl font-bold"
                disabled={!newCategoryName.trim() || createCategoryMutation.isPending}
                onClick={() => createCategoryMutation.mutate(newCategoryName.trim())}
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </CardContent>
          </Card>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((c) => (
              <Card key={c.id} className="rounded-2xl border-2 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <span className="font-bold">{c.name}</span>
                  <Button variant="outline" size="icon" className="rounded-xl text-destructive" onClick={() => deleteCategoryMutation.mutate(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="rounded-3xl border-2 shadow-sm max-w-lg">
            <CardHeader><CardTitle className="text-lg">Default platform commission</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Applied to every sale unless a vendor has a commission override set in the Vendors tab. Current rate: <strong>{platformCommission ?? 0}%</strong>
              </p>
              <div className="flex gap-3">
                <Input
                  className="rounded-xl border-2 w-32"
                  type="number"
                  placeholder={String(platformCommission ?? 10)}
                  value={platformCommissionInput}
                  onChange={(e) => setPlatformCommissionInput(e.target.value)}
                />
                <Button
                  className="rounded-xl font-bold"
                  disabled={!platformCommissionInput || platformCommissionMutation.isPending}
                  onClick={() => platformCommissionMutation.mutate(Number(platformCommissionInput))}
                >
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <SiteSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
