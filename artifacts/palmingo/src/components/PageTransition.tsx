import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { ReactNode } from "react";

/*
  Premium Minimalist Transitions
  Spec: calm ease-in-out opacity + subtle 2-3px vertical slide
  Duration: 0.25s, cubic-bezier(0.4, 0, 0.2, 1)
  No blur, no heavy slides, no pop — just a whisper-soft fade-up
*/

export function PageTransition({ children }: { children: ReactNode }) {
  const [pathname] = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -2 }}
        transition={{
          duration: 0.22,
          ease: [0.4, 0, 0.2, 1],
        }}
        style={{ willChange: "opacity, transform" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
