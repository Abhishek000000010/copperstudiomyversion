import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../lib/api";
import { AuthContext, STORAGE_KEY } from "./authStore";

function readStoredAuth() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function isNetworkError(err) {
  if (err?.isNetworkError) return true;
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("failed to fetch") ||
    msg.includes("load failed") ||
    msg.includes("networkerror") ||
    msg.includes("backend unavailable")
  );
}

function makeDemoSession(role) {
  return {
    token: "demo-local-bypass-token",
    user: {
      id: "demo-" + role,
      name: role === "superadmin" ? "Super Admin" : "Demo Client",
      email: role === "superadmin" ? "admin@thecopperstudio.com" : "client@thecopperstudio.com",
      phone: "",
      company: "The Copper Studio",
      jobTitle: role === "superadmin" ? "Super Admin" : "Client",
      role,
      status: "active",
      preferences: {},
      _isDemo: true,
    },
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readStoredAuth);
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState("");

  const saveSession = (nextSession) => {
    setSession(nextSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  };

  // Auto-fetch client projects when logged in
  useEffect(() => {
    if (session?.token && session?.user?.role === "user") {
      if (session.user._isDemo) {
        const mockProjects = [
          {
            _id: "demo-proj-1",
            name: "Zara Retail App",
            description: "Workspace for Zara Retail App Design & UI Layouts.",
            packageName: "Enterprise Studio",
            status: "in_progress",
            progress: 85,
            expectedEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            stages: [
              { name: "Onboarding & Discovery", status: "completed" },
              { name: "Design Phase", status: "in_progress" },
              { name: "Development Phase", status: "pending" },
              { name: "Review & Refinement", status: "pending" },
              { name: "Final Delivery & Launch", status: "pending" }
            ],
            orderId: "demo-order-1",
            meetingLink: "https://meet.google.com/abc-defg-hij"
          },
          {
            _id: "demo-proj-2",
            name: "CloudPOS Dashboard",
            description: "Workspace for CloudPOS Dashboard UI development.",
            packageName: "Growth Studio",
            status: "in_progress",
            progress: 60,
            expectedEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            stages: [
              { name: "Onboarding & Discovery", status: "completed" },
              { name: "Design Phase", status: "completed" },
              { name: "Development Phase", status: "in_progress" },
              { name: "Review & Refinement", status: "pending" },
              { name: "Final Delivery & Launch", status: "pending" }
            ],
            orderId: "demo-order-2",
            meetingLink: "https://meet.google.com/xyz-pdqr-wst"
          }
        ];
        setProjects(mockProjects);
        if (!activeProjectId) {
          setActiveProjectId(mockProjects[0]._id);
        }
      } else {
        apiGet("/api/client/projects", session.token)
          .then((data) => {
            setProjects(data);
            if (data.length > 0) {
              // Set active project if none or if previous is no longer in data
              const exists = data.some((p) => p._id === activeProjectId);
              if (!exists) {
                setActiveProjectId(data[0]._id);
              }
            } else {
              setActiveProjectId("");
            }
          })
          .catch((err) => {
            console.error("Failed to load projects:", err);
          });
      }
    } else {
      setProjects([]);
      setActiveProjectId("");
    }
  }, [session?.token, session?.user?.role, session?.user?._isDemo, activeProjectId]);

  const value = useMemo(() => ({
    user: session?.user || null,
    token: session?.token || "",
    isAuthenticated: Boolean(session?.token && session?.user),
    isDemo: Boolean(session?.user?._isDemo),
    projects,
    activeProjectId,
    setActiveProjectId,
    async login(credentials) {
      try {
        const nextSession = await apiPost("/api/auth/login", credentials);
        saveSession(nextSession);
        return nextSession;
      } catch (err) {
        if (isNetworkError(err)) {
          const demoSession = makeDemoSession(credentials.role || "superadmin");
          saveSession(demoSession);
          return demoSession;
        }
        throw err;
      }
    },
    async setPassword(payload) {
      const nextSession = await apiPost("/api/auth/set-password", payload);
      saveSession(nextSession);
      return nextSession;
    },
    async resetPassword(payload) {
      const nextSession = await apiPost("/api/auth/reset-password", payload);
      saveSession(nextSession);
      return nextSession;
    },
    async forgotPassword(payload) {
      return apiPost("/api/auth/forgot-password", payload);
    },
    async refresh() {
      if (!session?.token) return null;
      if (session?.user?._isDemo) return session;
      try {
        const data = await apiGet("/api/auth/me", session.token);
        const nextSession = { ...session, user: data.user };
        saveSession(nextSession);
        return nextSession;
      } catch (err) {
        if (isNetworkError(err)) return session;
        throw err;
      }
    },
    updateUser(updatedUser) {
      const nextSession = { ...session, user: { ...session.user, ...updatedUser } };
      saveSession(nextSession);
    },
    logout() {
      setSession(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }), [session, projects, activeProjectId]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
