import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, Save, Check, User } from "lucide-react";
import { useAuth } from "@/lib/auth";

const LANGUAGES = [
  "Arabic", "English", "French", "Spanish", "German", "Italian",
  "Portuguese", "Russian", "Chinese", "Japanese", "Korean", "Turkish",
  "Dutch", "Polish", "Swedish", "Hindi", "Vietnamese", "Indonesian",
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [nativeLang, setNativeLang] = useState(user?.nativeLang ?? "");
  const [targetLang, setTargetLang] = useState(user?.targetLang ?? "");
  const [level, setLevel] = useState(user?.level ?? "A1");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = (user?.name ?? "?").slice(0, 2).toUpperCase();

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Image must be under 2 MB"); return; }
    const reader = new FileReader();
    reader.onload = () => updateProfile({ avatar: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    setError("");
    if (name.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    if (username.trim().length < 3) { setError("Username must be at least 3 characters."); return; }
    updateProfile({ name: name.trim(), username: username.trim().toLowerCase().replace(/^@/, ""), nativeLang, targetLang, level });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputCls = "glass w-full rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition";

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal info and learning preferences.</p>
      </motion.div>

      {/* Avatar */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
        className="glass rounded-3xl p-6 flex items-center gap-5"
      >
        <div className="relative flex-shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/30" />
          ) : (
            <div className="w-20 h-20 rounded-full gradient-primary glow flex items-center justify-center text-2xl font-bold text-white">
              {initials}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/80 transition"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </div>
        <div>
          <div className="font-bold text-lg">{user?.name}</div>
          <div className="text-muted-foreground text-sm">@{user?.username || "no username"}</div>
          <div className="text-xs text-muted-foreground mt-1">{user?.email}</div>
          {user?.country && <div className="text-xs text-muted-foreground">{user.country}</div>}
        </div>
      </motion.div>

      {/* Edit form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="glass rounded-3xl p-6 space-y-4"
      >
        <h2 className="font-semibold text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Personal Info</h2>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-widest">Display Name</label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-widest">Username</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
            <input className={inputCls + " pl-8"} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, "_").replace(/^@/, ""))} placeholder="username" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-widest">Native Language</label>
            <select className={inputCls + " cursor-pointer"} value={nativeLang} onChange={(e) => setNativeLang(e.target.value)}>
              <option value="">Select…</option>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-widest">Learning</label>
            <select className={inputCls + " cursor-pointer"} value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
              <option value="">Select…</option>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-widest">CEFR Level</label>
          <div className="flex gap-2">
            {LEVELS.map((lv) => (
              <button key={lv} onClick={() => setLevel(lv)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                  level === lv ? "gradient-primary text-white shadow-md" : "glass text-muted-foreground hover:text-foreground"
                }`}
              >{lv}</button>
            ))}
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-destructive bg-destructive/10 rounded-xl px-3 py-2">
            {error}
          </motion.p>
        )}

        <button onClick={handleSave}
          className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition ${
            saved ? "bg-green-500/20 text-green-600 dark:text-green-400" : "gradient-primary text-white glow"
          }`}
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
        </button>
      </motion.div>

      {/* Read-only onboarding info */}
      {(user?.goal || user?.country || user?.age) && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
          className="glass rounded-3xl p-6"
        >
          <h2 className="font-semibold text-base mb-3">About Me</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Country", value: user?.country },
              { label: "Age", value: user?.age ? String(user.age) : undefined },
              { label: "Goal", value: user?.goal?.replace(/_/g, " ") },
            ].filter((i) => i.value).map((item) => (
              <div key={item.label} className="glass rounded-2xl p-3">
                <div className="text-sm font-semibold capitalize">{item.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
