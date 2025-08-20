import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useCartStore } from "../store/cart";
import { Home, UtensilsCrossed, ShoppingCart, User2 } from "lucide-react";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/menu", label: "Menu", icon: UtensilsCrossed },
  { to: "/cart", label: "Cart", icon: ShoppingCart },
  { to: "/profile", label: "Profile", icon: User2 },
];

export default function BottomNav() {
  const { pathname, search } = useLocation();
  const count = useCartStore((s) => s.itemsCount());

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 safe-bottom pointer-events-none">
      <div className="max-w-screen-sm mx-auto px-4 pb-2 pointer-events-auto">
        <nav className="bottom-bar">
          {tabs.map((t) => {
            const active = pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to));
            const Icon = t.icon;
            return (
              <Link key={t.to} to={`${t.to}${search}`} className="relative flex-1">
                <div className="flex flex-col items-center justify-center gap-1 py-2">
                  {/* active gold dot with icon */}
                  {active ? (
                    <motion.span
                      layoutId="activeDot"
                      className="grid place-items-center w-10 h-10 rounded-full bg-gold text-white shadow-[0_10px_26px_rgba(201,162,39,.35)]"
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.span>
                  ) : (
                    <span className="grid place-items-center w-10 h-10 rounded-full bg-black/5 text-black/70">
                      <Icon className="w-5 h-5" />
                    </span>
                  )}

                  {/* label only for inactive tabs */}
                  {!active && <span className="text-xs text-black/70">{t.label}</span>}

                  {/* cart badge */}
                  {t.to === "/cart" && count > 0 && (
                    <motion.span
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 380, damping: 18 }}
                      className="absolute -top-1.5 right-6 text-[10px] bg-gold text-white rounded-full px-1.5 py-0.5"
                    >
                      {count}
                    </motion.span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
