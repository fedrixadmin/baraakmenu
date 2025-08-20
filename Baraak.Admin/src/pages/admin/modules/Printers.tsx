import { Printer } from "lucide-react";

export default function Printers() {
  return (
    <div className="card p-4 space-y-2">
      <div className="text-sm text-black/70">
        Browser print is enabled (80mm receipt). Later you can run a local agent that polls <code>printer_jobs</code> to print to USB/LAN thermal printers.
      </div>
      <button className="btn btn-primary" onClick={() => window.print()}>
        <Printer className="w-4 h-4 mr-1" /> Test print
      </button>
    </div>
  );
}
