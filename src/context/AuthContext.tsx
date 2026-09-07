import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { api } from "../services/api";
import { useToast } from "./ToastContext";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { name: string; email: string; password: string; role: string; departmentName?: string; position?: string }) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  "Super Admin": { email: "admin@example.com", pass: "Admin@123" },
  "HR Admin": { email: "hr@example.com", pass: "HR@123" },
  Manager: { email: "manager@example.com", pass: "Manager@123" },
  Employee: { email: "employee@example.com", pass: "Employee@123" }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("ems_token"));
  const [loading, setLoading] = useState<boolean>(true);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("ems_token");
      if (storedToken) {
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            localStorage.removeItem("ems_token");
            setToken(null);
          }
        } catch (err) {
          console.error("Auth initialization failed:", err);
          localStorage.removeItem("ems_token");
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await api.login({ email, password: pass });
      if (res.success && res.token && res.user) {
        localStorage.setItem("ems_token", res.token);
        setToken(res.token);
        setUser(res.user);
        success(`Welcome back, ${res.user.name} (${res.user.role})!`);
        return true;
      }
      return false;
    } catch (err: any) {
      toastError(err.message || "Failed to log in.");
      return false;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: string;
    departmentName?: string;
    position?: string;
  }): Promise<boolean> => {
    try {
      const res = await api.register(data);
      if (res.success && res.token && res.user) {
        localStorage.setItem("ems_token", res.token);
        setToken(res.token);
        setUser(res.user);
        success(`Account created successfully! Welcome, ${res.user.name} (${res.user.role}).`);
        return true;
      }
      return false;
    } catch (err: any) {
      toastError(err.message || "Registration failed.");
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("ems_token");
    setToken(null);
    setUser(null);
    success("Logged out successfully.");
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      setLoading(true);
      await login(creds.email, creds.pass);
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        setUser(res.user);
      }
    } catch (err) {
      console.error("Failed to refresh user profile:", err);
    }
  };

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        switchDemoRole,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
