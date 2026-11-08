import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const [collaborators, projects, tasks] = await Promise.all([
      prisma.user.findMany({
        where: { role: "COLLABORATOR" },
        include: {
          projects: {
            include: {
              tasks: true,
            },
          },
        },
        orderBy: { username: "asc" },
      }),
      prisma.project.findMany({
        include: {
          responsible: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          tasks: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.findMany({
        include: {
          project: {
            include: {
              responsible: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        take: 15,
      }),
    ]);

    const totalCollaborators = collaborators.length;
    const totalProjects = projects.length;

    let totalTasksCount = 0;
    let completedTasksCount = 0;
    let inProgressTasksCount = 0;
    let pendingTasksCount = 0;

    projects.forEach((p) => {
      totalTasksCount += p.tasks.length;
      completedTasksCount += p.tasks.filter((t) => t.status === "COMPLETED").length;
      inProgressTasksCount += p.tasks.filter((t) => t.status === "IN_PROGRESS").length;
      pendingTasksCount += p.tasks.filter((t) => t.status === "PENDING").length;
    });

    const completionRate =
      totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

    // Per collaborator performance breakdown
    const collaboratorStats = collaborators.map((c) => {
      let collabTotalTasks = 0;
      let collabCompletedTasks = 0;
      let collabInProgressTasks = 0;
      let collabPendingTasks = 0;

      c.projects.forEach((proj) => {
        collabTotalTasks += proj.tasks.length;
        collabCompletedTasks += proj.tasks.filter((t) => t.status === "COMPLETED").length;
        collabInProgressTasks += proj.tasks.filter((t) => t.status === "IN_PROGRESS").length;
        collabPendingTasks += proj.tasks.filter((t) => t.status === "PENDING").length;
      });

      const rate =
        collabTotalTasks > 0 ? Math.round((collabCompletedTasks / collabTotalTasks) * 100) : 0;

      return {
        id: c.id,
        username: c.username,
        email: c.email,
        totalProjects: c.projects.length,
        totalTasks: collabTotalTasks,
        completedTasks: collabCompletedTasks,
        inProgressTasks: collabInProgressTasks,
        pendingTasks: collabPendingTasks,
        completionRate: rate,
        projects: c.projects.map((p) => ({
          id: p.id,
          name: p.name,
          totalTasks: p.tasks.length,
          completedTasks: p.tasks.filter((t) => t.status === "COMPLETED").length,
          inProgressTasks: p.tasks.filter((t) => t.status === "IN_PROGRESS").length,
          pendingTasks: p.tasks.filter((t) => t.status === "PENDING").length,
        })),
      };
    });

    return NextResponse.json({
      summary: {
        totalCollaborators,
        totalProjects,
        totalTasks: totalTasksCount,
        completedTasks: completedTasksCount,
        inProgressTasks: inProgressTasksCount,
        pendingTasks: pendingTasksCount,
        completionRate,
      },
      collaborators: collaboratorStats,
      recentTasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        projectName: t.project.name,
        collaboratorName: t.project.responsible.username,
        updatedAt: t.updatedAt,
        completedAt: t.completedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
