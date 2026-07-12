import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User, Mail, Phone, ShoppingBag, LogOut, LogIn, UserPlus,
  Package, Clock, ChevronDown, ChevronRight, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  registerCustomer, loginCustomer, fetchCustomerMe, fetchCustomerOrders,
} from "@/lib/api";
import { saveCustomerSession, clearCustomerSession, isCustomerLoggedIn } from "@/lib/customer-auth";
import type { OrderStatus } from "@/lib/types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const loginMut = useMutation({
    mutationFn: () => loginCustomer(email.trim(), password),
    onSuccess: (data) => { saveCustomerSession(data.token); onSuccess(); },
    onError: (e: Error) => setError(e.message),
  });

  const registerMut = useMutation({
    mutationFn: () => registerCustomer({ name: name.trim(), email: email.trim(), password, phone: phone.trim() || undefined }),
    onSuccess: (data) => { saveCustomerSession(data.token); onSuccess(); },
    onError: (e: Error) => setError(e.message),
  });

  const isPending = loginMut.isPending || registerMut.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "login") loginMut.mutate();
    else registerMut.mutate();
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
          <User className="w-7 h-7 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-black">
          {mode === "login" ? "Sign in to your account" : "Create an account"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {mode === "login" ? "Track your orders and manage preferences." : "Join VetMarket to start shopping."}
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "register" && (
            <Field label="Full Name">
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl"
                required
              />
            </Field>
          )}
          <Field label="Email">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl pl-9"
                required
              />
            </div>
          </Field>
          {mode === "register" && (
            <Field label="Phone (optional)">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="rounded-xl pl-9"
                />
              </div>
            </Field>
          )}
          <Field label="Password">
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl"
              required
              minLength={6}
            />
          </Field>

          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive font-semibold">
              {error}
            </div>
          )}

          <Button type="submit" className="rounded-xl h-11 font-bold" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : mode === "login" ? <LogIn className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div className="mt-4 pt-4 border-t border-border text-center text-sm text-muted-foreground">
          {mode === "login" ? (
            <>Don't have an account?{" "}
              <button type="button" className="text-primary font-semibold hover:underline" onClick={() => { setMode("register"); setError(""); }}>
                Sign up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button type="button" className="text-primary font-semibold hover:underline" onClick={() => { setMode("login"); setError(""); }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order }: { order: { id: string; status: OrderStatus; total: number; createdAt: string; items?: { productName: string; quantity: number; lineTotal: number }[] } }) {
  const [expanded, setExpanded] = useState(false);
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-foreground">Order #{order.id.slice(-6).toUpperCase()}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {new Date(order.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-bold text-foreground">{fmt(order.total)}</span>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>
      {expanded && order.items && order.items.length > 0 && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-1.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-foreground">{item.productName} <span className="text-muted-foreground">×{item.quantity}</span></span>
              <span className="font-semibold">{fmt(item.lineTotal)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AccountPanel() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();

  const { data: customer, isLoading: loadingCustomer } = useQuery({
    queryKey: ["customer-me"],
    queryFn: fetchCustomerMe,
    retry: false,
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["customer-orders"],
    queryFn: fetchCustomerOrders,
    retry: false,
  });

  function handleLogout() {
    clearCustomerSession();
    qc.removeQueries({ queryKey: ["customer-me"] });
    qc.removeQueries({ queryKey: ["customer-orders"] });
    navigate("/");
  }

  if (loadingCustomer) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-foreground">{customer?.name}</h2>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="w-3.5 h-3.5" /> {customer?.email}
              </div>
              {customer?.phone && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" /> {customer.phone}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive shrink-0 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-1.5" /> Sign out
          </Button>
        </div>
      </div>

      {/* Orders */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="w-5 h-5 text-foreground" />
          <h3 className="font-bold text-lg text-foreground">My Orders</h3>
          {orders.length > 0 && (
            <Badge variant="secondary" className="ml-1">{orders.length}</Badge>
          )}
        </div>

        {loadingOrders ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center bg-card border border-border rounded-2xl">
            <Package className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="font-semibold text-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Your order history will appear here.</p>
            <Button onClick={() => navigate("/shop")} className="rounded-xl font-bold">
              Start Shopping
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <OrderRow key={o.id} order={o as Parameters<typeof OrderRow>[0]["order"]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Account() {
  const qc = useQueryClient();
  const [loggedIn, setLoggedIn] = useState(isCustomerLoggedIn());

  function handleLoginSuccess() {
    qc.invalidateQueries({ queryKey: ["customer-me"] });
    qc.invalidateQueries({ queryKey: ["customer-orders"] });
    setLoggedIn(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-10">
        {loggedIn ? <AccountPanel /> : <LoginForm onSuccess={handleLoginSuccess} />}
      </div>
    </div>
  );
}
