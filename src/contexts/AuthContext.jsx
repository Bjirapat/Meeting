import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [menuPermissions, setMenuPermissions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const loadUserPermissions = async () => {
      if (user?.positionNo) {
        try {
          const response = await axios.get(`http://localhost:8080/accessmenus`);

          const userPermissions = response.data.filter(
            (p) => p.PNUM === user.positionNo
          );

          setMenuPermissions(userPermissions.map((p) => p.MNUM));
        } catch (error) {
          console.error("Error loading permissions:", error);
          toast.error("ไม่สามารถโหลดสิทธิ์การใช้งานได้", {
            duration: 3000,
          });
        }
      }
    };

    if (user) {
      loadUserPermissions();
    }
  }, [user]);

  const checkAuth = () => {
    try {
      const storedUser =
        localStorage.getItem("user") || sessionStorage.getItem("user");
      const storedAuth =
        localStorage.getItem("isAuthenticated") ||
        sessionStorage.getItem("isAuthenticated");

      if (storedUser && storedAuth === "true") {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } else {
        clearAuthData();
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      clearAuthData();
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isAuthenticated");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("isAuthenticated");
    setUser(null);
    setIsAuthenticated(false);
    setMenuPermissions([]);
  };

  const hasPermission = (menuNumber) => {
    if (!user || !menuPermissions.length) return false;
    return menuPermissions.includes(menuNumber);
  };

  const login = async (userData, rememberMe = false) => {
    try {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("user", JSON.stringify(userData));
      storage.setItem("isAuthenticated", "true");
      setUser(userData);
      setIsAuthenticated(true);

      const response = await axios.get(`http://localhost:8080/accessmenus`);
      const userPermissions = response.data.filter(
        (p) => p.PNUM === userData.positionNo
      );
      setMenuPermissions(userPermissions.map((p) => p.MNUM));

      toast.success(`ยินดีต้อนรับ ${userData.firstName} ${userData.lastName}`, {
        duration: 3000,
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ", {
        duration: 3000,
      });
      clearAuthData();
    }
  };

  const logout = () => {
    clearAuthData();
    toast.success("ออกจากระบบสำเร็จ", {
      duration: 3000,
    });
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
        checkAuth,
        hasPermission,
        menuPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
