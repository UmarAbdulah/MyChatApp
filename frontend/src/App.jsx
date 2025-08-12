import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import NavBar from "./components/NavBar";
import { useAuthStore } from "./store/useAuth.store";
import { Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { Loader } from "lucide-react";

const App = () => {
  const authUser = useAuthStore((state) => state.authUser);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const logedIn = useAuthStore((state) => state.logedIn);

  useEffect(() => {
    const handleAuth = async () => {
      await checkAuth();
    };
    handleAuth();
  }, []);

  if (!authUser && isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/signup"
          element={authUser ? <Navigate to="/" /> : <SignUpPage />}
        />
        <Route
          path="/login"
          element={authUser ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/profile"
          element={
            authUser && !isCheckingAuth ? (
              <ProfilePage />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
