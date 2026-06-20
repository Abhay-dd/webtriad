import { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "../services/api/client";

const AuthContext = createContext(null);

const TOKEN_KEY = "triad_token";
const USER_KEY  = "triad_user";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Decode the JWT payload (base64url) without verification.
 * Verification is the server's job; we only read `exp` here so we can
 * avoid sending obviously-expired tokens.
 */
function jwtExpiry(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const expMs = jwtExpiry(token);
  if (!expMs) return true; // malformed token — treat as expired
  return Date.now() >= expMs;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // sessionStorage: cleared automatically when the browser tab/session closes.
      // This is safer than localStorage for admin credentials because it limits
      // the XSS persistence window — a stolen token dies with the session.
      const raw = sessionStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const persist = useCallback((token, userData) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const clear = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    // Also clean up any old localStorage tokens from previous versions
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const login = async (email, password) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    persist(data.access_token, data.user);
    return data.user;
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      /* ignore network errors on logout */
    }
    clear();
  };

  // On mount: validate the stored token against the server, or try to silent-refresh
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);

    if (!token) {
      // Try silent refresh on mount
      apiClient
        .post("/auth/refresh")
        .then((r) => {
          persist(r.data.access_token, r.data.user);
        })
        .catch(() => {
          clear();
        })
        .finally(() => setLoading(false));
      return;
    }

    // Client-side expiry guard — avoids a round-trip if we already know it's dead
    if (isTokenExpired(token)) {
      // Token is expired; try refreshing
      apiClient
        .post("/auth/refresh")
        .then((r) => {
          persist(r.data.access_token, r.data.user);
        })
        .catch(() => {
          clear();
        })
        .finally(() => setLoading(false));
      return;
    }

    apiClient
      .get("/auth/me")
      .then((r) => {
        setUser(r.data);
        sessionStorage.setItem(USER_KEY, JSON.stringify(r.data));
      })
      .catch(() => {
        // If auth/me fails, try refresh
        apiClient
          .post("/auth/refresh")
          .then((r) => {
            persist(r.data.access_token, r.data.user);
          })
          .catch(() => {
            clear();
          });
      })
      .finally(() => setLoading(false));
  }, [clear, persist]);

  // Proactive refresh check: if the tab stays open, refresh before expiry
  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const expMs = jwtExpiry(token);
    if (!expMs) return;

    const bufferMs = 60 * 1000; // 1 minute buffer
    const msUntilRefresh = expMs - Date.now() - bufferMs;

    if (msUntilRefresh <= 0) {
      apiClient
        .post("/auth/refresh")
        .then((r) => {
          persist(r.data.access_token, r.data.user);
        })
        .catch(() => {
          clear();
        });
      return;
    }

    const timer = setTimeout(() => {
      apiClient
        .post("/auth/refresh")
        .then((r) => {
          persist(r.data.access_token, r.data.user);
        })
        .catch(() => {
          clear();
        });
    }, msUntilRefresh);

    return () => clearTimeout(timer);
  }, [user, clear, persist]);

  // Axios response interceptor to auto-refresh on 401
  useEffect(() => {
    const interceptor = apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url.includes("/auth/login") &&
          !originalRequest.url.includes("/auth/refresh")
        ) {
          originalRequest._retry = true;
          try {
            const { data } = await apiClient.post("/auth/refresh");
            persist(data.access_token, data.user);
            originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
            return apiClient(originalRequest);
          } catch (refreshError) {
            clear();
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiClient.interceptors.response.eject(interceptor);
    };
  }, [persist, clear]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
