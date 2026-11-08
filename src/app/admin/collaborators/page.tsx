"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  ArrowRight,
  Clock,
  PlayCircle,
  ExternalLink,
} from "lucide-react";
import Modal from "@/components/Modal";
import { useApp } from "@/context/AppContext";

interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  progress: number;
  createdAt: string;
}

interface Collaborator {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  projects?: ProjectSummary[];
}

export default function CollaboratorsPage() {
  const { t } = useApp();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCollaborator, setSelectedCollaborator] = useState<Collaborator | null>(null);

  // Projects Preview Modal
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [viewingCollabProjects, setViewingCollabProjects] = useState<Collaborator | null>(null);

  // Form states
  const [formUsername, setFormUsername] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchCollaborators = useCallback(async () => {
    try {
      const res = await fetch("/api/collaborators");
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Failed to load collaborators");
      }
    } catch {
      setErrorMessage("Network error loading collaborators");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const openAddModal = () => {
    setFormUsername("");
    setFormEmail("");
    setFormPassword("");
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Collaborator) => {
    setSelectedCollaborator(c);
    setFormUsername(c.username);
    setFormEmail(c.email);
    setFormPassword("");
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (c: Collaborator) => {
    setSelectedCollaborator(c);
    setIsDeleteModalOpen(true);
  };

  const openCollabProjectsModal = (c: Collaborator) => {
    setViewingCollabProjects(c);
    setIsProjectsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formUsername,
          email: formEmail,
          password: formPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create collaborator");
      }

      setSuccessMessage(`${t("collaborator")} "${data.collaborator.username}" created successfully!`);
      setIsAddModalOpen(false);
      fetchCollaborators();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Error creating collaborator");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCollaborator) return;
    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`/api/collaborators/${selectedCollaborator.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formUsername,
          email: formEmail,
          password: formPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update collaborator");
      }

      setSuccessMessage(`${t("collaborator")} "${data.collaborator.username}" updated successfully!`);
      setIsEditModalOpen(false);
      fetchCollaborators();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Error updating collaborator");
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCollaborator) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/collaborators/${selectedCollaborator.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete collaborator");
      }

      setSuccessMessage("Collaborator removed successfully.");
      setIsDeleteModalOpen(false);
      fetchCollaborators();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            {t("collabManagementTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t("collabManagementSubtitle")}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t("addCollaborator")}
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

      {/* Collaborators List */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-12 text-center">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading collaborators...</p>
        </div>
      ) : collaborators.length > 0 ? (
        <div className="space-y-4">
          {/* Mobile Card View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {collaborators.map((c) => (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {c.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-tight">{c.username}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[170px]">{c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      title={t("edit")}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openDeleteModal(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                      title={t("delete")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  {/* Clickable Projects button in mobile card */}
                  <button
                    onClick={() => openCollabProjectsModal(c)}
                    className="bg-indigo-50/70 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-left rtl:text-right transition cursor-pointer group"
                  >
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-semibold flex items-center justify-between">
                      <span>{t("navProjects")}</span>
                      <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    </p>
                    <p className="font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {c.totalProjects} {t("navProjects")} →
                    </p>
                  </button>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">{t("tasksDoneTotal")}</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                      <span className="text-emerald-600 dark:text-emerald-400">{c.completedTasks}</span>
                      {c.inProgressTasks > 0 && (
                        <span className="text-blue-600 dark:text-blue-400 font-semibold ml-1">
                          ({c.inProgressTasks} en cours)
                        </span>
                      )} / {c.totalTasks}
                    </p>
                  </div>
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
                    <th className="py-3.5 px-6">{t("collaborator")}</th>
                    <th className="py-3.5 px-6">{t("emailLabel")}</th>
                    <th className="py-3.5 px-6">{t("assignedProjects")}</th>
                    <th className="py-3.5 px-6">{t("tasksDoneTotal")}</th>
                    <th className="py-3.5 px-6">{t("joinedDate")}</th>
                    <th className="py-3.5 px-6 text-right rtl:text-left">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {collaborators.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                            {c.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{c.username}</p>
                            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                              {t("collaborator")}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          {c.email}
                        </div>
                      </td>
                      {/* Clickable Assigned Projects Cell */}
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                        <button
                          type="button"
                          onClick={() => openCollabProjectsModal(c)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 shadow-2xs transition group cursor-pointer"
                          title={t("viewCollaboratorProjects")}
                        >
                          <FolderKanban className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                          <span>{c.totalProjects} {c.totalProjects === 1 ? "Projet" : "Projets"}</span>
                          <span className="text-[10px] text-indigo-400 dark:text-indigo-500 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform">
                            →
                          </span>
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {c.completedTasks} / {c.totalTasks}
                            </span>
                            {c.totalTasks > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                                {Math.round((c.completedTasks / c.totalTasks) * 100)}%
                              </span>
                            )}
                          </div>
                          {c.inProgressTasks > 0 && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600 dark:text-blue-400">
                              <PlayCircle className="w-3 h-3" />
                              <span>{c.inProgressTasks} {t("inProgress")}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                            title={t("edit")}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(c)}
                            className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
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
            <Users className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base">
              {t("noCollaboratorsCardTitle")}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {t("noCollaboratorsCardDesc")}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {t("addFirstCollaborator")}
          </button>
        </div>
      )}

      {/* Collaborator Projects Modal (Opens when clicking on Projects in Collab page!) */}
      <Modal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        title={`${t("collaboratorProjectsTitle")} ${viewingCollabProjects?.username || ""}`}
        description={viewingCollabProjects?.email}
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4">
          {viewingCollabProjects?.projects && viewingCollabProjects.projects.length > 0 ? (
            <div className="space-y-3">
              {viewingCollabProjects.projects.map((proj) => (
                <div
                  key={proj.id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {proj.name}
                    </h4>
                    {proj.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {proj.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {proj.completedTasks} {t("completed")}
                      </span>
                      {proj.inProgressTasks > 0 && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                          <PlayCircle className="w-3 h-3" />
                          {proj.inProgressTasks} {t("inProgress")}
                        </span>
                      )}
                      {proj.pendingTasks > 0 && (
                        <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {proj.pendingTasks} {t("pending")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-start sm:self-center">
                    <div className="text-right rtl:text-left">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {proj.progress}%
                      </span>
                      <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                        <div
                          className="bg-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>
                    <Link
                      href={`/admin/tasks?projectId=${proj.id}`}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1"
                    >
                      <span>{t("navTasks")}</span>
                      <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                    </Link>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={`/admin/projects?collaboratorId=${viewingCollabProjects.id}`}
                  onClick={() => setIsProjectsModalOpen(false)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>{t("openInProjectsPage")}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsProjectsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center space-y-2">
              <FolderKanban className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t("noProjectsForCollab")}
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Add Collaborator Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t("newCollaboratorModalTitle")}
        description={t("newCollaboratorModalDesc")}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("usernameLabel")}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("emailLabel")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("passwordLabel")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Assign password"
                className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
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
              disabled={formSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 transition flex items-center gap-1.5 cursor-pointer"
            >
              {formSubmitting ? "..." : t("saveCollaborator")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Collaborator Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t("editCollaborator")}
        description={t("editCollaboratorModalDesc")}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("usernameLabel")}
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formUsername}
                onChange={(e) => setFormUsername(e.target.value)}
                className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("emailLabel")}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              {t("newPasswordOptional")}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder="Leave blank to keep unchanged"
                className="w-full pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {t("passwordOptionalHelp")}
            </p>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={t("deleteCollabTitle")}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t("deleteCollabConfirm")}{" "}
            <strong className="text-slate-900 dark:text-slate-100">{selectedCollaborator?.username}</strong>?
          </p>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs">
            {t("deleteCollabWarning")}
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
              onClick={handleDelete}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-70 transition cursor-pointer"
            >
              {formSubmitting ? "..." : t("deleteCollabBtn")}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
