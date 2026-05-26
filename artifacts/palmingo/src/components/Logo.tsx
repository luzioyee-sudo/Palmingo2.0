import { motion } from "framer-motion";

/* Official Laxa sparkle paths from identity v3 */
const LAXA_PATH = "M100 8 C 104 60,140 96,192 100 C 140 104,104 140,100 192 C 96 140,60 104,8 100 C 60 96,96 60,100 8 Z";
const MINI_PATH = "M10 0 C 10.6 6,14.4 9.4,20 10 C 14.4 10.6,10.6 14,10 20 C 9.4 14,5.6 10.6,0 10 C 5.6 9.4,9.4 6,10 0 Z";

/* ── PalmLogo — app wordmark with official Laxa sparkle mark ── */
export function PalmLogo({ size = 36, showWord = true }: { size?: number; showWord?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" style={{ userSelect: "none" }}>
      {/* Laxa sparkle icon mark */}
      <motion.div
        initial={{ scale: 0, rotate: -90, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.2, 1.2, 0.3, 1] }}
        style={{ width: size, height: size, position: "relative", flexShrink: 0 }}
      >
        {/* Halo behind sparkle */}
        <motion.div
          style={{
            position: "absolute",
            inset: -2,
            borderRadius: "50%",
            background: "#FF4D2E",
            opacity: 0.15,
            filter: `blur(${Math.round(size * 0.22)}px)`,
          }}
          animate={{ opacity: [0.1, 0.22, 0.1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Main sparkle — orange #FF4D2E */}
        <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: "block" }}>
          <path fill="#FF4D2E" d={LAXA_PATH} />
        </svg>

        {/* Mini sparkle — top-right companion */}
        <svg
          viewBox="0 0 20 20"
          width={Math.round(size * 0.28)}
          height={Math.round(size * 0.28)}
          style={{
            position: "absolute",
            top: Math.round(size * -0.08),
            right: Math.round(size * -0.1),
          }}
        >
          <motion.path
            fill="#FFB37A" d={MINI_PATH}
            animate={{ scale: [1, 1.2, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
            style={{ transformOrigin: "center", transformBox: "fill-box" }}
          />
        </svg>
      </motion.div>

      {showWord && (
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.22, duration: 0.4 }}
          className="leading-none"
        >
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: size * 0.44,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              color: "currentColor",
            }}
          >
            Palmin<span style={{ color: "#FF4D2E" }}>go</span>
          </div>
          <div
            style={{
              fontSize: size * 0.22,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#7a7a82",
              marginTop: 2,
            }}
          >
            Powered by Laxa AI
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── AIOrb — official Laxa sparkle for AI elements ─────── */
/* Used in chat headers, AI reply badges, etc.              */
export function AIOrb({ size = 32, active = false }: { size?: number; active?: boolean }) {
  return (
    <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
      {/* Pulsing halo */}
      <motion.div
        style={{
          position: "absolute",
          inset: -Math.round(size * 0.2),
          borderRadius: "50%",
          background: "#FF4D2E",
          opacity: active ? 0.18 : 0.08,
          filter: `blur(${Math.round(size * 0.25)}px)`,
        }}
        animate={active ? { opacity: [0.1, 0.25, 0.1], scale: [0.85, 1.12, 0.85] } : {}}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main sparkle */}
      <motion.svg
        viewBox="0 0 200 200"
        width={size} height={size}
        style={{ display: "block", color: "#FF4D2E" }}
        animate={active ? { scale: [1, 1.06, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <path fill="currentColor" d={LAXA_PATH} />
      </motion.svg>

      {/* Mini sparkle — top-right */}
      <svg
        viewBox="0 0 20 20"
        width={Math.round(size * 0.3)} height={Math.round(size * 0.3)}
        style={{
          position: "absolute",
          top: Math.round(size * -0.06),
          right: Math.round(size * -0.1),
        }}
      >
        <motion.path
          fill="#FFB37A" d={MINI_PATH}
          animate={active
            ? { scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }
            : { opacity: 0.8 }
          }
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.3, ease: "easeInOut" }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />
      </svg>

      {/* Mini sparkle — bottom-right (smaller) */}
      <svg
        viewBox="0 0 20 20"
        width={Math.round(size * 0.18)} height={Math.round(size * 0.18)}
        style={{
          position: "absolute",
          bottom: Math.round(size * 0.04),
          right: Math.round(size * 0.04),
        }}
      >
        <motion.path
          fill="#FFB37A" d={MINI_PATH}
          animate={active
            ? { scale: [1, 1.4, 1], opacity: [0.4, 0.9, 0.4] }
            : { opacity: 0.55 }
          }
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.55, ease: "easeInOut" }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />
      </svg>
    </div>
  );
}
