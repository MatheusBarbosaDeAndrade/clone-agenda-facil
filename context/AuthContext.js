import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { apiFetch } from "services/api.js";

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadUser() {
    try {
      const data = await apiFetch("/auth/me");
      setUser(data.usuario);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUser();
  }, []);

  async function login(identificador, senha, lembrar) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: { identificador, senha, lembrar },
    });
    setUser(data.usuario);
    return data.usuario;
  }

  async function register(formData) {
    const data = await apiFetch("/auth/register", {
      method: "POST",
      body: formData,
    });
    setUser(data.usuario);
    return data.usuario;
  }

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, reloadUser: loadUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireAuth(requiredRole) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (requiredRole && user.papel !== requiredRole) {
        router.push(
          user.papel === "prestador" ? "/prestador/inicio" : "/cliente/inicio",
        );
      }
    }
  }, [user, loading, requiredRole, router]);

  return { user, loading };
}
