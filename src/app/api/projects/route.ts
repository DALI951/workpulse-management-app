import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const collaboratorId = searchParams.get("collaboratorId");

  try {
    let whereClause: Record<string, unknown> = {};

    if (session.role === "COLLABORATOR") {
      whereClause = { responsibleId: session.id };
    } else if (collaboratorId) {
      whereClause = { responsibleId: collaboratorId };
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        responsible: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = projects.map((p) => {
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === "COMPLETED").length;
      const inProgressTasks = p.tasks.filter((t) => t.status === "IN_PROGRESS").length;
      const pendingTasks = p.tasks.filter((t) => t.status === "PENDING").length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        responsible: p.responsible,
        responsibleId: p.responsibleId,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        progress,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return NextResponse.json({ projects: formatted });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, responsibleId } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }

    if (!responsibleId?.trim()) {
      return NextResponse.json(
        { error: "A responsible collaborator is required for every project." },
        { status: 400 }
      );
    }

    // Verify collaborator exists
    const collaborator = await prisma.user.findUnique({
      where: { id: responsibleId },
    });

    if (!collaborator || collaborator.role !== "COLLABORATOR") {
      return NextResponse.json(
        { error: "Selected collaborator does not exist or is not valid." },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        responsibleId: collaborator.id,
      },
      include: {
        responsible: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
