// src/pages/admin/index.tsx
import { useEffect, useState } from "react";
import { getAdminClient } from "../../lib/supabaseClients";
import { Package, ShoppingCart, FileText, Layout, Bell, BadgeDollarSign, Table2, Search } from "lucide-react";

import Products from "./modules/Products";
import Categories from "./modules/Categories";
import Orders from "./modules/Orders";
import Invoices from "./modules/Invoices";
import Reports from "./modules/Reports";
import ServiceDesk from "./modules/ServiceDesk";
import Tables from "./modules/Tables";

type TabKey =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "invoices"
  | "servicedesk"
  | "tables"
  | "reports";

export default function Admin() {
  const sb = getAdminClient();
  const [tab, setTab] = useState<TabKey>("dashboard");
  const [search, setSearch] = useState("");
  const [who, setWho] = useState<{ name: string; role: string } | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: sess } = await sb.auth.getSession();
      if (!sess.session) return;
      const uid = sess.session.user.id;
      const { data } = await sb.from("staff").select("display_name, role").eq("user_id", uid).maybeSingle();
      if (alive) setWho({ name: data?.display_name || "Admin", role: data?.role || "ADMIN" });
    })();
    return () => { alive = false; };
  }, [sb]);

  const Item = ({
    k, icon, label,
  }: { k: TabKey; icon: React.ReactNode; label: string }) => (
    <button
      className={`w-full text-left px-4 py-2 rounded-xl hover:bg-black/5 ${tab === k ? "bg-black/5 font-semibold" : ""}`}
      onClick={() => setTab(k)}
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </span>
    </button>
  );

  return (
    <div className="grid grid-cols-[240px_1fr] gap-4">
      {/* Sidebar */}
      <aside className="card p-4 h-max sticky top-4">
        <div className="mb-4">
          <div className="text-sm text-black/60">Signed in</div>
          <div className="font-semibold">{who?.name || "…"}</div>
          <div className="text-xs text-black/50">{who?.role || ""}</div>
        </div>

        <nav className="space-y-1">
          <Item k="dashboard" icon={<Layout className="w-4 h-4" />} label="Dashboard" />
          <Item k="products" icon={<Package className="w-4 h-4" />} label="Products" />
          <Item k="categories" icon={<BadgeDollarSign className="w-4 h-4" />} label="Categories" />
          <Item k="orders" icon={<ShoppingCart className="w-4 h-4" />} label="Orders" />
          <Item k="invoices" icon={<FileText className="w-4 h-4" />} label="Invoices" />
          <Item k="servicedesk" icon={<Bell className="w-4 h-4" />} label="Service Desk" />
          <Item k="tables" icon={<Table2 className="w-4 h-4" />} label="Tables" />
          <Item k="reports" icon={<FileText className="w-4 h-4" />} label="Reports" />
        </nav>
      </aside>

      {/* Content */}
      <section className="space-y-4">
        {/* tiny header search bar (shared) */}
        <div className="card p-3 flex items-center gap-2">
          <Search className="w-4 h-4 text-black/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search within the current module…"
            className="flex-1 outline-none"
          />
        </div>

        {tab === "dashboard" && <DashboardGlance />}
        {tab === "products" && <Products search={search} />}
        {tab === "categories" && <Categories search={search} />}
        {tab === "orders" && <Orders search={search} />}
        {tab === "invoices" && <Invoices search={search} />}
        {tab === "servicedesk" && <ServiceDesk search={search} />}
        {tab === "tables" && <Tables search={search} />}
        {tab === "reports" && <Reports search={search} />}
      </section>
    </div>
  );
}

function DashboardGlance() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="card p-4">
        <div className="text-sm text-black/60">Today’s Orders</div>
        <div className="text-2xl font-extrabold mt-1">—</div>
      </div>
      <div className="card p-4">
        <div className="text-sm text-black/60">Walk-ins</div>
        <div className="text-2xl font-extrabold mt-1">—</div>
      </div>
      <div className="card p-4">
        <div className="text-sm text-black/60">Revenue</div>
        <div className="text-2xl font-extrabold mt-1">—</div>
      </div>
    </div>
  );
}
