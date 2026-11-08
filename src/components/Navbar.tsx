"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Layers,
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import LanguageSelector from "./LanguageSelector";
import { useApp } from "@/context/AppContext";

interface NavbarProps {
  user: {
    id: string;
    username: string;
    email: string;
    role: "ADMIN" | "COLLABORATOR";
  };
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useApp();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error("Logout failed:", e);
      setIsLoggingOut(false);
    }
  };

  const adminLinks = [
    { href: "/admin/dashboard", label: t("navDashboard"), icon: LayoutDashboard },
    { href: "/admin/collaborators", label: t("navCollaborators"), icon: Users },
    { href: "/admin/projects", label: t("navProjects"), icon: FolderKanban },
    { href: "/admin/tasks", label: t("navTasks"), icon: CheckSquare },
  ];

  const collaboratorLinks = [
    { href: "/collaborator/projects", label: t("navMyProjects"), icon: FolderKanban },
  ];

  const links = user.role === "ADMIN" ? adminLinks : collaboratorLinks;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Desktop Nav */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              href={user.role === "ADMIN" ? "/admin/dashboard" : "/collaborator/projects"}
              className="flex items-center gap-2.5 group shrink-0"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight tracking-tight">
                  {t("brandName")}
                </span>
                <span className="text-[10px] uppercase font-semibold text-indigo-600 dark:text-indigo-400 tracking-wider">
                  {user.role === "ADMIN" ? t("adminPortal") : t("collabWorkspace")}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"}`} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Controls: Language, Theme, Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Selector */}
            <LanguageSelector />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Profile Badge (Desktop) */}
            <div className="hidden lg:flex items-center gap-3 pl-3 rtl:pl-0 rtl:pr-3 border-l rtl:border-l-0 rtl:border-r border-slate-200 dark:border-slate-800">
              <div className="text-right rtl:text-left">
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  {user.username}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-tight truncate max-w-[140px]">
                  {user.email}
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  user.role === "ADMIN"
                    ? "bg-violet-100 dark:bg-violet-950/70 text-violet-800 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
                    : "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {user.role === "ADMIN" ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                    {t("admin")}
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    {t("collaborator")}
                  </>
                )}
              </div>
            </div>

            {/* Desktop Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900 transition-colors cursor-pointer"
              title={t("signOut")}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? t("signingOut") : t("signOut")}</span>
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown / Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 dark:border-slate-800 space-y-2 animate-fadeIn">
            {/* User Profile Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user.username}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 uppercase">
                {user.role === "ADMIN" ? t("admin") : t("collaborator")}
              </span>
            </div>

            {/* Navigation links */}
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isLoggingOut ? t("signingOut") : t("signOut")}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
