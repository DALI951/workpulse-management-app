import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, hashPassword } from "@/lib/auth";

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
    const { username, email, password } = body;

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing || existing.role !== "COLLABORATOR") {
      return NextResponse.json({ error: "Collaborator not found." }, { status: 404 });
    }

    const updateData: {
      username?: string;
      email?: string;
      passwordHash?: string;
    } = {};

    if (username?.trim()) {
      updateData.username = username.trim();
    }

    if (email?.trim()) {
      const cleanEmail = email.toLowerCase().trim();
      if (cleanEmail !== existing.email) {
        const emailTaken = await prisma.user.findUnique({
          where: { email: cleanEmail },
        });
        if (emailTaken) {
          return NextResponse.json(
            { error: "This email address is already in use." },
            { status: 400 }
          );
        }
        updateData.email = cleanEmail;
      }
    }

    if (password && password.trim().length > 0) {
      updateData.passwordHash = await hashPassword(password.trim());
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ collaborator: updated });
  } catch (error) {
    console.error("Error updating collaborator:", error);
    return NextResponse.json({ error: "Failed to update collaborator" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSessionUser();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin access required." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.user.findUnique({
      where: { id },
      include: {
        projects: {
          select: { id: true, name: true },
        },
      },
    });

    if (!existing || existing.role !== "COLLABORATOR") {
      return NextResponse.json({ error: "Collaborator not found." }, { status: 404 });
    }

    let mode = "cascade";
    let reassignToId: string | null = null;

    try {
      const body = await request.json();
      if (body) {
        if (body.mode === "reassign" || body.mode === "cascade") {
          mode = body.mode;
        }
        if (body.reassignToId) {
          reassignToId = body.reassignToId;
        }
      }
    } catch {
      // Body may be empty in simple delete requests, fallback to cascade
    }

    const projectCount = existing.projects.length;

    if (mode === "reassign" && projectCount > 0) {
      if (!reassignToId || reassignToId === id) {
        return NextResponse.json(
          { error: "Please select another collaborator to receive the projects." },
          { status: 400 }
        );
      }

      const targetCollab = await prisma.user.findUnique({
        where: { id: reassignToId },
      });

      if (!targetCollab || targetCollab.role !== "COLLABORATOR") {
        return NextResponse.json(
          { error: "Target collaborator not found or invalid." },
          { status: 400 }
        );
      }

      // Reassign all projects to target collaborator, then delete the collaborator
      await prisma.$transaction([
        prisma.project.updateMany({
          where: { responsibleId: id },
          data: { responsibleId: reassignToId },
        }),
        prisma.user.delete({
          where: { id },
        }),
      ]);

      return NextResponse.json({
        success: true,
        message: `Collaborator deleted. ${projectCount} project(s) successfully transferred to ${targetCollab.username}.`,
      });
    }

    // Default cascade delete: Prisma cascade will delete projects and tasks
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Collaborator and associated projects deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting collaborator:", error);
    return NextResponse.json({ error: "Failed to delete collaborator" }, { status: 500 });
  }
}
