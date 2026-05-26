import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PalmLogo } from "@/components/Logo";

const ORANGE = "#FF4D2E";

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const next = params.get("next") || "/home";

  const validate = () => {
    if (!email.includes("@")) { setError("Enter a valid email address."); return false; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return false; }
    if (tab === "signup" && name.trim().length < 2) { setError("Enter your full name."); return false; }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      if (tab === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password, name.trim());
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--background)",
    color: "var(--foreground)",
    padding: "12px 16px",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "Inter, sans-serif",
  };

  return (
    /* Full viewport — no AppShell nav visible */
    <div style={{
      minHeight: "100vh",
      background: "var(--background)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      position: "relative",
    }}>
      {/* Back button — top-left */}
      <Link to="/"
        style={{
          position: "fixed", top: 20, left: 20, zIndex: 10,
          display: "flex", alignItems: "center", gap: 6,
          color: "var(--muted-foreground)",
          textDecoration: "none", fontSize: 13, fontWeight: 500,
          padding: "8px 14px", borderRadius: 100,
          background: "var(--secondary)",
          border: "1px solid var(--border)",
          transition: "all 0.2s",
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        Back
      </Link>

      {/* Subtle orange glow top-center */}
      <div style={{
        position: "fixed", top: -80, left: "50%", transform: "translateX(-50%)",
        width: 400, height: 240,
        background: `radial-gradient(ellipse at center, ${ORANGE}18 0%, transparent 70%)`,
        pointerEvents: "none",
      }} />

      <div style={{ width: "100%", maxWidth: 380 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Logo centered */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
            <PalmLogo size={44} showWord={false} />
            <div style={{
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
              fontSize: 22, letterSpacing: "-0.04em", marginTop: 12,
              color: "var(--foreground)",
            }}>
              Welcome to Palmin<span style={{ color: ORANGE }}>go</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--muted-foreground)", marginTop: 4 }}>
              Powered by Laxa AI
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 24,
            padding: 32,
            backdropFilter: "blur(24px)",
          }}>
            {/* Tabs */}
            <div style={{
              display: "flex", borderRadius: 14,
              background: "var(--secondary)",
              padding: 4, marginBottom: 24, gap: 4,
            }}>
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(""); }}
                  style={{
                    flex: 1, padding: "9px 16px",
                    borderRadius: 10, border: "none",
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: tab === t ? "var(--background)" : "transparent",
                    color: tab === t ? "var(--foreground)" : "var(--muted-foreground)",
                    boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  {t === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {tab === "signup" && (
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Learner"
                    style={inputBase}
                    onFocus={(e) => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = `0 0 0 3px ${ORANGE}18`; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                    data-testid="input-name"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  style={inputBase}
                  onFocus={(e) => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = `0 0 0 3px ${ORANGE}18`; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                  data-testid="input-email"
                  autoComplete="email"
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--muted-foreground)", marginBottom: 6, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    style={{ ...inputBase, paddingRight: 44 }}
                    onFocus={(e) => { e.target.style.borderColor = ORANGE; e.target.style.boxShadow = `0 0 0 3px ${ORANGE}18`; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                    data-testid="input-password"
                    autoComplete={tab === "signin" ? "current-password" : "new-password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    style={{
                      position: "absolute", right: 12, top: "50%",
                      transform: "translateY(-50%)", background: "none",
                      border: "none", cursor: "pointer", color: "var(--muted-foreground)",
                      padding: 4,
                    }}
                  >
                    {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    fontSize: 13, color: "#dc2626",
                    background: "rgba(220,38,38,0.07)",
                    borderRadius: 10, padding: "10px 14px",
                    border: "1px solid rgba(220,38,38,0.15)",
                  }}
                >
                  {error}
                </motion.div>
              )}

              {/* CTA Button — brand orange */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%", padding: "14px 20px",
                  borderRadius: 14, border: "none",
                  background: `linear-gradient(135deg, ${ORANGE}, #FF6B3D)`,
                  color: "#fff", fontSize: 14,
                  fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                  fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: "-0.01em",
                  boxShadow: `0 6px 20px ${ORANGE}35`,
                }}
                data-testid="button-submit"
              >
                {loading ? (
                  <><Loader2 style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                    {tab === "signin" ? "Signing in…" : "Creating account…"}</>
                ) : (
                  tab === "signin" ? "Sign In" : "Create Account"
                )}
              </button>
            </form>

            <p style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: "var(--muted-foreground)" }}>
              {tab === "signin" ? "New here? " : "Already have an account? "}
              <button
                onClick={() => { setTab(tab === "signin" ? "signup" : "signin"); setError(""); }}
                style={{ background: "none", border: "none", color: ORANGE, cursor: "pointer", fontWeight: 600, fontSize: 13 }}
              >
                {tab === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
