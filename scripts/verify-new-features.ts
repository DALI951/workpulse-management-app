async function verifyFeatures() {
  const BASE_URL = "http://localhost:3001";
  console.log("=== VERIFYING NEW SPECIFIC USER REQUIREMENTS ===");

  // 1. Login as Admin
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "admin123" }),
  });
  const cookie = loginRes.headers.get("set-cookie") || "";
  const tokenMatch = cookie.match(/auth_token=([^;]+)/);
  const adminCookie = tokenMatch ? `auth_token=${tokenMatch[1]}` : "";

  // 2. Fetch Collaborators and verify projects list is attached
  console.log("\n[1] Checking Collaborators API for attached projects list and in-progress counts...");
  const collabsRes = await fetch(`${BASE_URL}/api/collaborators`, {
    headers: { Cookie: adminCookie },
  });
  const collabsData = await collabsRes.json();
  const collab = collabsData.collaborators[0];
  console.log("✓ Collaborator:", collab.username);
  console.log("✓ Attached projects count:", collab.projects ? collab.projects.length : 0);
  console.log("✓ In-progress tasks count:", collab.inProgressTasks);

  // 3. Test creating task as Admin without selecting status
  console.log("\n[2] Testing Add Task as Admin without selecting status...");
  const firstProject = collab.projects[0];
  const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({
      title: "New feature implementation task",
      projectId: firstProject.id,
      // No status provided! Must auto-default to PENDING
    }),
  });
  const createTaskData = await createTaskRes.json();
  if (createTaskData.task.status !== "PENDING") {
    throw new Error(`Expected PENDING, got ${createTaskData.task.status}`);
  }
  console.log("✓ Task created automatically with status:", createTaskData.task.status);
  const newTaskId = createTaskData.task.id;

  // 4. Mark this new task IN_PROGRESS
  console.log("\n[3] Marking task IN_PROGRESS and checking visibility in admin...");
  await fetch(`${BASE_URL}/api/tasks/${newTaskId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: adminCookie,
    },
    body: JSON.stringify({ status: "IN_PROGRESS" }),
  });

  // Verify it appears in Dashboard and Project counts
  const dashboardRes = await fetch(`${BASE_URL}/api/admin/dashboard`, {
    headers: { Cookie: adminCookie },
  });
  const dashboardData = await dashboardRes.json();
  console.log("✓ Dashboard In-Progress Tasks count:", dashboardData.summary.inProgressTasks);
  if (dashboardData.summary.inProgressTasks <= 0) {
    throw new Error("Expected inProgressTasks > 0 in dashboard summary");
  }

  // 5. Test Filtering Projects by Collaborator
  console.log("\n[4] Testing Filter Projects by Collaborator...");
  const filterProjectsRes = await fetch(`${BASE_URL}/api/projects?collaboratorId=${collab.id}`, {
    headers: { Cookie: adminCookie },
  });
  const filterProjectsData = await filterProjectsRes.json();
  console.log(`✓ Projects returned for collaborator "${collab.username}":`, filterProjectsData.projects.length);
  filterProjectsData.projects.forEach((p: any) => {
    if (p.responsibleId !== collab.id) {
      throw new Error(`Project ${p.name} does not belong to collaborator ${collab.id}`);
    }
    console.log(`   - Project "${p.name}": ${p.completedTasks} completed, ${p.inProgressTasks} in progress, ${p.pendingTasks} pending`);
  });

  console.log("\n=== ALL USER REQUIREMENTS VERIFIED SUCCESSFULLY ===");
}

verifyFeatures().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
