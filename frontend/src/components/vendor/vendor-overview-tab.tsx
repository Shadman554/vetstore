import { useQuery } from "@tanstack/react-query";
import { fetchVendorAnalytics } from "@/lib/api";
import { TrendingUp, DollarSign, Package, ShoppingCart, BarChart3, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-foreground leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function VendorOverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["vendor-analytics"],
    queryFn: fetchVendorAnalytics,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground mb-1">Sales Overview</h2>
        <p className="text-sm text-muted-foreground">Your store performance at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Gross Revenue"
          value={fmt(data.revenue)}
          sub="Total sales before commission"
          icon={DollarSign}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          label="Net Revenue"
          value={fmt(data.netRevenue)}
          sub="After platform commission"
          icon={TrendingUp}
          accent="bg-secondary/10 text-secondary"
        />
        <StatCard
          label="Commission Paid"
          value={fmt(data.commissionPaid)}
          sub="Platform fee deducted"
          icon={Minus}
          accent="bg-destructive/10 text-destructive"
        />
        <StatCard
          label="Units Sold"
          value={data.unitsSold.toLocaleString()}
          sub="Items dispatched"
          icon={ShoppingCart}
          accent="bg-accent/10 text-accent"
        />
        <StatCard
          label="Order Lines"
          value={data.orderLineCount.toLocaleString()}
          sub="Fulfilled line items"
          icon={BarChart3}
          accent="bg-primary/10 text-primary"
        />
        <StatCard
          label="Products"
          value={`${data.activeProducts} / ${data.totalProducts}`}
          sub="Active / Total listings"
          icon={Package}
          accent="bg-secondary/10 text-secondary"
        />
      </div>
    </div>
  );
}
