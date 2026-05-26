// LAXA UI UPDATE — Change 5 — Palm Tree: Full Natural Redesign
// - Large container (full width, proportional tall height)
// - Dramatically distinct growth stages per XP milestone
// - Richer trunk texture, layered fronds, natural gradients
// - Enhanced animations between stages

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getProgress, palmStage, type Progress } from "@/lib/progress";

/* ── Beach Scene — large, detailed, stage-aware ───────────── */
function BeachScene({ stage }: { stage: number }) {
  // LAXA UI UPDATE — Change 5 — Dramatic growth per stage for clear visual progress
  const trunkH     = 55 + stage * 32;            // stage 0=55, stage 6=247
  const trunkWidth = 7  + stage * 1.4;           // grows thicker
  const frondCount = Math.max(3, Math.min(10, 3 + Math.floor(stage * 1.2)));
  const frondLen   = 55 + stage * 14;            // longer fronds each stage
  const coconuts   = Math.max(0, stage - 2);
  const palmX      = 152;
  const palmBaseY  = 205;
  const palmTopY   = palmBaseY - trunkH;

  const frondAngles = Array.from({ length: frondCount }, (_, i) =>
    -100 + (200 * (i + 0.5)) / frondCount
  );

  // Birds appear at high stages — a natural touch
  const showBirds = stage >= 5;
  // Second distant palm silhouette at high stages
  const showDistantPalm = stage >= 4;

  return (
    <svg viewBox="0 0 320 240" className="w-full h-full" style={{ borderRadius: 16 }}>
      <defs>
        {/* Sky gradient — shifts warmer at higher stages (richer sunset) */}
        <linearGradient id="yp-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={stage >= 4 ? "#6db5e8" : "#90c8f0"} />
          <stop offset="50%"  stopColor={stage >= 4 ? "#b8dff5" : "#d4ecf7"} />
          <stop offset="100%" stopColor={stage >= 3 ? "#fde9c3" : "#fef5dc"} />
        </linearGradient>

        <linearGradient id="yp-ocean" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={stage >= 3 ? "#1158a0" : "#1565a8"} />
          <stop offset="60%"  stopColor="#0d4b82" />
          <stop offset="100%" stopColor="#0a3a65" />
        </linearGradient>

        <linearGradient id="yp-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#f7d98a" />
          <stop offset="100%" stopColor="#e0b84a" />
        </linearGradient>

        <linearGradient id="yp-trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor="#3e2208" />
          <stop offset="40%"  stopColor="#7d4f2a" />
          <stop offset="75%"  stopColor="#6b4020" />
          <stop offset="100%" stopColor="#4a2810" />
        </linearGradient>

        <linearGradient id="yp-frond-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stopColor={stage >= 4 ? "#1a6830" : "#217a3e"} />
          <stop offset="100%" stopColor={stage >= 4 ? "#38b558" : "#3daf5a"} />
        </linearGradient>
        <linearGradient id="yp-frond-b" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"   stopColor={stage >= 4 ? "#18622c" : "#1e6b36"} />
          <stop offset="100%" stopColor={stage >= 4 ? "#4dce6a" : "#4ec96a"} />
        </linearGradient>
        <linearGradient id="yp-frond-c" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%"   stopColor="#145c28" />
          <stop offset="100%" stopColor="#56d870" />
        </linearGradient>

        <radialGradient id="yp-sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fff9c4" stopOpacity="0.98" />
          <stop offset="65%"  stopColor="#ffe082" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ffe082" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="yp-wave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.80)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>

        {/* Coconut gradient */}
        <radialGradient id="yp-coconut" cx="35%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#7a4820" />
          <stop offset="100%" stopColor="#3e1e08" />
        </radialGradient>

        <filter id="yp-soft" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="1.8" />
        </filter>
        <filter id="yp-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Sky background */}
      <rect x="0" y="0" width="320" height="240" fill="url(#yp-sky)" />

      {/* Sun with halo glow */}
      <circle cx="48" cy="38" r="38" fill="url(#yp-sun)" />
      <circle cx="48" cy="38" r="16" fill="#FFE082" opacity="0.9" />
      <circle cx="48" cy="38" r="10" fill="#FFF176" />

      {/* Sun rays at high stages */}
      {stage >= 5 && (
        <g opacity="0.18">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <motion.line key={i}
              x1={48 + Math.cos(deg * Math.PI / 180) * 20}
              y1={38 + Math.sin(deg * Math.PI / 180) * 20}
              x2={48 + Math.cos(deg * Math.PI / 180) * 50}
              y2={38 + Math.sin(deg * Math.PI / 180) * 50}
              stroke="#FFE082" strokeWidth="2" strokeLinecap="round"
              animate={{ opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 2.5 + i * 0.2, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </g>
      )}

      {/* Clouds */}
      <g opacity="0.52">
        <ellipse cx="232" cy="30" rx="30" ry="11" fill="white" />
        <ellipse cx="250" cy="24" rx="20" ry="13" fill="white" />
        <ellipse cx="215" cy="26" rx="18" ry="10" fill="white" />
      </g>
      <g opacity="0.35">
        <ellipse cx="98"  cy="48" rx="24" ry="9"  fill="white" />
        <ellipse cx="114" cy="43" rx="16" ry="10" fill="white" />
        <ellipse cx="84"  cy="45" rx="14" ry="8"  fill="white" />
      </g>

      {/* Horizon shimmer */}
      <ellipse cx="160" cy="120" rx="165" ry="8" fill="rgba(210,235,248,0.32)" />

      {/* Ocean */}
      <rect x="0" y="118" width="320" height="55" fill="url(#yp-ocean)" />

      {/* Ocean shimmer lines */}
      {[
        { x1: 18, y1: 128, x2: 88,  y2: 128 },
        { x1: 112, y1: 134, x2: 188, y2: 134 },
        { x1: 30,  y1: 141, x2: 88,  y2: 141 },
        { x1: 210, y1: 127, x2: 278, y2: 127 },
        { x1: 60,  y1: 148, x2: 120, y2: 148 },
      ].map((ln, i) => (
        <motion.line key={i}
          x1={ln.x1} y1={ln.y1} x2={ln.x2} y2={ln.y2}
          stroke="rgba(255,255,255,0.24)" strokeWidth="1.5" strokeLinecap="round"
          animate={{ opacity: [0.12, 0.48, 0.12], x1: [ln.x1, ln.x1 + 10, ln.x1] }}
          transition={{ duration: 2.4 + i * 0.55, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Wave */}
      <motion.path
        fill="url(#yp-wave)"
        animate={{ d: [
          "M0 118 Q 40 112, 80 118 Q 120 124, 160 118 Q 200 112, 240 118 Q 280 124, 320 118 L320 126 Q 280 132, 240 126 Q 200 120, 160 126 Q 120 132, 80 126 Q 40 120, 0 126 Z",
          "M0 120 Q 40 114, 80 120 Q 120 126, 160 120 Q 200 114, 240 120 Q 280 126, 320 120 L320 128 Q 280 134, 240 128 Q 200 122, 160 128 Q 120 134, 80 128 Q 40 122, 0 128 Z",
        ]}}
        transition={{ duration: 2.8, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
      />

      {/* Sandy beach */}
      <path d="M0 162 Q 80 152, 165 160 Q 240 166, 320 157 L320 240 L0 240 Z" fill="url(#yp-sand)" />

      {/* Sand texture lines */}
      <path d="M12 178 Q 70 175, 130 178" stroke="rgba(160,115,40,0.25)" strokeWidth="1" fill="none" />
      <path d="M20 188 Q 90 185, 158 188" stroke="rgba(160,115,40,0.20)" strokeWidth="1" fill="none" />
      <path d="M6  198 Q 58 195, 108 198" stroke="rgba(160,115,40,0.15)" strokeWidth="1" fill="none" />

      {/* Pebbles */}
      {[
        { cx: 42, cy: 183, rx: 5.5, ry: 3 },
        { cx: 78, cy: 190, rx: 4,   ry: 2.2 },
        { cx: 60, cy: 200, rx: 6.5, ry: 3.5 },
        { cx: 25, cy: 208, rx: 3.5, ry: 2 },
        { cx: 105, cy: 195, rx: 3, ry: 1.6 },
      ].map((pbl, i) => (
        <ellipse key={i} {...pbl} fill="rgba(175,140,75,0.45)" />
      ))}

      {/* Distant palm silhouette — appears at stage 4+ */}
      {showDistantPalm && (
        <g opacity="0.18">
          <line x1="42" y1="170" x2="44" y2="128" stroke="#2a4a1a" strokeWidth="3" strokeLinecap="round" />
          <motion.path d="M44 128 Q 28 120, 20 126" stroke="#2a4a1a" strokeWidth="2" fill="none" strokeLinecap="round"
            animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "44px 128px" }}
          />
          <motion.path d="M44 128 Q 56 118, 62 122" stroke="#2a4a1a" strokeWidth="2" fill="none" strokeLinecap="round"
            animate={{ rotate: [2, -2, 2] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "44px 128px" }}
          />
        </g>
      )}

      {/* Birds at stage 5+ */}
      {showBirds && (
        <g opacity="0.55">
          <motion.path d="M240 55 Q 245 50, 250 55" stroke="#4a5a6a" strokeWidth="1.5" fill="none" strokeLinecap="round"
            animate={{ x: [-8, 8, -8], y: [-3, 3, -3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.path d="M256 48 Q 260 44, 264 48" stroke="#4a5a6a" strokeWidth="1.2" fill="none" strokeLinecap="round"
            animate={{ x: [-5, 10, -5], y: [-2, 4, -2] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.path d="M270 60 Q 273 56, 277 60" stroke="#4a5a6a" strokeWidth="1" fill="none" strokeLinecap="round"
            animate={{ x: [-6, 7, -6], y: [-2, 3, -2] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
        </g>
      )}

      {/* Palm trunk shadow */}
      <ellipse cx={palmX - 14} cy={palmBaseY + 11}
        rx={20 + stage * 2} ry={6}
        fill="rgba(0,0,0,0.13)" filter="url(#yp-soft)" />

      {/* Palm trunk — curved, textured */}
      <motion.path
        d={`M${palmX - 6} ${palmBaseY} C ${palmX - 14} ${palmBaseY - trunkH * 0.4}, ${palmX + 20} ${palmBaseY - trunkH * 0.65}, ${palmX + 10} ${palmTopY}`}
        stroke="url(#yp-trunk)"
        strokeWidth={trunkWidth}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />

      {/* Trunk ring notches — more rings on taller trees */}
      {Array.from({ length: Math.min(3 + stage, 9) }, (_, i) => {
        const t = (i + 0.5) / (3 + stage);
        const bx = palmX - 6 + 16 * t;
        const by = palmBaseY - trunkH * t;
        return (
          <motion.line key={i}
            x1={bx - 5} y1={by + 1.5} x2={bx + 6} y2={by - 1.5}
            stroke="rgba(0,0,0,0.22)" strokeWidth="1.8" strokeLinecap="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 + i * 0.06 }}
          />
        );
      })}

      {/* ── Fronds ─────────────────────────────────────── */}
      {stage > 0 && frondAngles.map((angle, i) => {
        const isLeft = angle < -8;
        const isMid  = Math.abs(angle) < 8;
        const gradId = isMid ? "yp-frond-c" : isLeft ? "yp-frond-a" : "yp-frond-b";
        const leaflets = Math.min(3 + stage, 6);
        return (
          <motion.g key={i} style={{ transformOrigin: `${palmX + 10}px ${palmTopY}px` }}>
            {/* Main frond stem */}
            <motion.path
              d={`M${palmX + 10} ${palmTopY} Q${palmX + 10 + frondLen * 0.5} ${palmTopY - 22}, ${palmX + 10 + frondLen} ${palmTopY + 8}`}
              stroke={`url(#${gradId})`}
              strokeWidth={2.6 + stage * 0.22}
              strokeLinecap="round"
              fill="none"
              style={{ transformOrigin: `${palmX + 10}px ${palmTopY}px`, rotate: `${angle}deg` }}
              initial={{ pathLength: 0, opacity: 0, scale: 0.2 }}
              animate={{ pathLength: 1, opacity: 0.95, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.07, type: "spring", stiffness: 120, damping: 14 }}
            />
            {/* Leaflet pairs along the frond */}
            {Array.from({ length: leaflets }, (_, j) => {
              const frac = (j + 0.8) / (leaflets + 0.5);
              const fx = palmX + 10 + frondLen * frac;
              const fy = palmTopY + 8 * frac - 22 * (1 - frac);
              const size = 10 + stage * 1.5;
              return (
                <motion.g key={j}
                  style={{ transformOrigin: `${palmX + 10}px ${palmTopY}px`, rotate: `${angle}deg` }}>
                  <motion.path
                    d={`M${fx} ${fy} Q${fx + size * 0.9} ${fy - size * 0.8}, ${fx + size * 1.7} ${fy - size * 0.3}`}
                    stroke={`url(#${gradId})`} strokeWidth={1.5} strokeLinecap="round" fill="none"
                    initial={{ opacity: 0 }} animate={{ opacity: 0.78 }}
                    transition={{ delay: 1.0 + i * 0.07 + j * 0.05 }}
                  />
                  <motion.path
                    d={`M${fx} ${fy} Q${fx + size * 0.8} ${fy + size * 0.5}, ${fx + size * 1.5} ${fy + size * 0.2}`}
                    stroke={`url(#${gradId})`} strokeWidth={1.2} strokeLinecap="round" fill="none"
                    initial={{ opacity: 0 }} animate={{ opacity: 0.55 }}
                    transition={{ delay: 1.05 + i * 0.07 + j * 0.05 }}
                  />
                </motion.g>
              );
            })}
            {/* Gentle sway animation */}
            <motion.g
              style={{ transformOrigin: `${palmX + 10}px ${palmTopY}px`, rotate: `${angle}deg` }}
              animate={{ rotate: [`${angle - 1.5}deg`, `${angle + 1.5}deg`, `${angle - 1.5}deg`] }}
              transition={{ duration: 2.8 + i * 0.3, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.g>
        );
      })}

      {/* ── Coconuts ───────────────────────────────────── */}
      {Array.from({ length: coconuts }).map((_, i) => (
        <motion.circle key={i}
          cx={palmX + 10 + (i - coconuts / 2) * 11}
          cy={palmTopY + 9}
          r={5 + stage * 0.3}
          fill="url(#yp-coconut)"
          stroke="rgba(0,0,0,0.18)" strokeWidth="0.8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.3 + i * 0.12, type: "spring", stiffness: 200 }}
        />
      ))}

      {/* Seed state — stage 0 only */}
      {stage === 0 && (
        <>
          <motion.ellipse
            cx={palmX} cy={palmBaseY + 4}
            rx={13} ry={7.5}
            fill="#7d4f2a"
            animate={{ scaleY: [1, 1.14, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          />
          <motion.ellipse
            cx={palmX + 1} cy={palmBaseY + 2}
            rx={6} ry={3.5}
            fill="#a06838" opacity="0.7"
            animate={{ scaleY: [1, 1.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.2 }}
          />
        </>
      )}

      {/* Sprout at stage 1 — tiny shoot */}
      {stage === 1 && (
        <motion.path
          d={`M${palmX + 2} ${palmBaseY - 18} Q ${palmX + 8} ${palmBaseY - 26}, ${palmX + 14} ${palmBaseY - 22}`}
          stroke="#3daf5a" strokeWidth="2.5" strokeLinecap="round" fill="none"
          animate={{ rotate: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: `${palmX + 2}px ${palmBaseY - 18}px` }}
        />
      )}
    </svg>
  );
}

/* ══════════════════════════════════════════════════ */
export function YourPalm({ compact = false }: { compact?: boolean }) {
  const [p, setP] = useState<Progress>(() => getProgress());
  useEffect(() => {
    const onUpd = () => setP(getProgress());
    window.addEventListener("palmingo:progress", onUpd);
    return () => window.removeEventListener("palmingo:progress", onUpd);
  }, []);

  const stage = palmStage(p.xp);
  const toNext = 50 - (p.xp % 50);
  const progressPct = ((p.xp % 50) / 50) * 100;
  const stageNames = ["Seed 🌱", "Sprout 🌿", "Sapling 🌴", "Young Palm 🌴", "Growing 🌴", "Lush 🌴✨", "Majestic 🌴🏆"];

  return (
    // LAXA UI UPDATE — Change 5 — Larger container, full-width natural presentation
    <div className="glass-strong rounded-3xl p-4 md:p-5 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-10 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{ background: "oklch(0.75 0.14 170)" }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative mb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Your Palm</div>
          <div className="font-display font-semibold text-base mt-0.5">{stageNames[Math.min(stage, stageNames.length - 1)]}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{p.xp} XP · {toNext} XP to next stage</div>
        </div>
        <div className="text-right">
          <motion.div
            className="text-2xl font-display font-bold text-gradient"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >🔥 {p.streak}</motion.div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">day streak</div>
        </div>
      </div>

      {/* LAXA UI UPDATE — Change 5 — Significantly taller beach scene for clear growth visibility */}
      <div className={`relative rounded-2xl overflow-hidden ${compact ? "h-48" : "h-64 md:h-80"}`}>
        <BeachScene stage={stage} />
      </div>

      {/* XP Progress bar */}
      <div className="mt-3 relative">
        <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
          <span>Stage {stage + 1} of {stageNames.length}</span>
          <span>{Math.round(progressPct)}% to next</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.9 0.01 200 / 0.35)" }}>
          <motion.div
            className="h-full rounded-full gradient-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPct}%` }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          />
        </div>
      </div>
    </div>
  );
}
