import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  try {
    let whereClause: Record<string, unknown> = {};

    if (session.role === "COLLABORATOR") {
      whereClause = {
        project: {
          responsibleId: session.id,
        },
      };
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            name: true,
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
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { title, description, projectId, status } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Task title is required." }, { status: 400 });
    }

    if (!projectId?.trim()) {
      return NextResponse.json(
        { error: "A task must belong to a project. Please select a project." },
        { status: 400 }
      );
    }

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Selected project does not exist." }, { status: 400 });
    }

    const validStatus = ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(status)
      ? status
      : "PENDING";

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        projectId,
        status: validStatus,
        completedAt: validStatus === "COMPLETED" ? new Date() : null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            responsible: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
