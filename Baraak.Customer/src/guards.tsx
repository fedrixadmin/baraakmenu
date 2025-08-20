// src/guards.tsx
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getAdminClient, getKitchenClient } from "./lib/supabaseClients";

function GateShell({ label = "Checking access..." }: { label?: string }) {
  return (
    <div className="p-8 flex items-center justify-center">
      <div className="inline-flex items-center gap-2 text-black/70">
        <span className="animate-spin h-4 w-4 rounded-full border-2 border-black/20 border-t-black/60" />
        <span className="text-sm">{label}</span>
      </div>
    </div>
  );
}

/**
 * CustomerOnly
 * - If an admin/staff session exists in this browser profile, redirect to /admin
 * - If a kitchen session exists, redirect to /kitchen
 * - Otherwise allow rendering customer pages (no login required)
 */
export function CustomerOnly({ children }: { children: ReactNode }) {
  const admin = getAdminClient();
  const kitchen = getKitchenClient();
  const [state, setState] = useState<"checking" | "customerOK" | "toAdmin" | "toKitchen">("checking");

  useEffect(() => {
    let alive = true;
    (async () => {
      const [{ data: a }, { data: k }] = await Promise.all([
        admin.auth.getSession(),
        kitchen.auth.getSession(),
      ]);
      if (!alive) return;

      if (a.session) { setState("toAdmin"); return; }
      if (k.session) { setState("toKitchen"); return; }
      setState("customerOK");
    })();
    return () => { alive = false; };
  }, [admin, kitchen]);

  if (state === "checking") return <GateShell label="Loading..." />;
  if (state === "toAdmin") return <Navigate to="/admin" replace />;
  if (state === "toKitchen") return <Navigate to="/kitchen" replace />;
  return <>{children}</>;
}

/**
 * AdminGate — requires staff.role in ('ADMIN','MANAGER')
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const sb = getAdminClient();
  const [state, setState] = useState<"checking" | "allowed" | "login">("checking");
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: sess } = await sb.auth.getSession();
        if (!sess.session) { if (alive) setState("login"); return; }
        const { data } = await sb.from("staff").select("role").eq("user_id", sess.session.user.id).maybeSingle();
        const role = data?.role as string | undefined;
        if (role === "ADMIN" || role === "MANAGER") setState("allowed");
        else setState("login");
      } catch {
        setState("login");
      }
    })();
    return () => { alive = false; };
  }, [sb]);

  if (state === "checking") return <GateShell />;
  if (state === "login") return <Navigate to="/admin/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

/**
 * KitchenGate — requires staff.role in ('KITCHEN','ADMIN','MANAGER')
 */
export function KitchenGate({ children }: { children: ReactNode }) {
  const sb = getKitchenClient();
  const [state, setState] = useState<"checking" | "allowed" | "login">("checking");
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: sess } = await sb.auth.getSession();
        if (!sess.session) { if (alive) setState("login"); return; }
        const { data } = await sb.from("staff").select("role").eq("user_id", sess.session.user.id).maybeSingle();
        const role = data?.role as string | undefined;
        if (role && ["KITCHEN", "ADMIN", "MANAGER"].includes(role)) setState("allowed");
        else setState("login");
      } catch {
        setState("login");
      }
    })();
    return () => { alive = false; };
  }, [sb]);

  if (state === "checking") return <GateShell />;
  if (state === "login") return <Navigate to="/kitchen/login" replace state={{ from: location }} />;
  return <>{children}</>;
}
