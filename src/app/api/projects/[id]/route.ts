import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        responsible: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // If collaborator, verify ownership
    if (session.role === "COLLABORATOR" && project.responsibleId !== session.id) {
      return NextResponse.json(
        { error: "Access denied. You are not assigned to this project." },
        { status: 403 }
      );
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

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
    const { name, description, responsibleId } = body;

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updateData: {
      name?: string;
      description?: string | null;
      responsibleId?: string;
    } = {};

    if (name?.trim()) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }

    if (responsibleId) {
      const collaborator = await prisma.user.findUnique({
        where: { id: responsibleId },
      });
      if (!collaborator || collaborator.role !== "COLLABORATOR") {
        return NextResponse.json({ error: "Invalid collaborator specified." }, { status: 400 });
      }
      updateData.responsibleId = responsibleId;
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
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
    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Project deleted successfully." });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
