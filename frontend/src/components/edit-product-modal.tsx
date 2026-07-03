import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Product } from "@/lib/store";
import { updateProduct } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiImageUpload } from "@/components/image-upload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const AGE_RANGES = ["0-3", "3-5", "5+"] as const;

const formSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().regex(/^WAW-\d{3,}$/, "Format: WAW-001"),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  priceSingle: z.coerce.number().min(0.01).max(999_999_999),
  priceBulk: z.coerce.number().min(0).max(999_999_999),
  bulkMinQty: z.coerce.number().min(2).max(10_000).optional().or(z.literal(0)),
  currency: z.enum(["USD", "IQD"]),
  ageRange: z.enum(["0-3", "3-5", "5+"]).optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditProductModal({ product, isOpen, onClose, onSuccess }: EditProductModalProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      images: [],
      priceSingle: 0,
      priceBulk: 0,
      bulkMinQty: 0,
      currency: "USD",
      ageRange: undefined,
    },
  });

  const selectedCurrency = form.watch("currency");

  useEffect(() => {
    if (isOpen && product) {
      const existingImages =
        product.images && product.images.length > 0
          ? product.images
          : product.imageUrl
          ? [product.imageUrl]
          : [];
      form.reset({
        name: product.name,
        code: product.code,
        description: product.description || "",
        images: existingImages,
        priceSingle: product.priceSingle,
        priceBulk: product.priceBulk,
        bulkMinQty: product.bulkMinQty || 0,
        currency: product.currency ?? "USD",
        ageRange: product.ageRange ?? undefined,
      });
    }
  }, [isOpen, product, form]);

  const updateMutation = useMutation({
    mutationFn: (data: FormValues) =>
      updateProduct(product.id, {
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        images: data.images && data.images.length > 0 ? data.images : undefined,
        imageUrl: undefined,
        priceSingle: data.priceSingle,
        priceBulk: data.priceBulk,
        bulkMinQty: data.bulkMinQty || undefined,
        currency: data.currency,
        ageRange: data.ageRange ?? null,
      }),
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["products"] });
      onSuccess();
      onClose();
      toast({ title: t("toast.updated"), variant: "default" });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: FormValues) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{t("admin.editProduct")}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 overflow-y-auto flex-1 pr-1">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.name")}</FormLabel>
                  <FormControl>
                    <Input className="rounded-xl border-2" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input className="rounded-xl border-2 font-mono" placeholder="WAW-001" {...field} />
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
                  <FormLabel>{t("form.description")}</FormLabel>
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
                      label={t("form.imageUrl")}
                      productName={form.watch("name")}
                      productCode={product.code}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.currency")}</FormLabel>
                  <FormControl>
                    <div className="flex rounded-xl border-2 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => field.onChange("USD")}
                        className={`flex-1 py-2 text-sm font-bold transition-colors ${
                          field.value === "USD"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        $ USD
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("IQD")}
                        className={`flex-1 py-2 text-sm font-bold transition-colors border-l-2 ${
                          field.value === "IQD"
                            ? "bg-primary text-primary-foreground"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        IQD
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priceSingle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("form.priceSingle")} ({selectedCurrency === "IQD" ? "IQD" : "$"})
                    </FormLabel>
                    <FormControl>
                      <Input className="rounded-xl border-2" type="number" step={selectedCurrency === "IQD" ? "1" : "0.01"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceBulk"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("form.priceBulk")} ({selectedCurrency === "IQD" ? "IQD" : "$"})
                    </FormLabel>
                    <FormControl>
                      <Input className="rounded-xl border-2" type="number" step={selectedCurrency === "IQD" ? "1" : "0.01"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="bulkMinQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.bulkMinQty")}</FormLabel>
                  <FormControl>
                    <Input className="rounded-xl border-2" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ageRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("form.ageRange")}</FormLabel>
                  <FormControl>
                    <div className="flex rounded-xl border-2 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => field.onChange(null)}
                        className={`flex-1 py-2 text-xs font-bold transition-colors ${
                          !field.value ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {t("form.ageRange.any")}
                      </button>
                      {AGE_RANGES.map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => field.onChange(range)}
                          className={`flex-1 py-2 text-xs font-bold transition-colors border-l-2 ${
                            field.value === range ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          {t(`form.ageRange.${range}`)}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full rounded-xl font-bold mt-4"
              disabled={updateMutation.isPending}
              data-testid="btn-submit-edit"
            >
              {updateMutation.isPending ? t("form.saving") || "Saving…" : t("form.save")}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
