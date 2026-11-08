import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { status } = body;

    if (!["PENDING", "IN_PROGRESS", "COMPLETED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value. Must be PENDING, IN_PROGRESS, or COMPLETED." },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // If collaborator, verify they are responsible for this project
    if (session.role === "COLLABORATOR" && task.project.responsibleId !== session.id) {
      return NextResponse.json(
        { error: "Access denied. You are not assigned to the project this task belongs to." },
        { status: 403 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status,
        completedAt: status === "COMPLETED" ? new Date() : null,
      },
    });

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    console.error("Error updating task status:", error);
    return NextResponse.json({ error: "Failed to update task status" }, { status: 500 });
  }
}
