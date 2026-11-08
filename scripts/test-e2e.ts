async function runTests() {
  const BASE_URL = "http://localhost:3001";
  console.log("=== STARTING FULL END-TO-END VERIFICATION ===");

  // 1. Test unauthenticated request to /api/auth/me -> should be 401
  console.log("\n[1] Testing unauthenticated /api/auth/me...");
  const meRes1 = await fetch(`${BASE_URL}/api/auth/me`);
  if (meRes1.status === 401) {
    console.log("✓ Unauthenticated correctly rejected (401)");
  } else {
    throw new Error(`Expected 401, got ${meRes1.status}`);
  }

  // 2. Test Admin Login
  console.log("\n[2] Logging in as Admin...");
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "admin123" }),
  });
  if (!loginRes.ok) throw new Error("Admin login failed");
  const loginCookie = loginRes.headers.get("set-cookie") || "";
  const adminData = await loginRes.json();
  console.log("✓ Admin logged in:", adminData.user.username, `(${adminData.user.role})`);

  // Extract auth_token cookie
  const tokenMatch = loginCookie.match(/auth_token=([^;]+)/);
  const adminCookieHeader = tokenMatch ? `auth_token=${tokenMatch[1]}` : "";

  // 3. Admin creates a collaborator
  console.log("\n[3] Admin creating a collaborator...");
  const createCollabRes = await fetch(`${BASE_URL}/api/collaborators`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      username: "John Doe",
      email: "john.doe@test.com",
      password: "collabpassword123",
    }),
  });
  const collabData = await createCollabRes.json();
  if (!createCollabRes.ok) throw new Error(`Collab creation failed: ${collabData.error}`);
  const collabId = collabData.collaborator.id;
  console.log("✓ Created collaborator:", collabData.collaborator.username, `(ID: ${collabId})`);

  // 4. Admin edits collaborator
  console.log("\n[4] Admin editing collaborator...");
  const editCollabRes = await fetch(`${BASE_URL}/api/collaborators/${collabId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      username: "John Doe Senior",
    }),
  });
  const editCollabData = await editCollabRes.json();
  if (!editCollabRes.ok) throw new Error("Collab edit failed");
  console.log("✓ Updated collaborator username:", editCollabData.collaborator.username);

  // 5. Project creation requirement check: attempt without collaborator -> must fail (400)
  console.log("\n[5] Enforcing Project Requirement: Attempting to create project without responsible collaborator...");
  const invalidProjectRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      name: "Orphan Project",
      responsibleId: "",
    }),
  });
  if (invalidProjectRes.status === 400) {
    console.log("✓ Creating project without collaborator correctly rejected (400)");
  } else {
    throw new Error("Expected 400 for project without collaborator");
  }

  // 6. Admin creates a project with collaborator assigned
  console.log("\n[6] Admin creating project assigned to John Doe Senior...");
  const createProjectRes = await fetch(`${BASE_URL}/api/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      name: "Enterprise Cloud Portal",
      description: "Build new multi-tenant portal architecture",
      responsibleId: collabId,
    }),
  });
  const projectData = await createProjectRes.json();
  if (!createProjectRes.ok) throw new Error(`Project creation failed: ${projectData.error}`);
  const projectId = projectData.project.id;
  console.log("✓ Created project:", projectData.project.name, `(ID: ${projectId})`);

  // 7. Task creation requirement check: attempt without project -> must fail (400)
  console.log("\n[7] Enforcing Task Requirement: Attempting to create task without project...");
  const invalidTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      title: "Task with no project",
      projectId: "",
    }),
  });
  if (invalidTaskRes.status === 400) {
    console.log("✓ Creating task without project correctly rejected (400)");
  } else {
    throw new Error("Expected 400 for task without project");
  }

  // 8. Admin creates tasks for the project
  console.log("\n[8] Admin creating tasks for the project...");
  const task1Res = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      title: "Setup API Gateway and authentication",
      description: "Configure JWT verification and rate limiting",
      projectId: projectId,
      status: "PENDING",
    }),
  });
  const task1Data = await task1Res.json();
  const task1Id = task1Data.task.id;
  console.log("✓ Created Task 1:", task1Data.task.title);

  const task2Res = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookieHeader,
    },
    body: JSON.stringify({
      title: "Design Database schema migrations",
      description: "Implement Prisma SQLite schema",
      projectId: projectId,
      status: "PENDING",
    }),
  });
  const task2Data = await task2Res.json();
  const task2Id = task2Data.task.id;
  console.log("✓ Created Task 2:", task2Data.task.title);

  // 9. Collaborator logs in
  console.log("\n[9] Collaborator signing in with their credentials...");
  const collabLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "john.doe@test.com",
      password: "collabpassword123",
    }),
  });
  if (!collabLoginRes.ok) throw new Error("Collaborator login failed");
  const collabCookie = collabLoginRes.headers.get("set-cookie") || "";
  const collabTokenMatch = collabCookie.match(/auth_token=([^;]+)/);
  const collabCookieHeader = collabTokenMatch ? `auth_token=${collabTokenMatch[1]}` : "";
  const collabSession = await collabLoginRes.json();
  console.log("✓ Collaborator authenticated:", collabSession.user.username, `(${collabSession.user.role})`);

  // 10. Collaborator views their assigned projects
  console.log("\n[10] Collaborator fetching assigned projects...");
  const collabProjectsRes = await fetch(`${BASE_URL}/api/projects`, {
    headers: { Cookie: collabCookieHeader },
  });
  const collabProjectsData = await collabProjectsRes.json();
  console.log("✓ Collaborator sees assigned projects count:", collabProjectsData.projects.length);
  if (collabProjectsData.projects[0].id !== projectId) {
    throw new Error("Project mismatch in collaborator projects list");
  }

  // 11. Collaborator views tasks in the project
  console.log("\n[11] Collaborator entering project detail...");
  const collabProjDetailRes = await fetch(`${BASE_URL}/api/projects/${projectId}`, {
    headers: { Cookie: collabCookieHeader },
  });
  const collabProjDetailData = await collabProjDetailRes.json();
  console.log("✓ Tasks retrieved inside project:", collabProjDetailData.project.tasks.length);

  // 12. Collaborator updates Task 1: PENDING -> IN_PROGRESS -> COMPLETED
  console.log("\n[12] Collaborator updating Task 1 status to IN_PROGRESS...");
  const statusRes1 = await fetch(`${BASE_URL}/api/tasks/${task1Id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: collabCookieHeader,
    },
    body: JSON.stringify({ status: "IN_PROGRESS" }),
  });
  const statusData1 = await statusRes1.json();
  console.log("✓ Task 1 updated to:", statusData1.task.status);

  console.log("\n[13] Collaborator completing Task 1...");
  const statusRes2 = await fetch(`${BASE_URL}/api/tasks/${task1Id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: collabCookieHeader,
    },
    body: JSON.stringify({ status: "COMPLETED" }),
  });
  const statusData2 = await statusRes2.json();
  console.log("✓ Task 1 updated to:", statusData2.task.status, "completedAt:", statusData2.task.completedAt);

  // 13. Admin checks Dashboard to verify completed tasks metrics
  console.log("\n[14] Admin checking Dashboard completed tasks metrics...");
  const dashboardRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: { Cookie: adminCookieHeader },
  });
  const dashboardData = await dashboardRes.json();
  console.log("✓ Summary Total Tasks:", dashboardData.summary.totalTasks);
  console.log("✓ Summary Completed Tasks:", dashboardData.summary.completedTasks);
  console.log("✓ Summary Completion Rate:", `${dashboardData.summary.completionRate}%`);

  const collabStat = dashboardData.collaborators.find((c: any) => c.id === collabId);
  console.log(`✓ Collaborator "${collabStat.username}" Performance:`);
  console.log(`    - Completed Tasks: ${collabStat.completedTasks} of ${collabStat.totalTasks}`);
  console.log(`    - Completion Rate: ${collabStat.completionRate}%`);

  if (collabStat.completedTasks !== 1 || collabStat.totalTasks !== 2) {
    throw new Error(`Expected 1/2 completed tasks, got ${collabStat.completedTasks}/${collabStat.totalTasks}`);
  }

  console.log("\n=======================================================");
  console.log("🎉 ALL TESTS & USER REQUIREMENTS VERIFIED SUCCESSFULLY!");
  console.log("=======================================================");
}

runTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
