import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "./lib/supabaseClient";

function Shell() {
  return (
    <div className="p-8 flex justify-center"><div>Checking access…</div></div>
  );
}

export function AdminGate({ children }: { children: ReactNode }) {
  const [ok, setOk] = useState<"checking" | "yes" | "no">("checking");
  const loc = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { if (alive) setOk("no"); return; }
      const uid = data.session.user.id;
      const { data: staff } = await supabase.from("staff").select("role").eq("user_id", uid).maybeSingle();
      const role = staff?.role as string | undefined;
      if (["ADMIN","MANAGER"].includes(role||"")) setOk("yes");
      else setOk("no");
    })();
    return () => { alive = false; };
  }, []);

  if (ok === "checking") return <Shell />;
  if (ok === "no") return <Navigate to="/admin/login" replace state={{ from: loc }} />;
  return <>{children}</>;
}
