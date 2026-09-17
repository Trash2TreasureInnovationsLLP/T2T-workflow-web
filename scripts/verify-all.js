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
      { identifier: "fake@trash2treasure.com", password: "wrong" }
    );
    assert(failLogin.statusCode === 401, "Invalid login rejected with HTTP 401");

    // 3. Test CEO / Super Admin Login
    const ceoLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { identifier: "vishnu@trash2treasure.com", password: "Konda@nagaveni07" }
    );
    assert(ceoLogin.statusCode === 200, "Super Admin (CEO Vishnu) login success HTTP 200");
    assert(ceoLogin.data.user?.role === "SUPER_ADMIN", "Super Admin role returned correctly");
    assert(ceoLogin.data.user?.employeeId === "T2T-001", "Super Admin Employee ID is T2T-001");

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
    assert(meRes.statusCode === 200 && meRes.data.user?.email === "vishnu@trash2treasure.com", "Session verified via /api/auth/me");

    // 5. Test Executive KPIs
    const kpiRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/dashboard/kpis",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(kpiRes.statusCode === 200, "Executive KPIs HTTP 200");
    assert(kpiRes.data.totalMembers >= 9, `Total members >= 9 (got ${kpiRes.data.totalMembers})`);
    assert(kpiRes.data.activeProjects >= 3, `Active projects >= 3 (got ${kpiRes.data.activeProjects})`);
    assert(kpiRes.data.activeSprint !== null, "Active sprint returned with story points");
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
    assert(workOverviewRes.data.past?.completedTasks?.length > 0, "Past work has completed tasks");
    assert(workOverviewRes.data.current?.activeProjects?.length > 0, "Current work has active projects");
    assert(workOverviewRes.data.future?.upcomingTasks?.length > 0, "Future work has upcoming tasks");

    // 7. Test Task Creation, Persistence, and Auto-ID
    const newTaskRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/tasks",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookie },
      },
      {
        title: "Automated Verification Test Task",
        description: "Testing end-to-end task creation and persistence",
        projectId: workOverviewRes.data.current.activeProjects[0].id,
        priority: "HIGH",
        status: "TODO",
        storyPoints: 5,
        estimatedEffort: 8,
      }
    );
    assert(newTaskRes.statusCode === 201, "Task created HTTP 201");
    assert(newTaskRes.data.taskId && newTaskRes.data.taskId.startsWith("T2T-"), `Auto task ID generated: ${newTaskRes.data.taskId}`);
    const createdTaskId = newTaskRes.data.id;

    // 8. Test Kanban Status Transition & Drag/Drop Persistence (PATCH)
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

    // 9. Test Comment Submission & Notification Generation
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
    assert(commentRes.data.content.includes("Operational review checkpoint"), "Comment content verified");

    // 10. Test Team Analytics API
    const analyticsRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/analytics",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(analyticsRes.statusCode === 200, "Team Analytics HTTP 200");
    assert(analyticsRes.data.sprintVelocityData?.length > 0, "Sprint velocity dataset returned");
    assert(analyticsRes.data.statusDistribution?.length > 0, "Status distribution dataset returned");

    // 11. Test Member Performance API
    const perfRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/users/performance",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(perfRes.statusCode === 200, "Member Performance HTTP 200");
    assert(perfRes.data.length >= 8, `Performance returned for ${perfRes.data.length} members`);
    assert(perfRes.data[0].workloadStatus !== undefined, `Workload capacity health status computed: ${perfRes.data[0].workloadStatus}`);

    // 12. Test Audit Trail
    const auditRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/audit-logs",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(auditRes.statusCode === 200, "Audit logs HTTP 200");
    assert(auditRes.data.length > 0, `Audit logs contain ${auditRes.data.length} entries`);

    // 13. Test Calendar Events
    const calendarRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/calendar",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(calendarRes.statusCode === 200, "Calendar events HTTP 200");
    assert(calendarRes.data.length > 0, `Calendar contains ${calendarRes.data.length} scheduled items`);

    // 14. Test Global Search
    const searchRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/search?q=waste",
      method: "GET",
      headers: { Cookie: cookie },
    });
    assert(searchRes.statusCode === 200, "Global search HTTP 200");
    assert(searchRes.data.projects?.length > 0 || searchRes.data.tasks?.length > 0, "Global search returned matching projects/tasks");

    // 15. Test Forced Password Change on First Login (User: Rohan newbie@trash2treasure.com)
    const newLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { identifier: "newbie@trash2treasure.com", password: "T2T@Password2026!" }
    );
    assert(newLogin.statusCode === 200, "First-login user authenticated HTTP 200");
    assert(newLogin.data.mustChangePassword === true, "mustChangePassword flag is true for new user");

    // 16. Test CAO Advisory Authorization Restriction (Read-only on operational mutations)
    const caoLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { identifier: "cao@trash2treasure.com", password: "T2T@Password2026!" }
    );
    const caoCookie = caoLogin.headers["set-cookie"][0].split(";")[0];

    // CAO attempting to mutate task status should be rejected
    const caoMutate = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/api/tasks/${createdTaskId}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: caoCookie },
      },
      { status: "COMPLETED" }
    );
    assert(caoMutate.statusCode === 403, "CAO advisory role blocked from mutating task (HTTP 403)");

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
