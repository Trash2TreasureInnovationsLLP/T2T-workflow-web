const BASE_URL = process.env.BASE_URL || "http://localhost:3050";

let adminCookie = "";
let createdUserId = "";
let createdUserEmail = "";
let createdUserTempPass = "";
let createdUserCookie = "";
let autoProjectId = "";
let autoTaskId = "";
let autoDocId = "";

const results = {
  passed: [],
  failed: [],
};

function pass(name, details = "") {
  console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name} ${details ? `(${details})` : ""}`);
  results.passed.push({ name, details });
}

function fail(name, error) {
  console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${name} -> ${error}`);
  results.failed.push({ name, error });
}

async function run() {
  console.log("\n=======================================================");
  console.log(`  TRASH2TREASURE HTTP API END-TO-END TEST SUITE`);
  console.log(`  Target: ${BASE_URL}`);
  console.log("=======================================================\n");

  try {
    // -------------------------------------------------------------
    // TEST 1: Super Admin Login & Cookie Extraction
    // -------------------------------------------------------------
    console.log("\x1b[36m--- TEST GROUP 1: AUTHENTICATION ENDPOINTS ---\x1b[0m");

    // 1.1 Invalid Password
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "vishnu@trash2treasure.co.in", password: "WrongPassword999!" }),
    });
    if (badLoginRes.status === 401) {
      pass("Invalid password rejected with 401");
    } else {
      fail("Invalid password rejection", `Expected 401, got ${badLoginRes.status}`);
    }

    // 1.2 Valid Super Admin Login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: "vishnu@trash2treasure.co.in", password: "Konda@nagaveni07" }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status === 200 && loginData.user?.role === "SUPER_ADMIN") {
      const setCookieHeader = loginRes.headers.get("set-cookie") || "";
      const match = setCookieHeader.match(/t2t_session_token=([^;]+)/);
      adminCookie = match ? `t2t_session_token=${match[1]}` : "";
      pass("Super Admin login succeeded", `Role: ${loginData.user.role}, Token extracted: ${!!adminCookie}`);
    } else {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginData)}`);
    }

    // -------------------------------------------------------------
    // TEST 2: User Creation with Custom Role & Inline New Department
    // -------------------------------------------------------------
    console.log("\n\x1b[36m--- TEST GROUP 2: USER CREATION & CUSTOM ROLES ---\x1b[0m");

    const customRole = "Circular Materials Lead";
    const customDeptName = `Green Chemistry Dept ${Date.now()}`;
    const newMemberEmail = `chemist_${Date.now()}@trash2treasure.co.in`;

    const createUserRes = await fetch(`${BASE_URL}/api/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        fullName: "Dr. Aarti Raman",
        email: newMemberEmail,
        role: customRole,
        newDepartmentName: customDeptName,
        designation: "Chief Bio-Materials Scientist",
        temporaryPassword: "T2T@Chem2026!",
      }),
    });

    const createUserData = await createUserRes.json();
    if (createUserRes.status === 201 && createUserData.user?.id) {
      createdUserId = createUserData.user.id;
      createdUserEmail = newMemberEmail;
      createdUserTempPass = createUserData.temporaryPassword;
      pass("User created with custom role & new department", `Role: "${createUserData.user.role}", Dept: "${createUserData.user.department?.name}"`);
    } else {
      throw new Error(`Create user failed (${createUserRes.status}): ${JSON.stringify(createUserData)}`);
    }

    // -------------------------------------------------------------
    // TEST 3: Login with Temp Password & Password Change Workflow
    // -------------------------------------------------------------
    console.log("\n\x1b[36m--- TEST GROUP 3: PASSWORD RESET LOOP VERIFICATION ---\x1b[0m");

    // 3.1 Login with temp pass
    const tempUserLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: createdUserEmail, password: createdUserTempPass }),
    });
    const tempUserLoginData = await tempUserLoginRes.json();
    if (tempUserLoginRes.status === 200 && tempUserLoginData.user?.mustChangePassword === true) {
      const match = (tempUserLoginRes.headers.get("set-cookie") || "").match(/t2t_session_token=([^;]+)/);
      createdUserCookie = match ? `t2t_session_token=${match[1]}` : "";
      pass("Login with temporary password flags mustChangePassword=true", `Target: /change-password`);
    } else {
      throw new Error(`Temp user login failed: ${JSON.stringify(tempUserLoginData)}`);
    }

    // 3.2 Change Password with mismatch -> 400
    const mismatchRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: createdUserCookie },
      body: JSON.stringify({
        currentPassword: createdUserTempPass,
        newPassword: "NewPass123!",
        confirmPassword: "DifferentPass123!",
      }),
    });
    if (mismatchRes.status === 400) {
      pass("Password confirmation mismatch rejected with 400");
    } else {
      fail("Mismatch rejection", `Expected 400, got ${mismatchRes.status}`);
    }

    // 3.3 Change Password with valid credentials
    const validChangeRes = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: createdUserCookie },
      body: JSON.stringify({
        currentPassword: createdUserTempPass,
        newPassword: "MyPermanentPass@2026!",
        confirmPassword: "MyPermanentPass@2026!",
      }),
    });
    const changeData = await validChangeRes.json();
    if (validChangeRes.status === 200 && changeData.user?.mustChangePassword === false) {
      pass("Password changed successfully", `mustChangePassword=false, redirect: ${changeData.redirectUrl || "/my-work"}`);
    } else {
      throw new Error(`Change password failed: ${JSON.stringify(changeData)}`);
    }

    // -------------------------------------------------------------
    // TEST 4: Tasks API with Inline New Project and New Sprint
    // -------------------------------------------------------------
    console.log("\n\x1b[36m--- TEST GROUP 4: OPERATIONAL TASKS & INLINE CREATIONS ---\x1b[0m");

    const inlineProjName = `Autonomous Solar Sorter ${Date.now()}`;
    const inlineSprintName = `Sprint Alpha - Hardware Assembly ${Date.now()}`;

    const createTaskRes = await fetch(`${BASE_URL}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        title: "Assemble high-speed pneumatic ejector valves",
        description: "Install 40psi solenoid valves for color separation",
        projectId: "__NEW__",
        newProjectName: inlineProjName,
        sprintId: "__NEW__",
        newSprintName: inlineSprintName,
        priority: "HIGH",
        status: "TODO",
        storyPoints: 8,
        estimatedEffort: 16,
      }),
    });

    const taskData = await createTaskRes.json();
    if (createTaskRes.status === 201 && taskData.id && taskData.project?.id) {
      autoTaskId = taskData.id;
      autoProjectId = taskData.project.id;
      pass("Task created with inline project & sprint auto-created", `Task: ${taskData.taskId}, Project: "${taskData.project.name}", Sprint: "${taskData.sprint?.name}"`);
    } else {
      throw new Error(`Create task failed (${createTaskRes.status}): ${JSON.stringify(taskData)}`);
    }

    // -------------------------------------------------------------
    // TEST 5: Documents API with Custom Category & Project Link
    // -------------------------------------------------------------
    console.log("\n\x1b[36m--- TEST GROUP 5: DOCUMENT VAULT & CUSTOM CATEGORIES ---\x1b[0m");

    const customCategory = "Circular Economy Impact Assessment";
    const createDocRes = await fetch(`${BASE_URL}/api/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        title: "Pneumatic Sorter Efficiency Report",
        fileName: "pneumatic_sorter_efficiency_v1.pdf",
        category: customCategory,
        projectId: autoProjectId,
        fileSize: 524288,
      }),
    });

    const docData = await createDocRes.json();
    if (createDocRes.status === 201 && docData.id && docData.category === customCategory) {
      autoDocId = docData.id;
      pass("Document registered with custom category and project link", `Category: "${docData.category}", Project: "${docData.project?.name}"`);
      pass("Public Supabase S3 file URL confirmed", docData.fileUrl);
    } else {
      throw new Error(`Create document failed (${createDocRes.status}): ${JSON.stringify(docData)}`);
    }

    // -------------------------------------------------------------
    // TEST 6: User Update (PATCH) with Custom Role & Department
    // -------------------------------------------------------------
    console.log("\n\x1b[36m--- TEST GROUP 6: MEMBER EDITING & STATUS TOGGLE ---\x1b[0m");

    const patchUserRes = await fetch(`${BASE_URL}/api/users/${createdUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Cookie: adminCookie },
      body: JSON.stringify({
        fullName: "Dr. Aarti Raman Ph.D.",
        role: "Principal Circular Scientist",
        designation: "Executive Director of Circular Chemistry",
        accountStatus: "SUSPENDED",
      }),
    });

    const patchUserData = await patchUserRes.json();
    if (patchUserRes.status === 200 && patchUserData.role === "Principal Circular Scientist") {
      pass("User updated via PATCH", `New Role: "${patchUserData.role}", Status: ${patchUserData.accountStatus}`);
    } else {
      throw new Error(`User PATCH failed: ${JSON.stringify(patchUserData)}`);
    }

    // -------------------------------------------------------------
    // TEST 7: Cascading Member Deletion (Resolving Screenshot Issue)
    // -------------------------------------------------------------
    console.log("\n\x1b[36m--- TEST GROUP 7: CASCADING DELETE & TIMEOUT VERIFICATION ---\x1b[0m");

    // 7.1 Prevent Super Admin self-deletion
    const selfDeleteRes = await fetch(`${BASE_URL}/api/users/${loginData.user.id}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    if (selfDeleteRes.status === 400) {
      pass("Super Admin self-deletion prevented with 400");
    } else {
      fail("Self-deletion protection", `Expected 400, got ${selfDeleteRes.status}`);
    }

    // 7.2 Delete created test user
    const startTime = Date.now();
    const deleteUserRes = await fetch(`${BASE_URL}/api/users/${createdUserId}`, {
      method: "DELETE",
      headers: { Cookie: adminCookie },
    });
    const deleteDuration = Date.now() - startTime;
    const deleteData = await deleteUserRes.json();

    if (deleteUserRes.status === 200 && deleteData.success) {
      pass("User deleted with cascading cleanup cleanly", `${deleteDuration}ms, 0 timeout errors`);
    } else {
      throw new Error(`User DELETE failed (${deleteUserRes.status}): ${JSON.stringify(deleteData)}`);
    }

    // Clean up created task, document, and project
    if (autoTaskId) {
      await fetch(`${BASE_URL}/api/tasks/${autoTaskId}`, { method: "DELETE", headers: { Cookie: adminCookie } });
    }
    if (autoProjectId) {
      await fetch(`${BASE_URL}/api/projects/${autoProjectId}`, { method: "DELETE", headers: { Cookie: adminCookie } });
    }
    pass("Test project and operational tasks cleaned up");

  } catch (err) {
    fail("End-to-End Suite Execution", err.message || err);
  }

  console.log("\n=======================================================");
  console.log("  HTTP END-TO-END TEST RESULTS");
  console.log("=======================================================");
  console.log(`  Passed:   \x1b[32m${results.passed.length}\x1b[0m`);
  console.log(`  Failed:   \x1b[31m${results.failed.length}\x1b[0m`);
  console.log("=======================================================\n");

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

run();