// LAXA UI UPDATE — Change 3 — Sidebar text labels → black/white (var(--foreground))
//                             Icons stay BRAND_ORANGE; active item keeps white text + orange bg
// LAXA UI UPDATE — Change 4 — All icons app-wide in BRAND_ORANGE
// LAXA UI UPDATE — Change 5 — Dark/light mode via CSS variables

import { Link, useLocation } from "wouter";
import { LogOut, Settings, UserCircle, X, Moon, Sun, ArrowLeft, ChevronRight } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PalmLogo } from "@/components/Logo";
import { PageTransition } from "@/components/PageTransition";
import { HeyLaxa } from "@/components/HeyLaxa";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { BRAND_ORANGE } from "@/lib/theme";

const HOME_PAGE = "/home";
const LAXA_PAGE = "/laxa";

function IconFriends({ active }: { active: boolean }) {
  const c = active ? "#fff" : BRAND_ORANGE;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="3.2" stroke={c} strokeWidth={active ? 2 : 1.7}
        fill={active ? "rgba(255,255,255,0.15)" : "none"} />
      <path d="M2 20c0-3.5 3.1-5.5 7-5.5s7 2 7 5.5" stroke={c} strokeWidth={active ? 2 : 1.7} />
      <circle cx="18" cy="8" r="2.3" stroke={c} strokeWidth="1.5"
        fill={active ? "rgba(255,255,255,0.10)" : "none"} />
      <path d="M15.5 20c0-2.5 1.8-4 4.5-4" stroke={c} strokeWidth="1.4" opacity="0.7" />
    </svg>
  );
}

const mainNav = [
  { to: "/home",       label: "Home",       tKey: "home",       icon: IconHome },
  { to: "/flashcards", label: "Cards",      tKey: "cards",      icon: IconCards },
  { to: "/dictionary", label: "Dictionary", tKey: "dictionary", icon: IconDictionary },
  { to: "/chunks",     label: "Topics",     tKey: "topics",     icon: IconTopics },
  { to: "/videos",     label: "Videos",     tKey: "videos",     icon: IconVideos },
  { to: "/friends",    label: "Friends",    tKey: "friends",    icon: IconFriends },
  { to: "/laxa",       label: "Laxa AI",    tKey: "laxa_ai",    icon: IconLaxa },
] as const;

/* ── Custom SVG nav icons ──────────────────────────────── */
// LAXA UI UPDATE — Change 4 — All inactive icons use BRAND_ORANGE

function IconHome({ active }: { active: boolean }) {
  // LAXA UI UPDATE — Change 4 — Icon orange; active = white on orange bg
  const c = active ? "#fff" : BRAND_ORANGE;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 01-1 1H14v-5h-4v5H4a1 1 0 01-1-1V10.5z"
        stroke={c} strokeWidth={active ? 2.2 : 1.8}
        fill={active ? "rgba(255,255,255,0.15)" : "none"} />
      <path d="M12 14 Q11 12, 12 10.5" stroke={c} strokeWidth="1.4" fill="none" />
      <path d="M12 10.5 Q10.5 9, 9.5 10" stroke={c} strokeWidth="1.2" fill="none" />
      <path d="M12 10.5 Q13.5 9, 14.5 10" stroke={c} strokeWidth="1.2" fill="none" />
    </svg>
  );
}

function IconCards({ active }: { active: boolean }) {
  const c = active ? "#fff" : BRAND_ORANGE;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="15" height="11" rx="2" stroke={c} strokeWidth="1.7"
        fill={active ? "rgba(255,255,255,0.08)" : "none"} />
      <rect x="6" y="4" width="15" height="11" rx="2" stroke={c} strokeWidth={active ? 2 : 1.7}
        fill={active ? "rgba(255,255,255,0.15)" : "none"} />
      <line x1="10" y1="10" x2="17" y2="10" stroke={c} strokeWidth="1.5" opacity="0.7" />
      <line x1="10" y1="12.5" x2="15" y2="12.5" stroke={c} strokeWidth="1.2" opacity="0.5" />
    </svg>
  );
}

