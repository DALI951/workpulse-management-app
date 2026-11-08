import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("=== Testing Collaborator Deletion & Project Reassignment Logic ===");

  // 1. Create two test collaborators
  const hash = await bcrypt.hash("password123", 10);
  const collabA = await prisma.user.create({
    data: {
      username: "TestCollabA_" + Date.now(),
      email: `collabA_${Date.now()}@example.com`,
      passwordHash: hash,
      role: "COLLABORATOR",
    },
  });

  const collabB = await prisma.user.create({
    data: {
      username: "TestCollabB_" + Date.now(),
      email: `collabB_${Date.now()}@example.com`,
      passwordHash: hash,
      role: "COLLABORATOR",
    },
  });

  console.log(`Created test collaborators: A (${collabA.id}), B (${collabB.id})`);

  // 2. Create project assigned to Collab A with tasks
  const testProject = await prisma.project.create({
    data: {
      name: "Transferable Test Project",
      description: "Testing project reassignment",
      responsibleId: collabA.id,
      tasks: {
        create: [
          { title: "Task 1 for Transfer", status: "PENDING" },
          { title: "Task 2 for Transfer", status: "IN_PROGRESS" },
        ],
      },
    },
    include: { tasks: true },
  });

  console.log(`Created project "${testProject.name}" (ID: ${testProject.id}) assigned to Collab A with ${testProject.tasks.length} tasks.`);

  // 3. Test Reassign Mode (simulating DELETE API transaction)
  await prisma.$transaction([
    prisma.project.updateMany({
      where: { responsibleId: collabA.id },
      data: { responsibleId: collabB.id },
    }),
    prisma.user.delete({
      where: { id: collabA.id },
    }),
  ]);

  console.log("Successfully executed reassignment transaction!");

  // Verify Collab A is gone
  const checkA = await prisma.user.findUnique({ where: { id: collabA.id } });
  if (checkA) throw new Error("Collab A was not deleted!");
  console.log("Verified: Collab A is deleted.");

  // Verify project now belongs to Collab B and tasks still exist
  const updatedProject = await prisma.project.findUnique({
    where: { id: testProject.id },
    include: { tasks: true, responsible: true },
  });

  if (!updatedProject) throw new Error("Project was deleted during reassignment!");
  if (updatedProject.responsibleId !== collabB.id) throw new Error("Project responsibleId was not updated to Collab B!");
  if (updatedProject.tasks.length !== 2) throw new Error("Tasks were lost during reassignment!");

  console.log(`Verified: Project "${updatedProject.name}" is now owned by ${updatedProject.responsible.username} and retains all ${updatedProject.tasks.length} tasks.`);

  // 4. Test Cascade Mode on Collab B
  await prisma.user.delete({
    where: { id: collabB.id },
  });

  console.log("Successfully executed cascade delete of Collab B!");

  // Verify Collab B, the project, and tasks are all gone
  const checkB = await prisma.user.findUnique({ where: { id: collabB.id } });
  const checkProj = await prisma.project.findUnique({ where: { id: testProject.id } });
  const checkTasks = await prisma.task.findMany({ where: { projectId: testProject.id } });

  if (checkB) throw new Error("Collab B still exists!");
  if (checkProj) throw new Error("Project still exists after cascade delete!");
  if (checkTasks.length > 0) throw new Error("Tasks still exist after cascade delete!");

  console.log("Verified: Cascade delete cleanly removed collaborator, transferred project, and tasks.");
  console.log("ALL TESTS PASSED SUCCESSFULLY! ✅");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
