// src/pages/Landing.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { getCustomerClient } from "../lib/supabaseClients";
import { useTableToken } from "../hooks/useTableToken";
import { Bell, Receipt, Flame, CheckCircle2, LoaderCircle } from "lucide-react";
import ProductCard, { type Product } from "../components/ProductCard";
import SmartImage from "../components/SmartImage";
import { titleCase } from "../lib/format";

type HighlightPick = {
  id?: string;
  name: string;
  description?: string | null;
  price?: number;
  image_url?: string | null;
};

type ServiceRequest = {
  id: string;
  kind: "WAITER" | "BILL";
  status: string; // enum in DB, we render gracefully
  table_token: string | null;
  created_at: string;
};

const sliderImages = [
  "/images/products/ABJ09363.jpg",
  "/images/products/ABJ08396.jpg",
  "/images/products/ABJ08613.jpg",
  "/images/products/ABJ09010.jpg",
  "/images/products/ABJ08511.jpg",
];

export default function Landing() {
  const sb = getCustomerClient();
  const tableToken = useTableToken();

  const [session, setSession] = useState<any>(null);
  const [chefPick, setChefPick] = useState<HighlightPick | null>(null);
  const [popular, setPopular] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // slider
  const [sIdx, setSIdx] = useState(0);

  // service-request UX
  const [sending, setSending] = useState<"WAITER" | "BILL" | null>(null);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const channelRef = useRef<ReturnType<typeof sb.channel> | null>(null);

  // session for greeting
  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  // initial load: featured + popular
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [{ data: featured }, { data: pop }] = await Promise.all([
          sb.from("products").select("*").eq("is_featured", true).limit(1),
          sb.from("products").select("*").order("name").limit(6),
        ]);

        if (!alive) return;

        if (featured?.length) {
          const p = featured[0] as any;
          setChefPick({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image_url: p.image_url,
          });
        } else {
          // fallback to any product if none are marked featured
          const { data: anyp } = await sb.from("products").select("*").limit(1);
          if (anyp?.length) {
            const p = anyp[0] as any;
            setChefPick({
              id: p.id,
              name: p.name,
              description: p.description,
              price: p.price,
              image_url: p.image_url,
            });
          }
        }

        setPopular((pop ?? []) as unknown as Product[]);
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sb]);

  // loop slider every ~2s
  useEffect(() => {
    if (sliderImages.length < 2) return;
    const t = setInterval(() => setSIdx((i) => (i + 1) % sliderImages.length), 2000);
    return () => clearInterval(t);
  }, []);

  // fetch last few service requests for this table token
  async function fetchRequests() {
    if (!tableToken) {
      setRequests([]);
      return;
    }
    const { data, error } = await sb
      .from("table_service_requests")
      .select("id,kind,status,table_token,created_at")
      .eq("table_token", tableToken)
      .order("created_at", { ascending: false })
      .limit(5);
    if (!error) setRequests((data as ServiceRequest[]) ?? []);
  }

  // realtime subscribe to this table's service requests
  useEffect(() => {
    // clean old channel
    channelRef.current?.unsubscribe();
    setRequests([]);

    if (!tableToken) return;

    const ch = sb
      .channel(`tsr:${tableToken}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "table_service_requests",
          filter: `table_token=eq.${tableToken}`,
        },
        () => fetchRequests()
      )
      .subscribe();
    channelRef.current = ch;

    // initial load for the table
    fetchRequests();

    return () => {
      ch.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableToken]);

  const firstName = useMemo(() => {
    const n = session?.user?.user_metadata?.full_name || session?.user?.email || "Guest";
    return String(n);
  }, [session]);

  async function call(kind: "WAITER" | "BILL") {
    try {
      setSending(kind);
      const payload: Record<string, any> = { kind };
      if (tableToken) payload.table_token = tableToken;

      // Let DB default set status (e.g., 'new'), no need to send it here.
      const { error } = await sb.from("table_service_requests").insert(payload);
      if (error) {
        alert(error.message);
        return;
      }
      // pull fresh list (admin desk will also see it realtime)
      await fetchRequests();
      // lightweight UX ping
      alert(`${kind === "WAITER" ? "Waiter" : "Bill"} request sent${tableToken ? ` for ${tableToken}` : ""}.`);
    } finally {
      setSending(null);
    }
  }

  // UI helpers
  function statusBadge(s: string) {
    const base = "px-2 py-0.5 rounded-full text-xs";
    if (s === "new") return <span className={`${base} bg-amber-100 text-amber-800`}>New</span>;
    if (s === "acknowledged") return <span className={`${base} bg-blue-100 text-blue-800`}>Acknowledged</span>;
    if (s === "resolved") return <span className={`${base} bg-emerald-100 text-emerald-800`}>Resolved</span>;
    return <span className={`${base} bg-black/10 text-black/70`}>{s}</span>;
  }

  return (
    <div className="space-y-4 page-with-bottombar mt-3">
      {/* Greeting + two gold action buttons in the same row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-xl bg-gold/10 grid place-items-center">👋</div>
            <div className="min-w-0">
              <div className="text-xs tracking-wide text-black/60">WELCOME</div>
              <div className="font-semibold truncate">{firstName}</div>
              <div className="text-sm text-black/60">
                {tableToken ? `Table: ${tableToken}` : "Scan your table QR."}
              </div>
            </div>
          </div>

          {/* Recent service requests for this table (if any) */}
          {requests.length > 0 && (
            <div className="mt-3 space-y-2">
              {requests.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div className="inline-flex items-center gap-2">
                    {r.status === "resolved" ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <LoaderCircle className="w-4 h-4 animate-spin text-gold" />
                    )}
                    <span className="font-medium">{r.kind === "WAITER" ? "Waiter" : "Bill"}</span>
                    <span className="text-black/50">{new Date(r.created_at).toLocaleTimeString()}</span>
                  </div>
                  {statusBadge(r.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            className="card-gold p-4 flex flex-col items-center justify-center disabled:opacity-60"
            onClick={() => call("WAITER")}
            disabled={!!sending}
            aria-label="Call Waiter"
          >
            {sending === "WAITER" ? (
              <LoaderCircle className="w-5 h-5 mb-1 animate-spin" />
            ) : (
              <Bell className="w-5 h-5 mb-1" />
            )}
            <span className="text-sm font-semibold">Waiter</span>
          </button>
          <button
            className="card-gold p-4 flex flex-col items-center justify-center disabled:opacity-60"
            onClick={() => call("BILL")}
            disabled={!!sending}
            aria-label="Request Bill"
          >
            {sending === "BILL" ? (
              <LoaderCircle className="w-5 h-5 mb-1 animate-spin" />
            ) : (
              <Receipt className="w-5 h-5 mb-1" />
            )}
            <span className="text-sm font-semibold">Bill</span>
          </button>
        </div>
      </div>

      {/* Chef’s highlight – tall hero */}
      <section className="card overflow-hidden">
        <div className="px-4 pt-4 flex items-center gap-2 text-black/60 text-xs tracking-wide">
          <Flame className="w-4 h-4 text-gold" /> TODAY’S HIGHLIGHT
        </div>
        {loading && !chefPick ? (
          <div className="p-4 animate-pulse">
            <div className="h-40 bg-black/5 rounded-xl" />
            <div className="mt-3 h-4 bg-black/5 rounded w-2/3" />
            <div className="mt-2 h-3 bg-black/5 rounded w-1/2" />
          </div>
        ) : chefPick ? (
          <div className="p-4">
            <div className="flex gap-4 items-stretch">
              <div className="w-2/5">
                <SmartImage
                  src={chefPick.image_url}
                  alt={chefPick.name}
                  ratio="4/3"
                  className="w-full rounded-xl"
                />
              </div>
              <div className="flex-1 flex flex-col">
                <span className="badge-pill bg-gold/15 text-gold">Chef Pick</span>
                <h3 className="mt-2 text-lg font-extrabold leading-tight">{titleCase(chefPick.name)}</h3>
                {chefPick.description && (
                  <p className="text-sm text-black/70 line-clamp-3 mt-1">{chefPick.description}</p>
                )}
                {typeof chefPick.price === "number" && (
                  <div className="mt-auto font-bold text-black">AED {chefPick.price.toFixed(2)}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">No highlight selected yet.</div>
        )}
      </section>

      {/* Popular preview grid (2 columns) */}
      <section className="space-y-2">
        <div className="px-1 text-xs tracking-wide text-black/60">POPULAR</div>
        <div className="grid grid-cols-2 gap-3 px-1">
          {popular.map((p) => (
            <ProductCard key={p.id} p={p} variant="grid" />
          ))}
          {!loading && popular.length === 0 && (
            <div className="col-span-2 card p-4 text-sm text-black/60">No products yet.</div>
          )}
        </div>
      </section>

      {/* Single-image slider (auto loop) */}
      <section className="card overflow-hidden">
        <SmartImage src={sliderImages[sIdx]} alt="promo" ratio="16/9" className="w-full rounded-none" />
      </section>
    </div>
  );
}
