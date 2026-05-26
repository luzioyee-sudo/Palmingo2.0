import { motion } from "framer-motion";

export function FilmFlashcards() {
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden relative bg-gradient-to-br from-[oklch(0.22_0.04_220)] to-[oklch(0.18_0.06_260)]">
      <div className="absolute inset-0 grid place-items-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-32 h-44 rounded-2xl glass-strong p-3 flex flex-col justify-between"
            initial={{ x: 80, opacity: 0, rotate: 8 }}
            animate={{ x: [80, 0, -80], opacity: [0, 1, 0], rotate: [8, 0, -8] }}
            transition={{ duration: 3.6, repeat: Infinity, delay: i * 1.2, ease: "easeInOut" }}
          >
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">EN · ES</div>
            <div className="text-center">
              <div className="text-xl font-display font-bold">{["Bonjour", "Hola", "Aloha"][i]}</div>
              <div className="text-[10px] text-muted-foreground mt-1">tap to flip</div>
            </div>
            <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
              <motion.div className="h-full gradient-primary"
                animate={{ width: ["0%", "100%"] }} transition={{ duration: 2, delay: i * 1.2, repeat: Infinity }} />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function FilmVoiceTutor() {
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden relative bg-gradient-to-br from-[oklch(0.2_0.05_200)] to-[oklch(0.2_0.06_280)] flex items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        className="w-20 h-20 rounded-full gradient-primary glow grid place-items-center text-white text-3xl"
      >
        🎙
      </motion.div>
      {[1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-white/30"
          style={{ width: 80, height: 80 }}
          animate={{ scale: [1, 3.2], opacity: [0.6, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5 }}
        />
      ))}
      <div className="absolute bottom-3 left-3 right-3 flex items-end gap-1 justify-center h-10">
        {Array.from({ length: 24 }).map((_, i) => (
          <motion.span
            key={i}
            className="w-1 rounded-full gradient-primary"
            animate={{ height: [4, 28, 4] }}
            transition={{ duration: 1, repeat: Infinity, delay: (i % 8) * 0.08 }}
          />
        ))}
      </div>
    </div>
  );
}

export function FilmDictionary() {
  const words = ["serendipity", "ephemeral", "ineffable", "wabi-sabi"];
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden relative bg-gradient-to-br from-[oklch(0.2_0.04_180)] to-[oklch(0.2_0.06_220)] p-4">
      <div className="glass-strong rounded-xl px-3 py-2 text-xs text-muted-foreground flex items-center gap-2">
        🔍 <motion.span
          className="font-mono"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.4, repeat: Infinity }}
        >searching…</motion.span>
      </div>
      <div className="mt-3 space-y-2">
        {words.map((w, i) => (
          <motion.div
            key={w}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, delay: i * 0.4, repeat: Infinity, repeatDelay: 2 }}
            className="glass rounded-xl px-3 py-1.5 text-sm flex items-center justify-between"
          >
            <span className="font-display font-semibold">{w}</span>
            <span className="text-[10px] text-muted-foreground">/aɪ.pi.eɪ/</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function FilmVideos() {
  return (
    <div className="aspect-video w-full rounded-2xl overflow-hidden relative bg-gradient-to-br from-[oklch(0.18_0.05_300)] to-[oklch(0.2_0.06_240)] p-3">
      <div className="absolute inset-3 rounded-xl bg-black/40 grid place-items-center">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.4, repeat: Infinity }}
          className="w-12 h-12 rounded-full gradient-primary grid place-items-center text-white"
        >▶</motion.div>
      </div>
      <div className="absolute left-3 right-3 bottom-3 glass-strong rounded-xl p-2 text-[11px] leading-snug">
        {"Hello and welcome to today's lesson.".split(" ").map((w, i) => (
          <motion.span
            key={i}
            className="inline-block mr-1 rounded px-0.5"
            animate={{ backgroundColor: ["transparent", "oklch(0.7 0.15 200 / 0.4)", "transparent"] }}
            transition={{ duration: 0.6, delay: i * 0.3, repeat: Infinity, repeatDelay: 1.5 }}
          >{w}</motion.span>
        ))}
      </div>
    </div>
  );
}
