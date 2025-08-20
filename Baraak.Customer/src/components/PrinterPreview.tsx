// src/components/PrinterPreview.tsx
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

export default function PrinterPreview({
  open,
  onClose,
  children,
  title = "Print Preview",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            className="absolute left-1/2 top-8 -translate-x-1/2 w-[720px] max-w-[95vw] bg-white rounded-2xl shadow-2xl overflow-hidden"
            initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">{title}</div>
              <div className="flex gap-2">
                <button className="btn btn-ghost" onClick={onClose}>Close</button>
                <button className="btn btn-primary" onClick={() => window.print()}>Print</button>
              </div>
            </div>
            <div className="p-4 print:p-0 print:block">
              {/* printable region */}
              <div className="print:w-[80mm] print:mx-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
