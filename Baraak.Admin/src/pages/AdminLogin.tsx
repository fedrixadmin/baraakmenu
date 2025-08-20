import { type FormEvent, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminLogin() {
  const nav = useNavigate();
  const { state } = useLocation() as any;
  const [email, setEmail] = useState("admin@baraak.ae");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    nav(state?.from?.pathname || "/admin", { replace: true });
  }

  return (
    <div className="max-w-md mx-auto p-6 card space-y-4 mt-8">
      <h1 className="text-xl font-bold">Admin Sign In</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full border rounded-lg px-3 py-2" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full border rounded-lg px-3 py-2" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button disabled={busy} className="btn btn-primary w-full">{busy ? "Signing in…" : "Sign In"}</button>
      </form>
    </div>
  );
}
