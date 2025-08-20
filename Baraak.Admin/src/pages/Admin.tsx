import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function Admin() {
  const [me, setMe] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user));
  }, []);
  return (
    <div className="space-y-4">
      <div className="card p-4 flex items-center justify-between">
        <div className="font-bold">Admin Console</div>
        <div className="text-sm text-black/60">{me?.email}</div>
      </div>
      {/* mount your modules here (Products, Orders, Invoices, Reports, Tables, ServiceDesk, etc.) */}
      <div className="card p-4">Modules coming up…</div>
    </div>
  );
}
