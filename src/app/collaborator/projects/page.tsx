"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FolderKanban,
  CheckSquare,
  ArrowRight,
  Sparkles,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface CollaboratorProject {
  id: string;
  name: string;
  description: string | null;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export default function CollaboratorProjectsPage() {
  const { t } = useApp();
  const [projects, setProjects] = useState<CollaboratorProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMyProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load projects");
      }
    } catch {
      setError("Network error loading projects");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProjects();
  }, [fetchMyProjects]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMyProjects();
  };

  let totalAssignedTasks = 0;
  let totalCompletedTasks = 0;
  projects.forEach((p) => {
    totalAssignedTasks += p.totalTasks;
    totalCompletedTasks += p.completedTasks;
  });
  const overallRate =
    totalAssignedTasks > 0
      ? Math.round((totalCompletedTasks / totalAssignedTasks) * 100)
      : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/15 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {t("collabWorkspace")}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("collabWorkspaceTitle")}
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm max-w-xl">
            {t("collabWorkspaceSubtitle")}
          </p>
        </div>

        {/* Quick summary box in banner */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-center gap-5 self-start md:self-auto shrink-0">
          <div>
            <p className="text-[11px] uppercase font-semibold text-indigo-200">
              {t("tasksProgress")}
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold">{totalCompletedTasks}/{totalAssignedTasks}</span>
              <span className="text-xs font-semibold text-emerald-300">({overallRate}%)</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
          </div>
        </div>
      </div>

      {/* Header and Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {t("yourProjects")}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {projects.length} {t("projectsAssignedCount")}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {t("refresh")}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Projects List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading your assigned projects...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {projects.map((project) => {
            const isCompleted =
              project.totalTasks > 0 && project.completedTasks === project.totalTasks;
            return (
              <div
                key={project.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs hover:shadow-md transition p-5 sm:p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        isCompleted
                          ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
                          : project.progress > 0
                          ? "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {isCompleted
                        ? t("completed")
                        : project.progress > 0
                        ? t("inProgress")
                        : t("pending")}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {project.totalTasks} {t("navTasks")}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-lg group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1 mb-2">
                    {project.name}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 min-h-[48px] mb-5">
                    {project.description || "No project description provided."}
                  </p>

                  {/* Progress section */}
                  <div className="space-y-2 mb-4 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                        {t("completion")}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {project.completedTasks} / {project.totalTasks} ({project.progress}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-emerald-500"
                            : project.progress > 0
                            ? "bg-indigo-600"
                            : "bg-slate-300 dark:bg-slate-600"
                        }`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <Link
                  href={`/collaborator/projects/${project.id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-700 dark:text-indigo-300 hover:text-white dark:hover:text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 group-hover:bg-indigo-600 group-hover:text-white cursor-pointer shadow-2xs"
                >
                  <span>{t("enterProjectTasks")}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 text-center space-y-3">
          <FolderKanban className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {t("noAssignedProjectsTitle")}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {t("noAssignedProjectsDesc")}
          </p>
        </div>
      )}
    </div>
  );
}
