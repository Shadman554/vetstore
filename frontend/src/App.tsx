import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { I18nProvider } from "@/lib/i18n";
import { SiteSettingsProvider } from "@/lib/site-settings-context";
import { CartProvider } from "@/lib/cart";
import { Navbar } from "@/components/navbar";
import { MobileHeader } from "@/components/mobile-header";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { AdminPinGate } from "@/components/admin-pin-gate";

const Home = lazy(() => import("@/pages/home"));
const Shop = lazy(() => import("@/pages/shop"));
const Catalog = lazy(() => import("@/pages/catalog"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const Vendors = lazy(() => import("@/pages/vendors"));
const VendorStorefront = lazy(() => import("@/pages/vendor-storefront"));
const Cart = lazy(() => import("@/pages/cart"));
const Checkout = lazy(() => import("@/pages/checkout"));
const VendorLogin = lazy(() => import("@/pages/vendor-login"));
const VendorRegister = lazy(() => import("@/pages/vendor-register"));
const VendorDashboard = lazy(() => import("@/pages/vendor-dashboard"));
const Admin = lazy(() => import("@/pages/admin"));
const OrderConfirmation = lazy(() => import("@/pages/order-confirmation"));
const NotFound = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      gcTime: 1000 * 60 * 30,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex gap-2">
        <span className="w-3 h-3 rounded-full bg-[--brand-1] animate-bounce [animation-delay:0ms]" />
        <span className="w-3 h-3 rounded-full bg-[--brand-2] animate-bounce [animation-delay:150ms]" />
        <span className="w-3 h-3 rounded-full bg-[--brand-3] animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/shop" component={Shop} />
        <Route path="/catalog" component={Catalog} />
        <Route path="/product/:slug" component={ProductDetail} />
        <Route path="/vendors" component={Vendors} />
        <Route path="/vendors/register" component={VendorRegister} />
        <Route path="/vendors/login" component={VendorLogin} />
        <Route path="/vendors/dashboard" component={VendorDashboard} />
        <Route path="/vendors/:slug" component={VendorStorefront} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order/:id" component={OrderConfirmation} />
        <Route path="/admin">
          <AdminPinGate><Admin /></AdminPinGate>
        </Route>
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SiteSettingsProvider>
        <I18nProvider>
          <QueryClientProvider client={queryClient}>
            <CartProvider>
              <TooltipProvider>
                <div className="min-h-screen bg-background flex flex-col font-sans">
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <Navbar />
                    <MobileHeader />
                    <main className="flex-1 pb-16 md:pb-0">
                      <Router />
                    </main>
                    <MobileBottomNav />
                  </WouterRouter>
                </div>
                <Toaster />
              </TooltipProvider>
            </CartProvider>
          </QueryClientProvider>
        </I18nProvider>
      </SiteSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
