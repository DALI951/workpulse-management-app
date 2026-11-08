import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description, projectId, status } = body;

    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updateData: {
      title?: string;
      description?: string | null;
      projectId?: string;
      status?: string;
      completedAt?: Date | null;
    } = {};

    if (title?.trim()) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        return NextResponse.json({ error: "Selected project not found" }, { status: 400 });
      }
      updateData.projectId = projectId;
    }

    if (status && ["PENDING", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      updateData.status = status;
      if (status === "COMPLETED") {
        updateData.completedAt = existing.completedAt || new Date();
      } else {
        updateData.completedAt = null;
      }
    }

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ task: updated });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.task.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Task deleted successfully." });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
