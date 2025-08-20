import { Outlet, useLocation, Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "./components/BottomNav";
import RouteLoader from "./components/RouteLoader";

export default function App() {
  const location = useLocation();
  const [sp] = useSearchParams();

  const backoffice =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/kitchen");

  return (
    <div className="min-h-dvh">
      <RouteLoader />

      {/* Brand header only on customer (mobile) app */}
      {!backoffice && (
        <header className="safe-top">
          <div className="max-w-screen-sm mx-auto px-4">
            <div className="card card-leather header-logo-card">
              <div className="flex items-center justify-center">
                <Link
                  to={`/${sp.toString() ? "?" + sp.toString() : ""}`}
                  className="select-none rounded-xl px-3 py-1 hover:bg-black/5 transition-colors"
                  aria-label="Go to Home"
                >
                  <img
                    src="/images/brand/logo.png"
                    alt="Baraak"
                    className="logo-emboss h-10 md:h-11 object-contain"
                  />
                </Link>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Page body */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname + sp.toString()}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className={`${backoffice ? "max-w-screen-xl" : "max-w-screen-sm"} mx-auto p-4`}
        >
          <div className={`${backoffice ? "" : "page-with-bottombar"}`}>
            <Outlet />
          </div>
        </motion.main>
      </AnimatePresence>

      {/* Mobile bottom nav only for customer app */}
      {!backoffice && <BottomNav />}
    </div>
  );
}
