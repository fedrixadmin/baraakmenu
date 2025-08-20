// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { getCustomerClient } from "../lib/supabaseClients";
import { Mail, Phone, Gift, Wallet } from "lucide-react";
import LoginGate from "../components/LoginGate";
import Modal from "../components/Modal";

export default function Profile() {
  const sb = getCustomerClient();
  const [session, setSession] = useState<any>(null);
  const [openLogin, setOpenLogin] = useState(false);
  const [loyalty, setLoyalty] = useState<{ points: number } | null>(null);
  const [vouchers, setVouchers] = useState<any[]>([]);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    (async () => {
      if (!session) return;
      const uid = session.user.id;

      // These tables might not exist in your project; swallow 404s gracefully
      const pts = await sb.from("loyalty_points").select("points").eq("user_id", uid).maybeSingle();
      if (!pts.error) setLoyalty(pts.data ?? { points: 0 }); else setLoyalty({ points: 0 });

      const vs = await sb.from("vouchers").select("code,discount_type,discount_value,expires_at,redeemed").eq("user_id", uid);
      if (!vs.error) setVouchers(vs.data ?? []); else setVouchers([]);
    })();
  }, [session, sb]);

  if (!session) {
    return (
      <div className="page-with-bottombar">
        <div className="card p-5 space-y-3">
          <h2 className="text-xl font-bold">Your Profile</h2>
          <p className="text-black/70 text-sm">Sign in to manage your details, loyalty points, and vouchers.</p>
          <button className="btn btn-primary" onClick={() => setOpenLogin(true)}>Sign in</button>
        </div>
        <Modal open={openLogin} onClose={() => setOpenLogin(false)}>
          <LoginGate onAuthed={() => setOpenLogin(false)} />
        </Modal>
      </div>
    );
  }

  const u = session.user;
  const name = u.user_metadata?.full_name || u.email?.split("@")[0] || "Guest";
  const email = u.email ?? "";
  const phone = u.phone ?? "";

  const Card = ({ icon, title, subtitle, missing = false }: any) => (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full grid place-items-center bg-gold/15 text-gold">{icon}</div>
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className={`text-sm ${missing ? "text-red-600" : "text-black/60"}`}>{subtitle}</div>
      </div>
      {missing && <span className="text-xs text-red-600">Add</span>}
    </div>
  );

  return (
    <div className="space-y-4 page-with-bottombar">
      <h2 className="text-xl font-bold">Welcome <span className="text-gold">{name}</span></h2>

      <Card icon={<Mail className="w-5 h-5" />} title="Email" subtitle={email || "Not set"} missing={!email} />
      <Card icon={<Phone className="w-5 h-5" />} title="Mobile" subtitle={phone || "Not set"} missing={!phone} />

      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full grid place-items-center bg-gold/15 text-gold"><Wallet className="w-5 h-5" /></div>
            <div>
              <div className="font-semibold">Loyalty</div>
              <div className="text-sm text-black/60">1 point = AED 10 spent</div>
            </div>
          </div>
          <div className="text-lg font-extrabold">{loyalty?.points ?? 0} pts</div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full grid place-items-center bg-gold/15 text-gold"><Gift className="w-5 h-5" /></div>
          <div className="font-semibold">Vouchers</div>
        </div>
        {vouchers.length === 0 ? (
          <div className="text-sm text-black/60">No vouchers yet.</div>
        ) : (
          <ul className="space-y-2">
            {vouchers.map(v => (
              <li key={v.code} className="flex items-center justify-between">
                <span className="text-sm font-mono">{v.code}</span>
                <span className="text-xs text-black/60">{v.discount_type} {v.discount_value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
