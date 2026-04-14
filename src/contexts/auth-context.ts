import type { Session, User } from "@supabase/supabase-js";
import { createContext } from "react";

export type UserProfile = {
  id: string;
  company_id: string;
  full_name: string;
  role: "admin" | "employee";
};

export type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
