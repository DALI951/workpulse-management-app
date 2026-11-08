"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layers, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/LanguageSelector";
import { useApp } from "@/context/AppContext";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Route according to user role
      if (data.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else {
        router.push("/collaborator/projects");
      }
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail("admin@example.com");
    setPassword("admin123");
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-6 bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20 transition-colors">
      {/* Top Bar with Language and Theme */}
      <div className="flex items-center justify-end gap-2.5 max-w-md w-full mx-auto">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        {/* Card Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-4 transform hover:scale-105 transition-transform">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("welcomeTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 px-2">
            {t("welcomeSubtitle")}
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/60 dark:shadow-slate-950/50 border border-slate-100 dark:border-slate-800 p-6 sm:p-8 transition-colors">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                {t("emailLabel")}
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-11 rtl:pl-4 rtl:pr-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                {t("passwordLabel")}
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 rtl:pl-11 rtl:pr-11 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 text-sm transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 rtl:right-auto rtl:left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t("signIn")}</span>
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {t("quickTestCredentials")}
              </span>
              <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
                {t("clickToFill")}
              </span>
            </div>
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 text-left rtl:text-right transition flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-900 dark:group-hover:text-indigo-300">
                    {t("defaultAdmin")}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    admin@example.com • admin123
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
                →
              </span>
            </button>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-3 text-center">
              {t("collabNote")}
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright / info */}
      <div className="text-center text-xs text-slate-400 dark:text-slate-600 pb-2">
        WorkPulse &copy; 2026
      </div>
    </div>
  );
}
