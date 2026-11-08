import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const collaborators = await prisma.user.findMany({
      where: { role: "COLLABORATOR" },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            createdAt: true,
            tasks: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = collaborators.map((c) => {
      const totalProjects = c.projects.length;
      let totalTasks = 0;
      let completedTasks = 0;
      let inProgressTasks = 0;
      let pendingTasks = 0;

      const projectSummaries = c.projects.map((p) => {
        const pTotal = p.tasks.length;
        const pCompleted = p.tasks.filter((t) => t.status === "COMPLETED").length;
        const pInProgress = p.tasks.filter((t) => t.status === "IN_PROGRESS").length;
        const pPending = p.tasks.filter((t) => t.status === "PENDING").length;

        totalTasks += pTotal;
        completedTasks += pCompleted;
        inProgressTasks += pInProgress;
        pendingTasks += pPending;

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          totalTasks: pTotal,
          completedTasks: pCompleted,
          inProgressTasks: pInProgress,
          pendingTasks: pPending,
          progress: pTotal > 0 ? Math.round((pCompleted / pTotal) * 100) : 0,
          createdAt: p.createdAt,
        };
      });

      return {
        id: c.id,
        username: c.username,
        email: c.email,
        createdAt: c.createdAt,
        totalProjects,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        projects: projectSummaries,
      };
    });

    return NextResponse.json({ collaborators: formatted });
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    return NextResponse.json({ error: "Failed to fetch collaborators" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { username, email, password } = body;

    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json(
        { error: "Username, email, and password are all required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newCollaborator = await prisma.user.create({
      data: {
        username: username.trim(),
        email: cleanEmail,
        passwordHash,
        role: "COLLABORATOR",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ collaborator: newCollaborator }, { status: 201 });
  } catch (error) {
    console.error("Error creating collaborator:", error);
    return NextResponse.json({ error: "Failed to create collaborator" }, { status: 500 });
  }
}
