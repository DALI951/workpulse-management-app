"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  FolderKanban,
  CheckCircle2,
  ListTodo,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface CollaboratorStat {
  id: string;
  username: string;
  email: string;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  projects: {
    id: string;
    name: string;
    totalTasks: number;
    completedTasks: number;
  }[];
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  projectName: string;
  collaboratorName: string;
  updatedAt: string;
  completedAt: string | null;
}

interface DashboardData {
  summary: {
    totalCollaborators: number;
    totalProjects: number;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  };
  collaborators: CollaboratorStat[];
  recentTasks: RecentTask[];
}

export default function AdminDashboardPage() {
  const { t } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading metrics...</p>
        </div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalCollaborators: 0,
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("adminDashboardTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("adminDashboardSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {t("refresh")}
          </button>
          <Link
            href="/admin/projects"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs shadow-indigo-600/20 transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {t("newProject")}
          </Link>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("totalCollaborators")}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {summary.totalCollaborators}
            </h3>
            <Link
              href="/admin/collaborators"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium mt-2"
            >
              {t("manageTeam")} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("activeProjects")}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {summary.totalProjects}
            </h3>
            <Link
              href="/admin/projects"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium mt-2"
            >
              {t("viewProjects")} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("totalTasks")}
            </p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {summary.totalTasks}
            </h3>
            <Link
              href="/admin/tasks"
              className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium mt-2"
            >
              {t("viewAllTasks")} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
            </Link>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <ListTodo className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center justify-between transition-colors">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("completedTasks")}
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {summary.completedTasks}
              </h3>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {summary.completionRate}%
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
              {t("overallCompletionRate")}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Collaborator Completed Tasks Dashboard Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              {t("completedTasksByCollab")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("liveTrackingDesc")}
            </p>
          </div>
          <Link
            href="/admin/collaborators"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t("manageCollaboratorsLink")} →
          </Link>
        </div>

        {data?.collaborators && data.collaborators.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {data.collaborators.map((c) => {
              const hasTasks = c.totalTasks > 0;
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Collaborator identity */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {c.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight truncate">
                            {c.username}
                          </h4>
                          <p className="text-xs text-slate-400 truncate max-w-[150px]">
                            {c.email}
                          </p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 shrink-0">
                        {c.totalProjects} {t("navProjects")}
                      </span>
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600 dark:text-slate-400">{t("completion")}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {c.completedTasks} / {c.totalTasks} ({c.completionRate}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${
                            c.completionRate === 100 && hasTasks
                              ? "bg-emerald-500"
                              : c.completionRate >= 50
                              ? "bg-indigo-600"
                              : c.completionRate > 0
                              ? "bg-amber-500"
                              : "bg-slate-300 dark:bg-slate-600"
                          }`}
                          style={{ width: `${hasTasks ? c.completionRate : 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Assigned Projects Breakdown */}
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                        {t("assignedProjects")}
                      </p>
                      {c.projects.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                          {t("noProjectsAssigned")}
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {c.projects.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800"
                            >
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                                {p.name}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                  p.totalTasks > 0 && p.completedTasks === p.totalTasks
                                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                }`}
                              >
                                {p.completedTasks}/{p.totalTasks}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400">
                      {c.completedTasks === c.totalTasks && hasTasks
                        ? t("allTasksCompleted")
                        : `${c.totalTasks - c.completedTasks} ${t("tasksRemaining")}`}
                    </span>
                    <Link
                      href={`/admin/projects`}
                      className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {t("viewProjects")} →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t("noCollaboratorsYet")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {t("noCollaboratorsDesc")}
            </p>
            <Link
              href="/admin/collaborators"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {t("addFirstCollaborator")}
            </Link>
          </div>
        )}
      </div>

      {/* Recent Tasks List */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
              {t("recentTaskActivity")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("latestTaskUpdates")}
            </p>
          </div>
          <Link
            href="/admin/tasks"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t("allTasksLink")} →
          </Link>
        </div>

        {data?.recentTasks && data.recentTasks.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.recentTasks.map((tItem) => (
              <div
                key={tItem.id}
                className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      tItem.status === "COMPLETED"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                        : tItem.status === "IN_PROGRESS"
                        ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {tItem.status === "COMPLETED" ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{tItem.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <span>{t("projectLabel")}: <strong className="text-slate-700 dark:text-slate-300">{tItem.projectName}</strong></span>
                      <span>•</span>
                      <span>{t("collabLabel")}: <strong className="text-slate-700 dark:text-slate-300">{tItem.collaboratorName}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 sm:self-center">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      tItem.status === "COMPLETED"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : tItem.status === "IN_PROGRESS"
                        ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {tItem.status === "COMPLETED"
                      ? t("completed")
                      : tItem.status === "IN_PROGRESS"
                      ? t("inProgress")
                      : t("pending")}
                  </span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">
                    {new Date(tItem.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
            {t("noTasksYet")}
          </div>
        )}
      </div>
    </div>
  );
}
