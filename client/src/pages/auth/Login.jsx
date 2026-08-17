import React, { useState, useEffect } from "react";
import api from "../../api/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import AuthLayout from "../../layouts/AuthLayout";
import Input from "../../components/common/Input";
import PasswordInput from "../../components/common/PasswordInput";
import Button from "../../components/common/Button";
import { User, Lock, ArrowRight, X, ShieldAlert, UserPlus, Globe } from "lucide-react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../../validation/loginSchema";

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, getRoleDashboard } = useAuth();
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [customEmailMode, setCustomEmailMode] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState("");

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleUpper = (user.role || "").toUpperCase();
      const targetDashboard = getRoleDashboard(roleUpper);
      navigate(targetDashboard, { replace: true });
    }
  }, [isAuthenticated, user, getRoleDashboard, navigate]);

  const mockGoogleAccounts = [
    {
      name: "Melbin Sabu",
      email: "melbinsabu600@gmail.com",
      avatarBg: "bg-emerald-700",
      initials: "MS",
    },
    {
      name: "Melbin Sabu",
      email: "melbinsabu2027@mca.ajce.in",
      avatarBg: "bg-purple-700",
      initials: "M",
    },
  ];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
  });

  const onSubmit = async (data) => {
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const { token, user } = response.data;

      // Update AuthContext & localStorage
      login(token, user);

      const roleUpper = (user.role || "").toUpperCase();

      // First login check (Bypassed for ADMINISTRATOR)
      if (user.isFirstLogin && roleUpper !== "ADMINISTRATOR") {
        navigate("/change-password", { replace: true });
        return;
      }

      // Role based routing with replace: true
      const targetDashboard = getRoleDashboard(roleUpper);
      navigate(targetDashboard, { replace: true });
    } catch (error) {
      alert(error.response?.data?.message || "Login Failed. Please verify your credentials.");
    }
  };

  const handleSelectGoogleAccount = async (account) => {
    const emailToUse = typeof account === "string" ? account : account.email;
    const nameToUse = typeof account === "string" ? account.split("@")[0] : account.name;

    if (!emailToUse || !emailToUse.includes("@")) {
      setGoogleError("Please enter a valid Google email address");
      return;
    }

    try {
      setGoogleError("");
      setGoogleLoading(true);

      const response = await api.post("/auth/google-login", {
        email: emailToUse.trim(),
        name: nameToUse,
        googleId: `google_${Date.now()}`,
      });

      const { token, user } = response.data;

      // Update AuthContext & localStorage
      login(token, user);

      setShowGoogleChooser(false);

      // Role based routing with replace: true
      const roleUpper = (user.role || "").toUpperCase();
      const targetDashboard = getRoleDashboard(roleUpper);
      navigate(targetDashboard, { replace: true });
    } catch (error) {
      setGoogleError(error.response?.data?.message || "Google Sign-In Failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to access your dashboard & analytics">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email / Admission Number"
          placeholder="e.g. admin@edusphere.com or EDU2026001"
          register={register("email")}
          error={errors.email}
          icon={User}
          className="text-white"
        />

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          register={register("password")}
          error={errors.password}
          icon={Lock}
        />

        <div className="flex items-center justify-between text-xs py-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-700 bg-slate-800 text-purple-600 focus:ring-purple-500 focus:ring-offset-slate-900 w-4 h-4 cursor-pointer"
            />
            <span>Remember this device</span>
          </label>

          <a
            href="/forgot-password"
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors"
          >
            Forgot Password?
          </a>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 mt-4"
          icon={isSubmitting ? undefined : ArrowRight}
        >
          {isSubmitting ? "Authenticating..." : "Sign In to EduSphere"}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0f172a] px-3 text-slate-400 font-bold tracking-widest text-[10px]">
            Or continue with
          </span>
        </div>
      </div>

      {/* Official Google Sign-In Auth Button */}
      <button
        type="button"
        onClick={() => {
          setGoogleError("");
          setCustomEmailMode(false);
          setShowGoogleChooser(true);
        }}
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 hover:border-slate-600 text-slate-200 font-bold text-xs transition-all duration-200 hover:shadow-lg shadow-purple-950/20 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:opacity-50 cursor-pointer"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Sign in with Google Account</span>
      </button>

      {/* AUTHENTIC GOOGLE ACCOUNT CHOOSER MODAL (Matching Google Accounts UI) */}
      {showGoogleChooser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-[440px] bg-[#0E0E0E] text-white border border-[#222222] rounded-2xl p-7 shadow-2xl font-sans">
            {/* Top Close Button */}
            <button
              onClick={() => setShowGoogleChooser(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Google Header */}
            <div className="flex items-center gap-2.5 mb-6">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-300">Sign in with Google</span>
            </div>

            {/* Title & Subtitle */}
            <h2 className="text-3xl font-normal tracking-tight text-white mb-1">
              Choose an account
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              to continue to <span className="text-blue-400 font-medium">edusphere</span>
            </p>

            {googleError && (
              <div className="mb-4 p-3 text-xs text-red-300 bg-red-950/60 border border-red-800/60 rounded-xl flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                <span>{googleError}</span>
              </div>
            )}

            {!customEmailMode ? (
              /* Account Chooser List */
              <div className="space-y-1">
                {mockGoogleAccounts.map((acc, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectGoogleAccount(acc)}
                    disabled={googleLoading}
                    className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#1C1C1C] border border-transparent hover:border-gray-800 transition text-left cursor-pointer group"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${acc.avatarBg} text-white flex items-center justify-center font-bold text-sm shrink-0`}
                    >
                      {acc.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white group-hover:text-blue-300 transition truncate">
                        {acc.name}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{acc.email}</div>
                    </div>
                  </button>
                ))}

                <div className="border-t border-gray-800/80 my-2"></div>

                {/* Use Another Account Option */}
                <button
                  type="button"
                  onClick={() => setCustomEmailMode(true)}
                  className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-[#1C1C1C] transition text-left cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1C1C1C] border border-gray-700 text-gray-300 flex items-center justify-center shrink-0 group-hover:border-blue-400 transition">
                    <UserPlus className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="text-sm font-medium text-gray-200 group-hover:text-blue-300 transition">
                    Use another account
                  </div>
                </button>
              </div>
            ) : (
              /* Custom Email Input Mode */
              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs text-gray-400 mb-1 font-medium">
                    Enter your Google email address:
                  </label>
                  <input
                    type="email"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    placeholder="email@gmail.com"
                    autoFocus
                    className="w-full bg-[#1C1C1C] border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCustomEmailMode(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-800 text-gray-400 text-xs font-semibold hover:bg-gray-800 transition"
                  >
                    Back to Accounts
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectGoogleAccount(customEmail)}
                    disabled={googleLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md disabled:opacity-50"
                  >
                    {googleLoading ? "Signing in..." : "Continue"}
                  </button>
                </div>
              </div>
            )}

            {/* Footer matching Google chooser */}
            <div className="mt-8 pt-4 border-t border-gray-800/60 flex items-center justify-between text-[11px] text-gray-500">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-gray-500" /> English (United States)
              </span>
              <div className="flex gap-3">
                <span className="hover:underline cursor-pointer">Help</span>
                <span className="hover:underline cursor-pointer">Privacy</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}

export default Login;
