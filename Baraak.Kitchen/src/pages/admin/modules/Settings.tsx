import { AlertTriangle } from "lucide-react";

export default function SettingsPane() {
  return (
    <div className="card p-4 space-y-2">
      <div className="flex items-center gap-2 text-amber-600"><AlertTriangle className="w-4 h-4"/>Advanced settings coming.</div>
      <div className="text-sm text-black/70">Branding, taxes, discounts, devices, staff roles, etc.</div>
    </div>
  );
}