function IconDictionary({ active }: { active: boolean }) {
  const c = active ? "#fff" : BRAND_ORANGE;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h7a1 1 0 011 1v14a1 1 0 01-1 1H4V4z" stroke={c} strokeWidth={active ? 2 : 1.7}
        fill={active ? "rgba(255,255,255,0.12)" : "none"} />
      <path d="M12 5h7v15h-7" stroke={c} strokeWidth={active ? 2 : 1.7} />
      <path d="M12 5v14" stroke={c} strokeWidth="1.4" strokeDasharray="2 1.5" opacity="0.5" />
      <motion.path d="M16 8 L16.5 10 L18 10.5 L16.5 11 L16 13 L15.5 11 L14 10.5 L15.5 10 Z"
        fill={c} opacity={active ? 0.9 : 0.6}
        animate={active ? { scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </svg>
  );
}

function IconTopics({ active }: { active: boolean }) {
  const c = active ? "#fff" : BRAND_ORANGE;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3"  y="3"  width="7" height="7" rx="1.5" stroke={c} strokeWidth={active ? 2 : 1.7}
        fill={active ? "rgba(255,255,255,0.18)" : "none"} />
      <rect x="14" y="3"  width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.7"
        fill={active ? "rgba(255,255,255,0.10)" : "none"} />
      <rect x="3"  y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.7"
        fill={active ? "rgba(255,255,255,0.08)" : "none"} />
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={c} strokeWidth="1.7"
        fill={active ? "rgba(255,255,255,0.06)" : "none"} />
    </svg>
  );
}

function IconVideos({ active }: { active: boolean }) {
  const c = active ? "#fff" : BRAND_ORANGE;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="15" height="14" rx="2" stroke={c} strokeWidth={active ? 2.1 : 1.7}
        fill={active ? "rgba(255,255,255,0.12)" : "none"} />
      <path d="M17 9l5-3v12l-5-3V9z" stroke={c} strokeWidth={active ? 2 : 1.7}
        fill={active ? "rgba(255,255,255,0.10)" : "none"} />
      <motion.polygon points="7,9 7,15 12,12" fill={c} opacity={active ? 0.9 : 0.55}
        animate={active ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1.8, repeat: Infinity }}
        style={{ transformOrigin: "9.5px 12px" }}
      />
    </svg>
  );
}

const MINI_PATH = "M10 0 C 10.6 6,14.4 9.4,20 10 C 14.4 10.6,10.6 14,10 20 C 9.4 14,5.6 10.6,0 10 C 5.6 9.4,9.4 6,10 0 Z";

function IconLaxa({ active }: { active: boolean }) {
  return (
    <div style={{ width: 18, height: 18, position: "relative" }}>
      <motion.svg viewBox="0 0 200 200" width="18" height="18" style={{ display: "block" }}
        animate={active ? { rotate: [0, 8, 0, -8, 0] } : {}}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <path fill={active ? "#fff" : BRAND_ORANGE} opacity={active ? 1 : 0.85}
          d="M100 8 C 104 60,140 96,192 100 C 140 104,104 140,100 192 C 96 140,60 104,8 100 C 60 96,96 60,100 8 Z"
        />
      </motion.svg>
      {active && (
        <svg viewBox="0 0 20 20" width="7" height="7"
          style={{ position: "absolute", top: -2, right: -2 }}>
          <motion.path fill="#FFB37A" d={MINI_PATH}
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ transformOrigin: "center", transformBox: "fill-box" }}
          />
        </svg>
      )}
    </div>
  );
}

function IconProfile({ active }: { active: boolean }) {
  const c = active ? "#fff" : BRAND_ORANGE;
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" stroke={c} strokeWidth={active ? 2.1 : 1.7}
        fill={active ? "rgba(255,255,255,0.15)" : "none"} />
      <path d="M4 20c0-4 3.6-6 8-6s8 2 8 6" stroke={c} strokeWidth={active ? 2 : 1.7} />
    </svg>
  );
}

/* ── Avatar ─────────────────────────────────────────────── */
function Avatar({ size = 36 }: { size?: number }) {
  const { user } = useAuth();
  const initials = (user?.name ?? "?").slice(0, 2).toUpperCase();
  if (user?.avatar) {
    return (
      <img src={user.avatar} alt="avatar"
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `1.5px solid rgba(255,77,46,0.3)` }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
      boxShadow: `0 2px 12px rgba(255,77,46,0.3)`,
    }}>
      {initials}
    </div>
  );
}

