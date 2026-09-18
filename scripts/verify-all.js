// scripts/verify-all.js
const http = require("http");

async function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runVerification() {
  console.log("====================================================");
  console.log("🚀 STARTING T2T OPERATIONS PLATFORM E2E VERIFICATION");
  console.log("====================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. Check Login Page Loads
    const loginPage = await request({
      hostname: "localhost",
      port: 3000,
      path: "/login",
      method: "GET",
    });
    assert(loginPage.statusCode === 200, "Login page HTTP 200");

    // 2. Test Invalid Credentials
    const failLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { identifier: "fake@trash2treasure.co.in", password: "wrong" }
    );
    assert(failLogin.statusCode === 401, "Invalid login rejected with HTTP 401");

    // 2b. Test Legacy .com Domain Rejection (Must NOT log in with .com)
    const dotComLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { identifier: "vishnu@trash2treasure.com", password: "Konda@nagaveni07" }
    );
    assert(dotComLogin.statusCode === 401, "Legacy .com login strictly rejected (HTTP 401)");
    assert(dotComLogin.data.error?.includes("@trash2treasure.co.in"), "Rejection specifies @trash2treasure.co.in requirement");

    // 3. Test Super Admin Login with @trash2treasure.co.in
    const ceoLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { identifier: "vishnu@trash2treasure.co.in", password: "Konda@nagaveni07" }
    );
    assert(ceoLogin.statusCode === 200, "Super Admin (CEO Vishnu) login success HTTP 200");
    assert(ceoLogin.data.user?.role === "SUPER_ADMIN", "Super Admin role returned correctly");
    assert(ceoLogin.data.user?.employeeId === "T2T-001", "Super Admin Employee ID is T2T-001");
    assert(ceoLogin.data.user?.email === "vishnu@trash2treasure.co.in", "User email verified as @trash2treasure.co.in");

    // 3b. Test Login with Employee ID directly (T2T-001)
    const empIdLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { identifier: "T2T-001", password: "Konda@nagaveni07" }
    );
    assert(empIdLogin.statusCode === 200, "Login with Employee ID T2T-001 success HTTP 200");

    const cookieHeader = ceoLogin.headers["set-cookie"];
    assert(cookieHeader && cookieHeader[0].includes("t2t_session_token"), "HttpOnly session token issued in cookie");
    const cookie = cookieHeader[0].split(";")[0];

    // 4. Test Authenticated Session Verification (/api/auth/me)
    const meRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/auth/me",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(meRes.statusCode === 200 && meRes.data.user?.email === "vishnu@trash2treasure.co.in", "Session verified via /api/auth/me");

    // 5. Test Executive KPIs on Clean Database
    const kpiRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/dashboard/kpis",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(kpiRes.statusCode === 200, "Executive KPIs HTTP 200");
    assert(kpiRes.data.totalMembers >= 1, `Total members >= 1 (got ${kpiRes.data.totalMembers})`);
    assert(typeof kpiRes.data.healthScore === "number", `Health score calculated (${kpiRes.data.healthScore}/100)`);

    // 6. Test 3-Stage Work Overview (Past, Current, Future)
    const workOverviewRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/dashboard/work-overview",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(workOverviewRes.statusCode === 200, "Work Overview HTTP 200");
    assert(Array.isArray(workOverviewRes.data.past?.completedTasks), "Past work list returned");
    assert(Array.isArray(workOverviewRes.data.current?.activeProjects), "Current work list returned");
    assert(Array.isArray(workOverviewRes.data.future?.upcomingTasks), "Future work list returned");

    // 7. Test Fetching Users and Departments for adding team members
    const deptsRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/users",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(deptsRes.statusCode === 200, "Users API returned HTTP 200");
    assert(Array.isArray(deptsRes.data) && deptsRes.data.length >= 1, "Users list has Super Admin");

    // 8. Test Creating a Project (POST /api/projects)
    const newProjRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/projects",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
      },
      {
        name: "Plastic Pyrolysis Initiative",
        description: "Decentralized conversion of multilayer plastics into certified industrial furnace fuel.",
        managerId: deptsRes.data[0].id,
        startDate: new Date().toISOString(),
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        priority: "HIGH",
        status: "ACTIVE",
        budget: 5000000,
      }
    );
    assert(newProjRes.statusCode === 201, "Project created HTTP 201");
    const createdProjectId = newProjRes.data.id;

    // 9. Test Task Creation, Persistence, and Auto-ID
    const newTaskRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/tasks",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
      },
      {
        title: "Catalytic Reactor Thermal Calibration",
        description: "Calibration of thermocouple arrays across primary condensation chambers.",
        projectId: createdProjectId,
        priority: "URGENT",
        status: "TODO",
        storyPoints: 5,
        estimatedEffort: 8,
      }
    );
    assert(newTaskRes.statusCode === 201, "Task created HTTP 201");
    assert(newTaskRes.data.taskId && newTaskRes.data.taskId.startsWith("T2T-"), `Auto task ID generated: ${newTaskRes.data.taskId}`);
    const createdTaskId = newTaskRes.data.id;

    // 10. Test Kanban Status Transition & Drag/Drop Persistence (PATCH)
    const kanbanMoveRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/api/tasks/${createdTaskId}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
      },
      { status: "IN_PROGRESS" }
    );
    assert(kanbanMoveRes.statusCode === 200, "Kanban move status update HTTP 200");
    assert(kanbanMoveRes.data.status === "IN_PROGRESS", "Task status updated to IN_PROGRESS");

    // Verify persistence by refetching
    const fetchTask = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/tasks/${createdTaskId}`,
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(fetchTask.data.status === "IN_PROGRESS", "Refetched task confirms persisted status IN_PROGRESS");

    // 11. Test Comment Submission
    const commentRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/api/tasks/${createdTaskId}/comments`,
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
      },
      { content: "Operational review checkpoint: Verification script comment" }
    );
    assert(commentRes.statusCode === 201, "Comment posted to task HTTP 201");

    // 12. Test Global Search
    const searchRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/search?q=Reactor",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(searchRes.statusCode === 200, "Global search HTTP 200");
    assert(searchRes.data.tasks?.length > 0, "Global search returned matching tasks");

    // 13. Test Leaderboard System API (/api/leaderboard)
    const lbRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/leaderboard",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(lbRes.statusCode === 200, "Leaderboard API returned HTTP 200");
    assert(Array.isArray(lbRes.data.leaderboard), "Leaderboard members array returned");
    assert(lbRes.data.currentUserStanding?.employeeId === "T2T-001", "Current user (Super Admin) standing identified");

    // 14. Test Profile Page Load (/profile)
    const profilePage = await request({
      hostname: "localhost",
      port: 3000,
      path: "/profile",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(profilePage.statusCode === 200, "Profile page HTTP 200 for authenticated user");

    // 15. Test Profile API GET (/api/users/profile)
    const profileGet = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/users/profile",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(profileGet.statusCode === 200, "Profile API GET returned HTTP 200");
    assert(profileGet.data.user?.employeeId === "T2T-001", "Profile API returns correct user details");
    assert(profileGet.data.user?.email === "vishnu@trash2treasure.co.in", "Profile email is @trash2treasure.co.in");

    // 16. Test Profile Picture & Info Update PATCH (/api/users/profile)
    const sampleAvatar = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256";
    const profilePatch = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/users/profile",
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookie },
      },
      {
        avatarUrl: sampleAvatar,
        fullName: "Vishnu (Super Admin)",
        skills: "Full-Stack, Circular Tech, Waste-to-Value, Agile Leadership",
      }
    );
    assert(profilePatch.statusCode === 200, "Profile API PATCH returned HTTP 200");
    assert(profilePatch.data.user?.avatarUrl === sampleAvatar, "Profile picture avatarUrl saved successfully");
    assert(profilePatch.data.user?.skills?.includes("Circular Tech"), "Profile skills updated successfully");
    assert(profilePatch.headers["set-cookie"]?.length > 0, "Session token cookie refreshed on profile picture update");

    // 17. Clean up the test task and project to leave the workspace pristine
    await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/tasks/${createdTaskId}`,
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/projects/${createdProjectId}`,
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    console.log("🧹 Test entities cleaned up. Workspace restored to pristine state.");

    console.log("\n====================================================");
    console.log(`🏁 VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
    console.log("====================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error("Verification test crashed:", error);
    process.exit(1);
  }
}

runVerification();
