import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { UserRound } from "lucide-react";

export default function Header() {
  const [session, setSession] = useState<any>(null);
  const [sp] = useSearchParams();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  const name = session?.user?.user_metadata?.full_name
    || session?.user?.email?.split("@")[0]
    || session?.user?.phone
    || "";

  return (
    <header className="safe-top mb-4">
      <div className="max-w-screen-sm mx-auto px-4">
        <div className="flex items-center justify-between">
          <Link to={`/${sp.toString() ? "?" + sp.toString() : ""}`} className="flex items-center gap-2">
            <img src="/images/brand/logo.png" className="h-8" alt="Baraak" />
          </Link>
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <span className="hidden sm:flex items-center gap-1 text-sm text-black/70">
                  <UserRound className="w-4 h-4" /> Hi, <b className="ml-1">{name}</b>
                </span>
                <button className="pill" onClick={signOut}>Sign out</button>
              </>
            ) : (
              <a href="/#login" className="pill">Sign in</a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