/* ── Mobile Sidebar ─────────────────────────────────────── */
function MobileSidebar({
  open, onClose, dark, onToggleDark, pathname,
}: {
  open: boolean; onClose: () => void;
  dark: boolean; onToggleDark: () => void;
  pathname: string;
}) {
  const { user, signOut } = useAuth();
  const { t } = useI18n();
  const [, navigate] = useLocation();

  const handleNav = (to: string) => { onClose(); navigate(to); };
  const handleSignOut = () => { onClose(); signOut(); navigate("/"); };

  return (
    <AnimatePresence>
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            onClick={onClose}
            style={{
              position: "absolute", inset: 0,
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            }}
          />

          {/* Drawer panel */}
          <motion.div
            initial={{ x: -290 }} animate={{ x: 0 }} exit={{ x: -290 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            style={{
              position: "absolute", top: 0, left: 0, bottom: 0, width: 280,
              background: "var(--background)",
              borderRight: "1px solid var(--border)",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            {/* Sidebar header */}
            <div style={{
              padding: "20px 20px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <PalmLogo size={30} showWord={false} />
                <div style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, fontSize: 16, letterSpacing: "-0.03em", marginTop: 6,
                  color: "var(--foreground)",
                }}>
                  Palmin<span style={{ color: BRAND_ORANGE }}>go</span>
                </div>
                <div style={{ fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.04em" }}>
                  Powered by Laxa AI
                </div>
              </div>

              {/* LAXA UI UPDATE — Change 4 — Theme icon in BRAND_ORANGE */}
              <button onClick={onToggleDark}
                style={{
                  background: "var(--secondary)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "8px 10px", cursor: "pointer",
                  color: BRAND_ORANGE, display: "flex", alignItems: "center",
                }}>
                {dark ? <Moon style={{ width: 15, height: 15 }} /> : <Sun style={{ width: 15, height: 15 }} />}
              </button>

              {/* LAXA UI UPDATE — Change 4 — Close icon in BRAND_ORANGE */}
              <button onClick={onClose}
                style={{
                  background: "var(--secondary)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "8px 10px", cursor: "pointer",
                  color: BRAND_ORANGE, display: "flex", alignItems: "center",
                }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, overflowY: "auto", padding: "12px 12px 0" }}>
              {mainNav.map((item) => {
                const active = pathname === item.to;
                return (
                  <button key={item.to} onClick={() => handleNav(item.to)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12,
                      padding: "11px 14px", borderRadius: 12, border: "none",
                      marginBottom: 2, cursor: "pointer", textAlign: "left",
                      background: active ? `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)` : "transparent",
                      // LAXA UI UPDATE — Change 3 — Active = white text; inactive = var(--foreground) (black/white)
                      color: active ? "#fff" : "var(--foreground)",
                      fontWeight: active ? 600 : 400, fontSize: 14,
                      fontFamily: "'Space Grotesk', sans-serif",
                      letterSpacing: "-0.01em",
                      transition: "all 0.18s",
                      boxShadow: active ? `0 4px 14px rgba(255,77,46,0.35)` : "none",
                    }}
                  >
                    {/* Icon always orange when inactive; white when active (icon component handles it) */}
                    <item.icon active={active} />
                    {/* LAXA UI UPDATE — Change 3 — Text label uses button's color (black/white when inactive) */}
                    <span style={{ flex: 1 }}>{t(item.tKey)}</span>
                    {active && <ChevronRight style={{ width: 13, height: 13, opacity: 0.6 }} />}
                  </button>
                );
              })}

              <div style={{ height: 1, background: "var(--border)", margin: "12px 2px" }} />

              {/* Settings */}
              <button onClick={() => handleNav("/settings")}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 12, border: "none",
                  marginBottom: 2, cursor: "pointer",
                  background: pathname === "/settings" ? `rgba(255,77,46,0.08)` : "transparent",
                  transition: "all 0.18s",
                }}
              >
                <Settings style={{ width: 17, height: 17, color: BRAND_ORANGE, flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", color: "var(--foreground)" }}>
                  {t("settings")}
                </span>
              </button>
            </nav>

            {/* Profile + Sign Out */}
            <div style={{ padding: "12px 12px 24px", borderTop: "1px solid var(--border)" }}>
              <button onClick={() => handleNav("/profile")}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 12, border: "none",
                  marginBottom: 8, cursor: "pointer",
                  background: "var(--secondary)", transition: "all 0.18s",
                }}
              >
                <Avatar size={36} />
                <div style={{ flex: 1, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                    {user?.username ? `@${user.username}` : user?.email}
                  </div>
                </div>
                {/* LAXA UI UPDATE — Change 4 — Profile icon in BRAND_ORANGE */}
                <UserCircle style={{ width: 15, height: 15, color: BRAND_ORANGE }} />
              </button>

              {/* Sign out */}
              <button onClick={handleSignOut}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 12, border: "none",
                  cursor: "pointer", background: "transparent",
                  transition: "all 0.18s",
                }}
              >
                <LogOut style={{ width: 14, height: 14, color: BRAND_ORANGE }} />
                <span style={{ fontSize: 13, fontFamily: "'Space Grotesk', sans-serif", color: "var(--foreground)" }}>
                  {t("sign_out")}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/* ── AppShell ────────────────────────────────────────────── */
export function AppShell({ children }: { children: ReactNode }) {
  const [pathname] = useLocation();
  const [, navigate] = useLocation();
  // LAXA UI UPDATE — Change 5 — Dark mode persisted in localStorage
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("palmingo:theme") === "dark"; } catch { return false; }
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    // LAXA UI UPDATE — Change 5 — Toggle CSS class for dark mode variables
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("palmingo:theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  // LAXA UI UPDATE — Change 1 — Listen for sidebar open event from Tutor page header
  useEffect(() => {
    const handler = () => setSidebarOpen(true);
    window.addEventListener("palmingo:openSidebar", handler);
    return () => window.removeEventListener("palmingo:openSidebar", handler);
  }, []);

  const { t, isRTL } = useI18n();
  const handleSignOut = () => { signOut(); navigate("/"); };
  const isActive = (to: string) => pathname === to;
  const isHome = pathname === HOME_PAGE;
  // LAXA UI UPDATE — Change 1 — Full-height layout for /laxa (no padding, no back bar)
  const isLaxa = pathname === LAXA_PAGE;

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      dir={isRTL ? "rtl" : "ltr"}
      style={{ color: "var(--foreground)" }}
    >

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <MobileSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          dark={dark}
          onToggleDark={() => setDark((d) => !d)}
          pathname={pathname}
        />
      </div>

      {/* ── Desktop Sidebar ────────────────────────────────── */}
      <aside className="hidden md:flex flex-col gap-3 p-4 w-64 sticky top-0 h-screen">
        <Link to="/home" className="px-3 py-3 block" style={{ textDecoration: "none" }}>
          <PalmLogo size={36} />
        </Link>

        <nav className="glass rounded-2xl p-2 flex flex-col gap-0.5 flex-1 min-h-0 overflow-y-auto">
          {mainNav.map((item) => {
            const active = isActive(item.to);
            return (
              <Link key={item.to} to={item.to}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200"
                style={{
                  // LAXA UI UPDATE — Change 3 — Inactive text = var(--foreground) (black/white)
                  // Active text = white (on orange gradient pill)
                  color: active ? "#fff" : "var(--foreground)",
                  fontWeight: active ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                <AnimatePresence>
                  {active && (
                    <motion.div layoutId="activeNavPill"
                      style={{
                        position: "absolute", inset: 0, borderRadius: 12,
                        background: `linear-gradient(135deg, ${BRAND_ORANGE}, #FF6B3D)`,
                        boxShadow: `0 4px 14px rgba(255,77,46,0.38)`,
                        zIndex: 0,
                      }}
                      initial={{ opacity: 0, scale: 0.88 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.88 }}
                      transition={{ type: "spring", stiffness: 320, damping: 28 }}
                    />
                  )}
                </AnimatePresence>
                {/* LAXA UI UPDATE — Change 4 — Icon handles its own orange/white color */}
                <span className="flex-shrink-0 relative z-10"><item.icon active={active} /></span>
                {/* LAXA UI UPDATE — Change 3 — Label text: foreground when inactive, white when active */}
                <span className="relative z-10">{t(item.tKey)}</span>
                {active && <ChevronRight className="w-3 h-3 ml-auto opacity-60 relative z-10" style={{ color: "#fff" }} />}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-2">
          <Link to="/profile" className="glass rounded-2xl p-3 flex items-center gap-3 transition"
            style={{ textDecoration: "none" }}>
            <Avatar size={38} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--foreground)" }}>
                {user?.name}
              </div>
              <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                {user?.username ? `@${user.username}` : user?.email}
              </div>
            </div>
            {/* LAXA UI UPDATE — Change 4 — Profile icon in BRAND_ORANGE */}
            <UserCircle className="w-4 h-4 flex-shrink-0" style={{ color: BRAND_ORANGE }} />
          </Link>

          {/* LAXA UI UPDATE — Change 3 — Settings: icon orange, text foreground */}
          <Link to="/settings" className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2 text-sm transition"
            style={{ textDecoration: "none", color: "var(--foreground)" }}>
            <Settings className="w-4 h-4" style={{ color: BRAND_ORANGE }} />
            {t("settings")}
          </Link>

          <div className="flex gap-2">
            {/* LAXA UI UPDATE — Change 3+4 — Theme toggle: icon orange, text foreground */}
            <button onClick={() => setDark((d) => !d)}
              className="glass flex-1 rounded-2xl px-3 py-2.5 text-xs transition flex items-center gap-1.5"
              style={{ color: "var(--foreground)" }}>
              {dark
                ? <><Moon className="w-3.5 h-3.5" style={{ color: BRAND_ORANGE }} /> {t("dark")}</>
                : <><Sun className="w-3.5 h-3.5" style={{ color: BRAND_ORANGE }} /> {t("light")}</>
              }
            </button>
            {/* LAXA UI UPDATE — Change 4 — LogOut icon in BRAND_ORANGE */}
            <button onClick={handleSignOut} title="Sign out"
              className="glass rounded-2xl px-3 py-2.5 transition"
              style={{ color: BRAND_ORANGE }}>
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main
        className="flex-1 min-w-0 flex flex-col"
        style={isLaxa ? { height: "100dvh", overflow: "hidden" } : { minHeight: "100vh" }}
      >

        {/* Mobile: top bar (home only) */}
        <AnimatePresence>
          {isHome && (
            <motion.div className="md:hidden sticky top-0 z-40"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              style={{
                background: "var(--glass)",
                backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center",
                padding: "12px 16px", gap: 12,
              }}
            >
              {/* LAXA UI UPDATE — Change 4 — Hamburger in BRAND_ORANGE */}
              <button onClick={() => setSidebarOpen(true)}
                style={{
                  background: "none", border: "none", padding: "6px",
                  cursor: "pointer", color: BRAND_ORANGE,
                  display: "flex", alignItems: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <line x1="2" y1="5"  x2="18" y2="5"  stroke={BRAND_ORANGE} strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="2" y1="10" x2="18" y2="10" stroke={BRAND_ORANGE} strokeWidth="1.8" strokeLinecap="round"/>
                  <line x1="2" y1="15" x2="18" y2="15" stroke={BRAND_ORANGE} strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </button>

              <div style={{ flex: 1, textAlign: "center" }}>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, fontSize: 17, letterSpacing: "-0.04em",
                  color: "var(--foreground)",
                }}>
                  Palmin<span style={{ color: BRAND_ORANGE }}>go</span>
                </span>
              </div>

              <Link to="/profile" style={{ textDecoration: "none" }}>
                <Avatar size={32} />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile: back bar (non-home, non-laxa pages) */}
        {/* LAXA UI UPDATE — Change 1 — Hidden on /laxa (Tutor has its own header) */}
        <AnimatePresence>
          {!isHome && !isLaxa && (
            <motion.div className="md:hidden"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              style={{
                position: "sticky", top: 0, zIndex: 40,
                padding: "12px 16px",
                display: "flex", alignItems: "center", gap: 10,
                background: "var(--background)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <button onClick={() => navigate("/home")}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 14,
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600,
                  padding: "4px 0",
                  color: "var(--foreground)",
                }}
              >
                {/* LAXA UI UPDATE — Change 4 — Back arrow icon in BRAND_ORANGE */}
                <ArrowLeft style={{ width: 18, height: 18, color: BRAND_ORANGE }} />
                {/* LAXA UI UPDATE — Change 3 — "Home" text in var(--foreground) */}
                {t("home")}
              </button>
              <div style={{ flex: 1, textAlign: "right" }}>
                <span style={{ fontSize: 13, color: "var(--muted-foreground)", fontFamily: "'Space Grotesk', sans-serif" }}>
                  {mainNav.find((n) => n.to === pathname)?.label ?? ""}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page content wrapper */}
        {/* LAXA UI UPDATE — Change 1 — /laxa gets full-height flex, no padding */}
        <div className={`flex-1 w-full ${
          isLaxa
            ? "relative flex flex-col overflow-hidden"
            : "px-4 md:px-10 pt-5 md:pt-10 pb-10 max-w-6xl mx-auto"
        }`}>
          {/* Skip PageTransition for /laxa (chat interface, not a navigable page) */}
          {isLaxa ? children : <PageTransition>{children}</PageTransition>}
        </div>
      </main>
      <HeyLaxa />
    </div>
  );
}
