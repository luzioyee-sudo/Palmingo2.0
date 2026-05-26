import { createContext, useContext, useState, type ReactNode } from "react";

export interface User {
  name: string;
  email: string;
  username?: string;
  age?: number;
  country?: string;
  nativeLang?: string;
  targetLang?: string;
  goal?: string;
  level?: string;
  avatar?: string;
  onboardingComplete?: boolean;
}

const USER_KEY = "palmingo:user";

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch { return null; }
}

interface AuthContextValue {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: () => {},
  updateProfile: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  const persist = (u: User) => {
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    setUser(u);
  };

  const signIn = async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 700));
    const existing = getStoredUser();
    const u: User = existing?.email === email
      ? existing
      : { name: email.split("@")[0], email };
    persist(u);
    // Notify i18n of the user's native language
    window.dispatchEvent(new CustomEvent("palmingo:userUpdated", { detail: u }));
  };

  const signUp = async (email: string, _password: string, name: string) => {
    await new Promise((r) => setTimeout(r, 700));
    const u: User = { name, email, onboardingComplete: false };
    persist(u);
    window.dispatchEvent(new CustomEvent("palmingo:userUpdated", { detail: u }));
  };

  const signOut = () => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const updateProfile = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      // Broadcast to i18n provider so UI lang syncs with nativeLang
      window.dispatchEvent(new CustomEvent("palmingo:userUpdated", { detail: updated }));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
