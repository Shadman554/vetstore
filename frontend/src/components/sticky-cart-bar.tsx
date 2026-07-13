import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";

const HIDDEN_ON = ["/cart", "/checkout", "/admin"];

export function StickyCartBar() {
  const { itemCount, subtotal } = useCart();
  const [location] = useLocation();

  const hidden = HIDDEN_ON.some((p) => location.startsWith(p));

  return (
    <AnimatePresence>
      {!hidden && itemCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed left-0 right-0 z-40 px-3 bottom-[72px] md:bottom-4"
        >
          <div className="container mx-auto max-w-3xl">
            <Link href="/cart" data-testid="link-sticky-cart">
              <div className="flex items-center justify-between gap-3 bg-primary text-primary-foreground rounded-full shadow-lg px-4 sm:px-5 py-3 cursor-pointer hover:opacity-95 transition-opacity">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 shrink-0">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <span className="font-bold text-sm truncate">
                    {itemCount} item{itemCount !== 1 ? "s" : ""} in cart
                  </span>
                </div>
                <span className="font-bold text-sm shrink-0">
                  View cart · ${subtotal.toFixed(2)}
                </span>
              </div>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
