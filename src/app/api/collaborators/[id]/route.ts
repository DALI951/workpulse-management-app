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
  _request: Request,
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
    });

    if (!existing || existing.role !== "COLLABORATOR") {
      return NextResponse.json({ error: "Collaborator not found." }, { status: 404 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Collaborator deleted successfully." });
  } catch (error) {
    console.error("Error deleting collaborator:", error);
    return NextResponse.json({ error: "Failed to delete collaborator" }, { status: 500 });
  }
}
