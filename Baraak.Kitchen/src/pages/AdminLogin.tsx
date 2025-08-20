// src/pages/AdminLogin.tsx
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { getAdminClient } from "../lib/supabaseClients";

export default function AdminLogin() {
  const sb = getAdminClient();
  const nav = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@baraak.ae");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const from = (location.state as any)?.from?.pathname || "/admin";

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await sb.auth.getSession();
      if (alive && data.session) nav("/admin", { replace: true });
    })();
    return () => { alive = false; };
  }, [sb, nav]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      alert(error.message);
      return;
    }
    nav(from, { replace: true });
  }

  return (
    <div className="max-w-md mx-auto card p-6">
      <h2 className="text-xl font-bold mb-4">Admin Sign in</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-black/60">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            className="mt-1 w-full border border-black/10 rounded-xl p-3 outline-none focus:ring-2 ring-gold/40"
            required
          />
        </div>
        <div>
          <label className="text-sm text-black/60">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            className="mt-1 w-full border border-black/10 rounded-xl p-3 outline-none focus:ring-2 ring-gold/40"
            required
          />
        </div>
        <button className="btn btn-primary w-full disabled:opacity-60" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="text-xs text-black/50 mt-4">
        Not for customers. <Link to="/" className="underline">Go to customer app</Link>
      </div>
    </div>
  );
}
