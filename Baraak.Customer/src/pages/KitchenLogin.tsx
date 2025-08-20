// src/pages/KitchenLogin.tsx
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { getKitchenClient } from "../lib/supabaseClients";
import { useNavigate } from "react-router-dom";

export default function KitchenLogin() {
  const sb = getKitchenClient();
  const nav = useNavigate();
  const [email, setEmail] = useState("staff@baraak.ae");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session) nav("/kitchen", { replace: true });
    });
  }, [sb, nav]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    nav("/kitchen", { replace: true });
  }

  return (
    <div className="max-w-sm mx-auto card p-5">
      <h2 className="text-xl font-bold mb-3">Kitchen Sign In</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="text-sm text-black/70">Email</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>
        <div>
          <label className="text-sm text-black/70">Password</label>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {err && <div className="text-sm text-red-700">{err}</div>}
        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}
