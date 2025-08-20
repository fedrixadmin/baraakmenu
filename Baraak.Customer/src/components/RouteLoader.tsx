import { useNavigation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function RouteLoader() {
  const nav = useNavigation();
  const loading = nav.state !== "idle";
  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="route-loader"
        />
      )}
    </AnimatePresence>
  );
}
