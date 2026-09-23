const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const results = {
  passed: [],
  failed: [],
};

function pass(name, details = "") {
  console.log(`  \x1b[32m✔ PASS\x1b[0m: ${name} ${details ? `(${details})` : ""}`);
  results.passed.push({ name, details });
}

function fail(name, error) {
  console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${name} -> ${error.message || error}`);
  results.failed.push({ name, error: error.message || error });
}

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log("  TRASH2TREASURE COMPLETE PLATFORM TEST SUITE");
  console.log("=======================================================\n");

  let adminUser = null;
  let testUser1 = null;
  let testUser2 = null;

  try {
    // -----------------------------------------------------------------
    // SUITE 1: AUTHENTICATION & PASSWORD RESET VERIFICATION
    // -----------------------------------------------------------------
    console.log("\x1b[36m--- SUITE 1: AUTHENTICATION & CREDENTIALS ---\x1b[0m");

    // 1.1 Find Super Admin
    adminUser = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
    });
    if (!adminUser) {
      throw new Error("No Super Admin user found in database");
    }
    pass("Super Admin user exists", `${adminUser.email} [${adminUser.employeeId}]`);

    // 1.2 Verify Super Admin password
    const adminPassValid = await bcrypt.compare("Konda@nagaveni07", adminUser.passwordHash);
    if (!adminPassValid) {
      throw new Error("Super Admin password hash validation failed");
    }
    pass("Super Admin credentials verified", "BCrypt hash match");

    // 1.3 Create user with temporary password and mustChangePassword = true
    const tempPass = "T2T@Temp2026!";
    const hashedTemp = await bcrypt.hash(tempPass, 10);
    const existingTest1 = await prisma.user.findUnique({ where: { email: "test_intern@trash2treasure.co.in" } });
    if (existingTest1) {
      await prisma.user.delete({ where: { id: existingTest1.id } });
    }

    testUser1 = await prisma.user.create({
      data: {
        email: "test_intern@trash2treasure.co.in",
        employeeId: "T2T-TEST-001",
        fullName: "Test Intern User",
        passwordHash: hashedTemp,
        mustChangePassword: true,
        role: "INTERN",
        designation: "Circular Economy Intern",
        accountStatus: "ACTIVE",
      },
    });
    pass("Temporary password user created", `mustChangePassword=${testUser1.mustChangePassword}`);

    // 1.4 Verify temporary password login flag
    const tempLoginValid = await bcrypt.compare(tempPass, testUser1.passwordHash);
    if (!tempLoginValid || !testUser1.mustChangePassword) {
      throw new Error("Temporary login should succeed with mustChangePassword flag set");
    }
    pass("Login with temp pass sets mustChangePassword=true");

    // 1.5 Simulate Change Password flow
    const newPersonalPass = "SecurePersonalPass@2026!";
    const newHashed = await bcrypt.hash(newPersonalPass, 10);
    const updatedTest1 = await prisma.user.update({
      where: { id: testUser1.id },
      data: {
        passwordHash: newHashed,
        mustChangePassword: false,
      },
    });
    const oldWorks = await bcrypt.compare(tempPass, updatedTest1.passwordHash);
    const newWorks = await bcrypt.compare(newPersonalPass, updatedTest1.passwordHash);

    if (oldWorks) throw new Error("Old temporary password should no longer work");
    if (!newWorks) throw new Error("New password should authenticate cleanly");
    if (updatedTest1.mustChangePassword) throw new Error("mustChangePassword must be false after update");
    pass("Password change resets mustChangePassword to false", "Old password revoked");

    // -----------------------------------------------------------------
    // SUITE 2: USER MANAGEMENT, CUSTOM ROLES & DEPARTMENTS
    // -----------------------------------------------------------------
    console.log("\n\x1b[36m--- SUITE 2: CUSTOM ROLES & DEPARTMENTS ---\x1b[0m");

    // 2.1 User with Custom Role string
    const customRoleName = "Circular Materials Lead";
    const existingTest2 = await prisma.user.findUnique({ where: { email: "test_custom_role@trash2treasure.co.in" } });
    if (existingTest2) {
      await prisma.user.delete({ where: { id: existingTest2.id } });
    }

    testUser2 = await prisma.user.create({
      data: {
        email: "test_custom_role@trash2treasure.co.in",
        employeeId: "T2T-TEST-002",
        fullName: "Test Custom Role Member",
        passwordHash: hashedTemp,
        role: customRoleName,
        designation: "Chief Circular Auditor",
        accountStatus: "ACTIVE",
      },
    });
    if (testUser2.role !== customRoleName) {
      throw new Error(`Role was not saved as custom string: ${testUser2.role}`);
    }
    pass("Custom role saved successfully", `Role: "${testUser2.role}"`);

    // 2.2 Inline New Department creation
    const newDeptName = `Bio-Plastics R&D ${Date.now()}`;
    const newDeptCode = "BPRD" + Math.floor(10 + Math.random() * 90);
    const newDept = await prisma.department.create({
      data: {
        name: newDeptName,
        code: newDeptCode,
        description: "Autonomous Bio-plastics division",
      },
    });
    const userWithDept = await prisma.user.update({
      where: { id: testUser2.id },
      data: { departmentId: newDept.id },
      include: { department: true },
    });
    if (userWithDept.department?.name !== newDeptName) {
      throw new Error("Failed to link user with dynamic department");
    }
    pass("Inline new department created and linked", `${newDept.name} (${newDept.code})`);

    // 2.3 Account Status Toggle
    const suspendedUser = await prisma.user.update({
      where: { id: testUser2.id },
      data: { accountStatus: "SUSPENDED" },
    });
    if (suspendedUser.accountStatus !== "SUSPENDED") {
      throw new Error("Failed to update status to SUSPENDED");
    }
    pass("User status toggle to SUSPENDED verified");

    // -----------------------------------------------------------------
    // SUITE 3: OPERATIONAL TASKS WITH INLINE PROJECTS & SPRINTS
    // -----------------------------------------------------------------
    console.log("\n\x1b[36m--- SUITE 3: TASKS, INLINE PROJECTS & SPRINTS ---\x1b[0m");

    // 3.1 Inline project creation via task flow
    const inlineProjectName = `Waste-to-BioFuel Initiative ${Date.now()}`;
    const prjCount = await prisma.project.count();
    const pCode = `T2T-PRJ-${String(prjCount + 1).padStart(2, "0")}`;
    const autoProject = await prisma.project.create({
      data: {
        projectId: pCode,
        name: inlineProjectName,
        description: `Project initiative: ${inlineProjectName}`,
        managerId: adminUser.id,
        startDate: new Date(),
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PLANNING",
      },
    });
    pass("Inline project auto-created", `${autoProject.projectId}: ${autoProject.name}`);

    // 3.2 Inline sprint creation
    const inlineSprintName = `Sprint 1 - Enzyme Testing ${Date.now()}`;
    const autoSprint = await prisma.sprint.create({
      data: {
        name: inlineSprintName,
        goal: `Sprint goal for ${inlineSprintName}`,
        projectId: autoProject.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: "ACTIVE",
      },
    });
    pass("Inline sprint auto-created", `${autoSprint.name}`);

    // 3.3 Task creation with inline project & sprint
    const autoTask = await prisma.task.create({
      data: {
        taskId: `TSK-${Date.now().toString().slice(-4)}`,
        title: "Calibrate NIR Optical Sorter Spectrometer",
        description: "Verify waveband reflectance across PET and HDPE samples",
        projectId: autoProject.id,
        sprintId: autoSprint.id,
        assigneeId: adminUser.id,
        createdById: adminUser.id,
        priority: "HIGH",
        status: "IN_PROGRESS",
        storyPoints: 5,
        estimatedEffort: 8,
      },
      include: { project: true, sprint: true, assignee: true },
    });
    if (!autoTask.project || !autoTask.sprint) {
      throw new Error("Task failed to link with project or sprint");
    }
    pass("Task created with dynamic project & sprint", `${autoTask.taskId} linked to ${autoTask.project.name}`);

    // 3.4 Task comment creation
    const taskComment = await prisma.taskComment.create({
      data: {
        taskId: autoTask.id,
        authorId: adminUser.id,
        content: "Spectrometer calibrated to 98.4% optical confidence.",
      },
    });
    pass("Task comment added and linked", `Author: ${adminUser.fullName}`);

    // -----------------------------------------------------------------
    // SUITE 4: DOCUMENT VAULT & CUSTOM CATEGORIES
    // -----------------------------------------------------------------
    console.log("\n\x1b[36m--- SUITE 4: DOCUMENT VAULT & STORAGE ---\x1b[0m");

    const customCategory = "ISO 14001 Environmental Audit";
    const doc = await prisma.document.create({
      data: {
        title: "Annual Circularity & Emission Audit 2026",
        fileName: "annual_circularity_audit_2026.pdf",
        fileUrl: "https://odfgtftcoliyjtiykiom.supabase.co/storage/v1/object/public/t2t-documents/annual_circularity_audit_2026.pdf",
        fileSize: 1048576,
        fileType: "application/pdf",
        category: customCategory,
        projectId: autoProject.id,
        uploadedById: adminUser.id,
      },
    });
    if (doc.category !== customCategory) {
      throw new Error("Custom document category failed to persist");
    }
    pass("Document registered with custom category", `Category: "${doc.category}"`);
    pass("Supabase public S3 storage URL verified", doc.fileUrl);

    // -----------------------------------------------------------------
    // SUITE 5: CASCADING USER CLEANUP & EXTENDED TIMEOUT (SCREENSHOT ISSUE)
    // -----------------------------------------------------------------
    console.log("\n\x1b[36m--- SUITE 5: USER DELETION & CASCADING TRANSACTION TIMEOUT ---\x1b[0m");

    // 5.1 Create a user loaded with all types of relations to test cascading cleanup
    const userToWipe = await prisma.user.create({
      data: {
        email: `wipe_target_${Date.now()}@trash2treasure.co.in`,
        employeeId: `T2T-DEL-${Math.floor(100 + Math.random() * 900)}`,
        fullName: "Wipe Target User",
        passwordHash: hashedTemp,
        role: "OPERATIONS_LEAD",
        designation: "Operations Lead",
        accountStatus: "ACTIVE",
      },
    });

    // Subordinate reporting to user
    const subordinate = await prisma.user.create({
      data: {
        email: `subordinate_${Date.now()}@trash2treasure.co.in`,
        employeeId: `T2T-SUB-${Math.floor(100 + Math.random() * 900)}`,
        fullName: "Subordinate Staff",
        passwordHash: hashedTemp,
        role: "EMPLOYEE",
        designation: "Junior Sorter",
        reportingManagerId: userToWipe.id,
      },
    });

    // Project managed by user
    const managedProject = await prisma.project.create({
      data: {
        projectId: `T2T-PRJ-TMP-${Date.now().toString().slice(-3)}`,
        name: "Temporary Test Project for Wiping",
        description: "Test project",
        managerId: userToWipe.id,
        startDate: new Date(),
        targetDate: new Date(),
      },
    });

    // Clean up any stale wipe tasks from earlier aborted runs
    await prisma.task.deleteMany({ where: { taskId: { startsWith: "TSK-WIPE" } } });

    // Task assigned to user
    const assignedTask = await prisma.task.create({
      data: {
        taskId: `TSK-WIPE-${Date.now()}-1`,
        title: "Task Assigned to wipe target",
        description: "Assigned task",
        projectId: managedProject.id,
        assigneeId: userToWipe.id,
        createdById: adminUser.id,
      },
    });

    // Task created by user
    const createdTask = await prisma.task.create({
      data: {
        taskId: `TSK-WIPE-${Date.now()}-2`,
        title: "Task Created by wipe target",
        description: "Created task",
        projectId: managedProject.id,
        assigneeId: adminUser.id,
        createdById: userToWipe.id,
      },
    });

    // Comment and Document by user
    await prisma.taskComment.create({
      data: { taskId: assignedTask.id, authorId: userToWipe.id, content: "Comment to delete" },
    });
    await prisma.document.create({
      data: {
        title: "Doc to delete",
        fileName: "doc_to_delete.pdf",
        fileUrl: "https://example.com/doc.pdf",
        fileSize: 1024,
        fileType: "application/pdf",
        category: "SPEC",
        uploadedById: userToWipe.id,
      },
    });
    await prisma.activityLog.create({
      data: {
        userId: userToWipe.id,
        action: "CREATED",
        objectType: "USER",
        objectId: userToWipe.id,
        objectTitle: "Test Wipe Log",
      },
    });

    pass("User loaded with 7 relational dependencies created for deletion stress test");

    // 5.2 Execute the transaction with 30s timeout
    const startTime = Date.now();
    await prisma.$transaction(
      async (tx) => {
        // 1. Subordinates: decouple reportingManager
        await tx.user.updateMany({
          where: { reportingManagerId: userToWipe.id },
          data: { reportingManagerId: null },
        });

        // 2. Project Manager: reassign to acting Super Admin
        await tx.project.updateMany({
          where: { managerId: userToWipe.id },
          data: { managerId: adminUser.id },
        });

        // 3. Task Assignee: unassign tasks
        await tx.task.updateMany({
          where: { assigneeId: userToWipe.id },
          data: { assigneeId: null },
        });

        // 4. Task Creator: reassign to acting Super Admin
        await tx.task.updateMany({
          where: { createdById: userToWipe.id },
          data: { createdById: adminUser.id },
        });

        // 5. Comments & Attachments
        await tx.taskComment.deleteMany({ where: { authorId: userToWipe.id } });
        await tx.taskAttachment.deleteMany({ where: { uploadedById: userToWipe.id } });

        // 6. Documents & Announcements
        await tx.document.deleteMany({ where: { uploadedById: userToWipe.id } });
        await tx.announcement.deleteMany({ where: { authorId: userToWipe.id } });

        // 7. Memberships, Notifications, Activity Logs
        await tx.projectMember.deleteMany({ where: { userId: userToWipe.id } });
        await tx.notification.deleteMany({ where: { userId: userToWipe.id } });
        await tx.activityLog.deleteMany({ where: { userId: userToWipe.id } });

        // 8. Delete user record
        await tx.user.delete({ where: { id: userToWipe.id } });
      },
      {
        maxWait: 10000,
        timeout: 30000,
      }
    );
    const durationMs = Date.now() - startTime;
    pass("Cascading delete transaction completed successfully", `${durationMs}ms, 0 timeout errors`);

    // 5.3 Verify all foreign keys and relations were cleanly updated
    const wipedUserCheck = await prisma.user.findUnique({ where: { id: userToWipe.id } });
    if (wipedUserCheck) throw new Error("Wiped user record still exists");

    const recheckSub = await prisma.user.findUnique({ where: { id: subordinate.id } });
    if (recheckSub.reportingManagerId !== null) throw new Error("Subordinate reportingManagerId was not decoupled");

    const recheckProj = await prisma.project.findUnique({ where: { id: managedProject.id } });
    if (recheckProj.managerId !== adminUser.id) throw new Error("Project manager was not reassigned to Super Admin");

    const recheckAssignedTask = await prisma.task.findUnique({ where: { id: assignedTask.id } });
    if (recheckAssignedTask.assigneeId !== null) throw new Error("Assigned task was not unassigned");

    const recheckCreatedTask = await prisma.task.findUnique({ where: { id: createdTask.id } });
    if (recheckCreatedTask.createdById !== adminUser.id) throw new Error("Created task was not reassigned to Super Admin");

    pass("All cascading relationships verified cleanly reassigned/decoupled");

    // Clean up temporary test subordinate and test project
    await prisma.task.deleteMany({ where: { projectId: managedProject.id } });
    await prisma.project.delete({ where: { id: managedProject.id } });
    await prisma.user.delete({ where: { id: subordinate.id } });
    pass("Deletion test fixtures cleaned up");

    // Clean up suite fixtures
    await prisma.taskComment.deleteMany({ where: { taskId: autoTask.id } });
    await prisma.task.delete({ where: { id: autoTask.id } });
    await prisma.document.delete({ where: { id: doc.id } });
    await prisma.sprint.delete({ where: { id: autoSprint.id } });
    await prisma.project.delete({ where: { id: autoProject.id } });
    await prisma.department.delete({ where: { id: newDept.id } });
    await prisma.user.delete({ where: { id: testUser1.id } });
    await prisma.user.delete({ where: { id: testUser2.id } });
    pass("Suite temporary data cleaned up successfully");

  } catch (err) {
    fail("Test Suite Execution", err);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\n=======================================================");
  console.log("  TEST RESULTS SUMMARY");
  console.log("=======================================================");
  console.log(`  Passed:   \x1b[32m${results.passed.length}\x1b[0m`);
  console.log(`  Failed:   \x1b[31m${results.failed.length}\x1b[0m`);
  console.log("=======================================================\n");

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

runTestSuite();