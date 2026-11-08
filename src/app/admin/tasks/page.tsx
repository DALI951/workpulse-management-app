"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckSquare,
  Plus,
  Edit2,
  Trash2,
  FolderKanban,
  CheckCircle2,
  Clock,
  PlayCircle,
  AlertCircle,
  Filter,
} from "lucide-react";
import Modal from "@/components/Modal";
import { useApp } from "@/context/AppContext";

interface ProjectOption {
  id: string;
  name: string;
  responsible: {
    id: string;
    username: string;
  };
}

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  projectId: string;
  project: {
    id: string;
    name: string;
    responsible: {
      id: string;
      username: string;
    };
  };
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

function TasksContent() {
  const { t } = useApp();
  const searchParams = useSearchParams();
  const initialProjectId = searchParams.get("projectId") || "";

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedFilterProject, setSelectedFilterProject] = useState(initialProjectId);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_PROGRESS" | "PENDING" | "COMPLETED">("ALL");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formProjectId, setFormProjectId] = useState("");
  const [editFormStatus, setEditFormStatus] = useState<"PENDING" | "IN_PROGRESS" | "COMPLETED">("PENDING");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error("Error loading projects:", e);
    }
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const url = selectedFilterProject
        ? `/api/tasks?projectId=${selectedFilterProject}`
        : "/api/tasks";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to load tasks");
      }
    } catch {
      setErrorMessage("Network error loading tasks");
    } finally {
      setLoading(false);
    }
  }, [selectedFilterProject]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const openAddModal = () => {
    setFormTitle("");
    setFormDescription("");
    if (selectedFilterProject) {
      setFormProjectId(selectedFilterProject);
    } else if (projects.length > 0) {
      setFormProjectId(projects[0].id);
    } else {
      setFormProjectId("");
    }
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (taskItem: TaskItem) => {
    setSelectedTask(taskItem);
    setFormTitle(taskItem.title);
    setFormDescription(taskItem.description || "");
    setFormProjectId(taskItem.projectId);
    setEditFormStatus(taskItem.status);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (taskItem: TaskItem) => {
    setSelectedTask(taskItem);
    setIsDeleteModalOpen(true);
  };

  // Create Task - Automatically sets status to PENDING (no status selection needed by admin)
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    if (!formProjectId) {
      setFormError("Every task must belong to a project. Please select a project.");
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          projectId: formProjectId,
          status: "PENDING", // Always defaults to PENDING
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create task");
      }

      setSuccessMessage(`Task "${data.task.title}" created successfully!`);
      setIsAddModalOpen(false);
      fetchTasks();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Error creating task");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          description: formDescription,
          projectId: formProjectId,
          status: editFormStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update task");
      }

      setSuccessMessage(`Task "${data.task.title}" updated successfully!`);
      setIsEditModalOpen(false);
      fetchTasks();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Error updating task");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete task");
      }

      setSuccessMessage("Task deleted successfully.");
      setIsDeleteModalOpen(false);
      fetchTasks();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter tasks by status tab
  const filteredTasks = tasks.filter((tItem) => {
    if (statusFilter === "ALL") return true;
    return tItem.status === statusFilter;
  });

  const inProgressCount = tasks.filter((tItem) => tItem.status === "IN_PROGRESS").length;
  const completedCount = tasks.filter((tItem) => tItem.status === "COMPLETED").length;
  const pendingCount = tasks.filter((tItem) => tItem.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {t("tasksManagementTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("tasksManagementSubtitle")}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t("addTask")}
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Status Filter Tabs (ensures IN PROGRESS tasks are never invisible!) */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setStatusFilter("ALL")}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          {t("allTasksOption")} ({tasks.length})
        </button>

        {/* IN PROGRESS TAB */}
        <button
          onClick={() => setStatusFilter("IN_PROGRESS")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            statusFilter === "IN_PROGRESS"
              ? "bg-blue-600 text-white shadow-2xs"
              : "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60"
          }`}
        >
          <PlayCircle className="w-3.5 h-3.5" />
          <span>{t("inProgress")} ({inProgressCount})</span>
        </button>

        {/* PENDING TAB */}
        <button
          onClick={() => setStatusFilter("PENDING")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            statusFilter === "PENDING"
              ? "bg-amber-500 text-white shadow-2xs"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{t("pending")} ({pendingCount})</span>
        </button>

        {/* COMPLETED TAB */}
        <button
          onClick={() => setStatusFilter("COMPLETED")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-600 text-white shadow-2xs"
              : "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60"
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t("completed")} ({completedCount})</span>
        </button>
      </div>

      {/* Project Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>{t("filterByProject")}</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedFilterProject}
            onChange={(e) => setSelectedFilterProject(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">{t("allProjectsOption")} ({projects.length})</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {selectedFilterProject && (
            <button
              onClick={() => setSelectedFilterProject("")}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 font-medium cursor-pointer"
            >
              {t("clearFilter")}
            </button>
          )}
        </div>
      </div>

      {/* Tasks Table / Cards */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading tasks...</p>
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTasks.map((taskItem) => (
              <div
                key={taskItem.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-4 shadow-2xs space-y-3 ${
                  taskItem.status === "IN_PROGRESS"
                    ? "border-blue-200 dark:border-blue-900/60 bg-blue-50/10 dark:bg-blue-950/10"
                    : taskItem.status === "COMPLETED"
                    ? "border-emerald-200 dark:border-emerald-900/60"
                    : "border-slate-100 dark:border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span
                      className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                        taskItem.status === "COMPLETED"
                          ? "bg-emerald-500"
                          : taskItem.status === "IN_PROGRESS"
                          ? "bg-blue-500 ring-4 ring-blue-500/20 animate-pulse"
                          : "bg-amber-400"
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">
                        {taskItem.title}
                      </p>
                      {taskItem.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {taskItem.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(taskItem)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(taskItem)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                    {taskItem.project.name}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1 ${
                      taskItem.status === "COMPLETED"
                        ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                        : taskItem.status === "IN_PROGRESS"
                        ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {taskItem.status === "IN_PROGRESS" && <PlayCircle className="w-3 h-3" />}
                    {taskItem.status === "COMPLETED" && <CheckCircle2 className="w-3 h-3" />}
                    {taskItem.status === "PENDING" && <Clock className="w-3 h-3" />}
                    {taskItem.status === "COMPLETED"
                      ? t("completed")
                      : taskItem.status === "IN_PROGRESS"
                      ? t("inProgress")
                      : t("pending")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
            <div className="overflow-x-auto">
              <table className="w-full text-left rtl:text-right border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-6">{t("taskTitleLabel")}</th>
                    <th className="py-3.5 px-6">{t("projectLabel")}</th>
                    <th className="py-3.5 px-6">{t("collabLabel")}</th>
                    <th className="py-3.5 px-6">{t("status")}</th>
                    <th className="py-3.5 px-6">{t("updated")}</th>
                    <th className="py-3.5 px-6 text-right rtl:text-left">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredTasks.map((taskItem) => (
                    <tr
                      key={taskItem.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${
                        taskItem.status === "IN_PROGRESS"
                          ? "bg-blue-50/20 dark:bg-blue-950/10"
                          : ""
                      }`}
                    >
                      <td className="py-4 px-6 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                              taskItem.status === "COMPLETED"
                                ? "bg-emerald-500"
                                : taskItem.status === "IN_PROGRESS"
                                ? "bg-blue-500 ring-4 ring-blue-500/20 animate-pulse"
                                : "bg-amber-400"
                            }`}
                          />
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                              {taskItem.title}
                            </p>
                            {taskItem.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                {taskItem.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                          <span>{taskItem.project.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                          {taskItem.project.responsible.username}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            taskItem.status === "COMPLETED"
                              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                              : taskItem.status === "IN_PROGRESS"
                              ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {taskItem.status === "COMPLETED" ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : taskItem.status === "IN_PROGRESS" ? (
                            <PlayCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {taskItem.status === "COMPLETED"
                            ? t("completed")
                            : taskItem.status === "IN_PROGRESS"
                            ? t("inProgress")
                            : t("pending")}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(taskItem.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          <button
                            onClick={() => openEditModal(taskItem)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title={t("edit")}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(taskItem)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title={t("delete")}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
              {statusFilter !== "ALL"
                ? `No tasks with status ${statusFilter.toLowerCase()}`
                : t("noTasksFoundTitle")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {statusFilter !== "ALL"
                ? "Try selecting 'All Tasks' or a different filter."
                : t("noTasksFoundDesc")}
            </p>
          </div>
          {statusFilter !== "ALL" ? (
            <button
              onClick={() => setStatusFilter("ALL")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
            >
              Show All Tasks
            </button>
          ) : (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t("addFirstTask")}
            </button>
          )}
        </div>
      )}

      {/* Add Task Modal (NOTE: Status is NOT selectable when creating, as requested!) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t("addTaskModalTitle")}
        description={t("addTaskModalDesc")}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("taskTitleLabel")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Design landing page mockup"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("taskDescLabel")}
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Detailed instructions or acceptance criteria..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Project Selector (MANDATORY REQUIREMENT) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("projectBelongsToLabel")} <span className="text-rose-500">*</span>
            </label>

            {projects.length > 0 ? (
              <select
                required
                value={formProjectId}
                onChange={(e) => setFormProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="" disabled>
                  {t("selectProjectPrompt")}
                </option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({t("leadLabel")}: {p.responsible.username})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs space-y-2">
                <p className="font-semibold">No projects available!</p>
                <Link
                  href="/admin/projects"
                  className="inline-block px-3 py-1.5 bg-amber-600 text-white rounded-lg font-semibold"
                >
                  Create Project →
                </Link>
              </div>
            )}
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={formSubmitting || !formProjectId}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              {formSubmitting ? "..." : t("saveTask")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal (Admin can still adjust status if needed in case of error) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t("editTaskModalTitle")}
        description={t("editTaskModalDesc")}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("taskTitleLabel")}
            </label>
            <input
              type="text"
              required
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("taskDescLabel")}
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("projectBelongsToLabel")}
            </label>
            <select
              required
              value={formProjectId}
              onChange={(e) => setFormProjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({t("leadLabel")}: {p.responsible.username})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("initialStatusLabel")}
            </label>
            <select
              value={editFormStatus}
              onChange={(e) =>
                setEditFormStatus(e.target.value as "PENDING" | "IN_PROGRESS" | "COMPLETED")
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="PENDING">{t("pending")}</option>
              <option value="IN_PROGRESS">{t("inProgress")}</option>
              <option value="COMPLETED">{t("completed")}</option>
            </select>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition flex items-center gap-1.5 cursor-pointer"
            >
              {formSubmitting ? "..." : t("saveChanges")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Task Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t("deleteTaskTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("deleteTaskConfirm")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">{selectedTask?.title}</strong>?
          </p>
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              disabled={formSubmitting}
              onClick={handleDeleteTask}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-70 transition cursor-pointer"
            >
              {formSubmitting ? "..." : t("deleteTaskBtn")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Loading tasks...
        </div>
      }
    >
      <TasksContent />
    </Suspense>
  );
}
