"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  FolderKanban,
  CheckSquare,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/context/AppContext";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  responsibleId: string;
  responsible: {
    username: string;
    email: string;
  };
  tasks: Task[];
}

export default function CollaboratorProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useApp();
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;

  const [project, setProject] = useState<ProjectData | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED">("ALL");

  const fetchProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setTasks(data.project.tasks || []);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to load project");
      }
    } catch {
      setError("Network error loading project");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateTaskStatus = async (
    taskId: string,
    newStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  ) => {
    setUpdatingTaskId(taskId);

    setTasks((prev) =>
      prev.map((tItem) =>
        tItem.id === taskId
          ? {
              ...tItem,
              status: newStatus,
              completedAt: newStatus === "COMPLETED" ? new Date().toISOString() : null,
            }
          : tItem
      )
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update task status");
      }
    } catch (err) {
      console.error(err);
      fetchProject();
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-16 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading project details and tasks...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-4">
        <Link
          href="/collaborator/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("backToProjects")}
        </Link>
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error || "Project could not be found."}</span>
        </div>
      </div>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((tItem) => tItem.status === "COMPLETED").length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const filteredTasks = tasks.filter((tItem) => {
    if (filter === "ALL") return true;
    return tItem.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/collaborator/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {t("backToProjects")}
        </Link>
      </div>

      {/* Project Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              <FolderKanban className="w-3.5 h-3.5" /> {t("assignedProjectBadge")}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {project.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {project.description || "No description provided for this project."}
            </p>
          </div>

          {/* Progress Counter Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800 min-w-[200px] shrink-0 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-400">{t("tasksProgress")}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {completedTasks} / {totalTasks} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  progressPercent === 100 && totalTasks > 0
                    ? "bg-emerald-500"
                    : "bg-indigo-600"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {progressPercent === 100 && totalTasks > 0 && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {t("allTasksCompletedGreatWork")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Task Filters & Counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"] as const).map((status) => {
            const count =
              status === "ALL"
                ? tasks.length
                : tasks.filter((tItem) => tItem.status === status).length;
            const isActive = filter === status;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
                }`}
              >
                {status === "ALL"
                  ? t("all")
                  : status === "PENDING"
                  ? t("pending")
                  : status === "IN_PROGRESS"
                  ? t("inProgress")
                  : t("completed")}{" "}
                ({count})
              </button>
            );
          })}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t("clickStatusToUpdate")}
        </p>
      </div>

      {/* Task List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-3">
          {filteredTasks.map((taskItem) => {
            const isCompleted = taskItem.status === "COMPLETED";
            const isUpdating = updatingTaskId === taskItem.id;

            return (
              <div
                key={taskItem.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCompleted
                    ? "border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20"
                    : "border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                        taskItem.status === "COMPLETED"
                          ? "bg-emerald-500"
                          : taskItem.status === "IN_PROGRESS"
                          ? "bg-blue-500"
                          : "bg-amber-400"
                      }`}
                    />
                    <h3
                      className={`font-semibold text-sm sm:text-base leading-snug ${
                        isCompleted ? "text-slate-500 dark:text-slate-400 line-through" : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {taskItem.title}
                    </h3>
                  </div>

                  {taskItem.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 pl-4.5 rtl:pl-0 rtl:pr-4.5 leading-relaxed">
                      {taskItem.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pl-4.5 rtl:pl-0 rtl:pr-4.5 text-[11px] text-slate-400 dark:text-slate-500">
                    <span>{t("created")}: {new Date(taskItem.createdAt).toLocaleDateString()}</span>
                    {taskItem.completedAt && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ {t("completed")}: {new Date(taskItem.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 self-start md:self-center shrink-0 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {/* Pending Button */}
                  <button
                    onClick={() => updateTaskStatus(taskItem.id, "PENDING")}
                    disabled={isUpdating}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      taskItem.status === "PENDING"
                        ? "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-2xs border border-slate-200 dark:border-slate-700"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t("pending")}</span>
                  </button>

                  {/* In Progress Button */}
                  <button
                    onClick={() => updateTaskStatus(taskItem.id, "IN_PROGRESS")}
                    disabled={isUpdating}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      taskItem.status === "IN_PROGRESS"
                        ? "bg-blue-600 text-white shadow-2xs"
                        : "text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                    }`}
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>{t("inProgress")}</span>
                  </button>

                  {/* Completed Button */}
                  <button
                    onClick={() => updateTaskStatus(taskItem.id, "COMPLETED")}
                    disabled={isUpdating}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      taskItem.status === "COMPLETED"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{t("completed")}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 text-center space-y-3">
          <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {filter === "ALL" ? t("noTasksInProject") : `No ${filter.toLowerCase()} tasks`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {filter === "ALL"
              ? t("noTasksInProjectDesc")
              : "No tasks match the selected filter."}
          </p>
        </div>
      )}
    </div>
  );
}
