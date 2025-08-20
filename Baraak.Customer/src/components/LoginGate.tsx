import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginGate({ onAuthed }: { onAuthed?: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (s && onAuthed) onAuthed(); });
    return () => sub.subscription.unsubscribe();
  }, [onAuthed]);

  const sendMagic = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + "/cart" }
    });
    setBusy(false);
    if (error) alert(error.message); else alert("Check your email for the magic link.");
  };

  if (session) {
    return <div className="p-2">You’re signed in as <b>{session.user.email ?? session.user.phone}</b>.</div>;
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Sign in to continue</h2>
      <p className="text-sm text-black/60">We’ll email you a magic link to log in.</p>
      <input
        type="email"
        placeholder="you@example.com"
        className="w-full border rounded-xl p-3 outline-none focus:ring-2 ring-gold/50"
        value={email} onChange={e => setEmail(e.target.value)}
      />
      <button className="btn btn-primary w-full" disabled={busy || !email} onClick={sendMagic}>
        {busy ? "Sending..." : "Send magic link"}
      </button>
    </div>
  );
}
