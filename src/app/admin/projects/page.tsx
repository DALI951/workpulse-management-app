"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  CheckSquare,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  UserPlus,
  PlayCircle,
  Clock,
  Filter,
} from "lucide-react";
import Modal from "@/components/Modal";
import { useApp } from "@/context/AppContext";

interface CollaboratorOption {
  id: string;
  username: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  responsibleId: string;
  responsible: {
    id: string;
    username: string;
    email: string;
  };
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  progress: number;
  createdAt: string;
}

function ProjectsContent() {
  const { t } = useApp();
  const searchParams = useSearchParams();
  const initialCollabId = searchParams.get("collaboratorId") || "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborators, setCollaborators] = useState<CollaboratorOption[]>([]);
  const [selectedFilterCollab, setSelectedFilterCollab] = useState(initialCollabId);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Project Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // Quick Collaborator Modal
  const [isQuickCollabModalOpen, setIsQuickCollabModalOpen] = useState(false);
  const [quickUsername, setQuickUsername] = useState("");
  const [quickEmail, setQuickEmail] = useState("");
  const [quickPassword, setQuickPassword] = useState("");
  const [quickSubmitting, setQuickSubmitting] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  // Project Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formResponsibleId, setFormResponsibleId] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    try {
      const res = await fetch("/api/collaborators");
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (e) {
      console.error("Failed to fetch collaborators:", e);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const url = selectedFilterCollab
        ? `/api/projects?collaboratorId=${selectedFilterCollab}`
        : "/api/projects";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to load projects");
      }
    } catch {
      setErrorMessage("Network error loading projects");
    } finally {
      setLoading(false);
    }
  }, [selectedFilterCollab]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const openAddModal = () => {
    setFormName("");
    setFormDescription("");
    if (selectedFilterCollab) {
      setFormResponsibleId(selectedFilterCollab);
    } else if (collaborators.length > 0) {
      setFormResponsibleId(collaborators[0].id);
    } else {
      setFormResponsibleId("");
    }
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (p: Project) => {
    setSelectedProject(p);
    setFormName(p.name);
    setFormDescription(p.description || "");
    setFormResponsibleId(p.responsibleId);
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (p: Project) => {
    setSelectedProject(p);
    setIsDeleteModalOpen(true);
  };

  const openQuickCollaboratorModal = () => {
    setQuickUsername("");
    setQuickEmail("");
    setQuickPassword("");
    setQuickError(null);
    setIsQuickCollabModalOpen(true);
  };

  const handleQuickCollabCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickSubmitting(true);
    setQuickError(null);

    try {
      const res = await fetch("/api/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: quickUsername,
          email: quickEmail,
          password: quickPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create collaborator");
      }

      const newCollab: CollaboratorOption = {
        id: data.collaborator.id,
        username: data.collaborator.username,
        email: data.collaborator.email,
      };

      setCollaborators((prev) => [newCollab, ...prev]);
      setFormResponsibleId(newCollab.id);
      setIsQuickCollabModalOpen(false);
      setSuccessMessage(`${t("collaborator")} "${newCollab.username}" created and selected!`);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setQuickError(err.message);
      } else {
        setQuickError("Error creating collaborator");
      }
    } finally {
      setQuickSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    if (!formResponsibleId) {
      setFormError("A responsible collaborator must be selected for the project.");
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          responsibleId: formResponsibleId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setSuccessMessage(`Project "${data.project.name}" created successfully!`);
      setIsAddModalOpen(false);
      fetchProjects();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Error creating project");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          description: formDescription,
          responsibleId: formResponsibleId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update project");
      }

      setSuccessMessage(`Project "${data.project.name}" updated successfully!`);
      setIsEditModalOpen(false);
      fetchProjects();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Error updating project");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete project");
      }

      setSuccessMessage("Project deleted successfully.");
      setIsDeleteModalOpen(false);
      fetchProjects();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredCollabName = collaborators.find((c) => c.id === selectedFilterCollab)?.username;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {t("projectsManagementTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("projectsManagementSubtitle")}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t("addProject")}
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

      {/* Collaborator Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Filter className="w-4 h-4 text-slate-400" />
          <span>{t("filterByCollaborator")}</span>
          {filteredCollabName && (
            <span className="ml-1 px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold">
              {filteredCollabName}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedFilterCollab}
            onChange={(e) => setSelectedFilterCollab(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">{t("allCollaborators")} ({collaborators.length})</option>
            {collaborators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.username} ({c.email})
              </option>
            ))}
          </select>
          {selectedFilterCollab && (
            <button
              onClick={() => setSelectedFilterCollab("")}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline shrink-0 font-medium cursor-pointer"
            >
              {t("clearFilter")}
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading projects...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {projects.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                {/* Title & Actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-1">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title={t("edit")}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition cursor-pointer"
                      title={t("delete")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[32px] mb-4">
                  {p.description || "No project description provided."}
                </p>

                {/* Responsible Collaborator Badge (Clickable to filter!) */}
                <button
                  type="button"
                  onClick={() => setSelectedFilterCollab(p.responsible.id)}
                  className="w-full text-left rtl:text-right p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 mb-4 transition cursor-pointer group"
                  title="Click to filter projects by this collaborator"
                >
                  <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-slate-400 dark:text-slate-500 tracking-wider mb-1">
                    <span>{t("responsibleCollabLabel")}</span>
                    <span className="text-indigo-500 group-hover:underline lowercase text-[10px]">filter</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {p.responsible.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                        {p.responsible.username}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {p.responsible.email}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Task Breakdown Badges (In Progress, Completed, Pending are ALL VISIBLE) */}
                <div className="space-y-2 mb-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                      {t("navTasks")} ({p.totalTasks})
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {p.progress}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        p.progress === 100 && p.totalTasks > 0
                          ? "bg-emerald-500"
                          : "bg-indigo-600"
                      }`}
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>

                  {/* Explicit status counters so nothing is invisible */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {p.completedTasks} {t("completed")}
                    </span>

                    {p.inProgressTasks > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1">
                        <PlayCircle className="w-3 h-3" />
                        {p.inProgressTasks} {t("inProgress")}
                      </span>
                    )}

                    {p.pendingTasks > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {p.pendingTasks} {t("pending")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom footer link */}
              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {new Date(p.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={`/admin/tasks?projectId=${p.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {t("manageTasks")} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-8 sm:p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <FolderKanban className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
              {selectedFilterCollab
                ? `No projects found for ${filteredCollabName}`
                : t("noProjectsCardTitle")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {selectedFilterCollab
                ? "This collaborator does not have any assigned projects yet."
                : t("noProjectsCardDesc")}
            </p>
          </div>
          {selectedFilterCollab ? (
            <button
              onClick={() => setSelectedFilterCollab("")}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
            >
              Show All Projects
            </button>
          ) : (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t("addFirstProject")}
            </button>
          )}
        </div>
      )}

      {/* Add Project Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t("addProjectModalTitle")}
        description={t("addProjectModalDesc")}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("projectNameLabel")} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Website Redesign Q4"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("projectDescLabel")}
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Scope, objectives, or instructions..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Responsible Collaborator Selector (MANDATORY REQUIREMENT) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t("responsibleCollabLabel")} <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={openQuickCollaboratorModal}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {t("newCollabBtn")}
              </button>
            </div>

            {collaborators.length > 0 ? (
              <select
                required
                value={formResponsibleId}
                onChange={(e) => setFormResponsibleId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="" disabled>
                  {t("selectCollabPrompt")}
                </option>
                {collaborators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.username} ({c.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t("noCollabWarningTitle")}</span>
                </div>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {t("noCollabWarningDesc")}
                </p>
                <button
                  type="button"
                  onClick={openQuickCollaboratorModal}
                  className="px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  {t("createCollabNow")}
                </button>
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
              disabled={formSubmitting || !formResponsibleId}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition flex items-center gap-1.5 cursor-pointer"
            >
              {formSubmitting ? "..." : t("saveProject")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Quick Collaborator Creation Modal */}
      <Modal
        isOpen={isQuickCollabModalOpen}
        onClose={() => setIsQuickCollabModalOpen(false)}
        title={t("quickCollabTitle")}
        description={t("quickCollabDesc")}
      >
        {quickError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{quickError}</span>
          </div>
        )}

        <form onSubmit={handleQuickCollabCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("usernameLabel")}
            </label>
            <input
              type="text"
              required
              value={quickUsername}
              onChange={(e) => setQuickUsername(e.target.value)}
              placeholder="Collaborator name"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("emailLabel")}
            </label>
            <input
              type="email"
              required
              value={quickEmail}
              onChange={(e) => setQuickEmail(e.target.value)}
              placeholder="collab@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("passwordLabel")}
            </label>
            <input
              type="password"
              required
              value={quickPassword}
              onChange={(e) => setQuickPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsQuickCollabModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={quickSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition cursor-pointer"
            >
              {quickSubmitting ? "..." : t("createAndSelect")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t("editProjectModalTitle")}
        description={t("editProjectModalDesc")}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("projectNameLabel")}
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("projectDescLabel")}
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
              {t("responsibleCollabLabel")}
            </label>
            <select
              required
              value={formResponsibleId}
              onChange={(e) => setFormResponsibleId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.username} ({c.email})
                </option>
              ))}
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

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t("deleteProjectTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("deleteProjectConfirm")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">{selectedProject?.name}</strong>?
          </p>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs">
            {t("deleteProjectWarning")}
          </div>
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
              onClick={handleDeleteProject}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-70 transition cursor-pointer"
            >
              {formSubmitting ? "..." : t("deleteProjectBtn")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-slate-500">
          Loading projects...
        </div>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}
