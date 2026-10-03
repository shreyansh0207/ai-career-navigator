import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  apiRequest,
  getSessionToken,
  saveCandidateProfile,
  setSessionToken,
  type CandidateProfile,
  type CandidateUser,
} from "@/lib/api";

interface AuthContextValue {
  user: CandidateUser | null;
  profile: CandidateProfile;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  saveProfile: (updates: Partial<CandidateProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CandidateUser | null>(null);
  const [profile, setProfile] = useState<CandidateProfile>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getSessionToken()) {
      setLoading(false);
      return;
    }
    apiRequest<{ user: CandidateUser; profile: CandidateProfile }>("/auth/me")
      .then(({ user: account, profile: savedProfile }) => {
        setUser(account);
        setProfile(savedProfile || {});
      })
      .catch(() => {
        setSessionToken(null);
        setUser(null);
        setProfile({});
      })
      .finally(() => setLoading(false));
  }, []);

  const establishSession = (token: string, account: CandidateUser, savedProfile: CandidateProfile) => {
    setSessionToken(token);
    setUser(account);
    setProfile(savedProfile || {});
  };

  const login = async (email: string, password: string) => {
    const result = await apiRequest<{ token: string; user: CandidateUser; profile: CandidateProfile }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    establishSession(result.token, result.user, result.profile);
  };

  const register = async (displayName: string, email: string, password: string) => {
    const result = await apiRequest<{ token: string; user: CandidateUser; profile: CandidateProfile }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ displayName, email, password }),
    });
    establishSession(result.token, result.user, result.profile);
  };

  const logout = () => {
    setSessionToken(null);
    setUser(null);
    setProfile({});
  };

  const saveProfile = async (updates: Partial<CandidateProfile>) => {
    const result = await saveCandidateProfile(updates);
    setProfile((current) => ({ ...current, ...result.profile }));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout, saveProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}