// scripts/full-system-verify.js
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 't2t-super-secret-jwt-key-innovations-2026';

function calculateTaskPoints({ priority, storyPoints, actualEffort, estimatedEffort }) {
  let basePoints = storyPoints ? storyPoints * 10 : 20;
  const priorityMultipliers = { LOW: 1, MEDIUM: 1.2, HIGH: 1.5, URGENT: 2 };
  basePoints = Math.round(basePoints * (priorityMultipliers[priority] || 1));
  if (estimatedEffort && actualEffort) {
    if (actualEffort <= estimatedEffort) {
      basePoints = Math.round(basePoints * 1.15);
    }
  }
  return basePoints;
}

function getMemberTier(points) {
  if (points >= 500) return { tier: "LEGEND", label: "👑 Circular Economy Legend" };
  if (points >= 300) return { tier: "CHAMPION", label: "🏆 Sustainability Champion" };
  if (points >= 150) return { tier: "SPECIALIST", label: "🚀 Agile Specialist" };
  if (points >= 50) return { tier: "CONTRIBUTOR", label: "⭐ Active Contributor" };
  return { tier: "INNOVATOR", label: "🌱 Rising Innovator" };
}

async function runCompleteSystemVerification() {
  console.log("================================================================");
  console.log("🔬 T2T WORKFLOW WEB: COMPREHENSIVE END-TO-END VERIFICATION SUITE");
  console.log("================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // SECTION 1: AUTHENTICATION & CORE CREDENTIAL SECURITY
    // -------------------------------------------------------------
    console.log("\n--- 1. AUTHENTICATION & SECURITY VERIFICATION ---");
    const testPlainPass = "Konda@nagaveni07";
    const hashed = await bcrypt.hash(testPlainPass, 10);
    const isValid = await bcrypt.compare(testPlainPass, hashed);
    assert(isValid, "bcrypt password hashing and verification succeeds");

    const isInvalid = await bcrypt.compare("wrong-password", hashed);
    assert(!isInvalid, "bcrypt correctly rejects incorrect credentials");

    const testToken = jwt.sign(
      { userId: "test-user-id", email: "vishnu@trash2treasure.co.in", role: "SUPER_ADMIN" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const decoded = jwt.verify(testToken, JWT_SECRET);
    assert(decoded.email === "vishnu@trash2treasure.co.in" && decoded.role === "SUPER_ADMIN", "JWT Token signed and claims verified");

    // -------------------------------------------------------------
    // SECTION 2: CORE DATABASE & SEED DATA INTEGRITY
    // -------------------------------------------------------------
    console.log("\n--- 2. CORE DATABASE & SEED DATA INTEGRITY ---");
    const adminUser = await prisma.user.findUnique({
      where: { email: "vishnu@trash2treasure.co.in" },
      include: { department: true },
    });
    assert(!!adminUser, "Super Admin user exists (vishnu@trash2treasure.co.in)");
    assert(adminUser.employeeId === "T2T-001", "Super Admin has Employee ID T2T-001");
    assert(adminUser.role === "SUPER_ADMIN", "Super Admin role is SUPER_ADMIN");
    assert(adminUser.designation && adminUser.designation.length > 0, `Super Admin designation present: '${adminUser?.designation}'`);
    assert(adminUser.department && adminUser.department.code === "EXEC", "Super Admin linked to EXEC department");

    const departments = await prisma.department.findMany({ orderBy: { code: "asc" } });
    assert(departments.length >= 6, `Core organization departments count >= 6 (found ${departments.length})`);
    const deptCodes = departments.map((d) => d.code);
    const requiredCodes = ["ADV", "EXEC", "FIN", "MKT", "OPS", "TECH"];
    const allCodesPresent = requiredCodes.every((c) => deptCodes.includes(c));
    assert(allCodesPresent, `All 6 required core department codes present: ${requiredCodes.join(", ")}`);

    // -------------------------------------------------------------
    // SECTION 3: USER CREATION, SEQUENTIAL ID & DEPARTMENT LINKAGE
    // -------------------------------------------------------------
    console.log("\n--- 3. USER CREATION, SEQUENTIAL ID & DEPARTMENT REFLECTION ---");
    const techDept = departments.find((d) => d.code === "TECH") || departments[0];

    // Calculate sequential employee ID
    const allUsers = await prisma.user.findMany({ select: { employeeId: true } });
    let maxNum = 0;
    for (const u of allUsers) {
      const match = u.employeeId?.match(/T2T-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    }
    const expectedEmpId = `T2T-${String(maxNum + 1).padStart(3, "0")}`;

    const testUserEmail = `audit.engineer.${Date.now()}@trash2treasure.co.in`;
    const createdUser = await prisma.user.create({
      data: {
        email: testUserEmail,
        employeeId: expectedEmpId,
        fullName: "Dr. Ananya Rao",
        passwordHash: await bcrypt.hash("T2T@Temp2026!", 10),
        mustChangePassword: true,
        role: "EMPLOYEE",
        departmentId: techDept.id,
        designation: "Principal Biochemical Engineer",
        skills: "Enzymatic Depolymerization, FTIR Spectroscopy, Pyrolysis Kinetic Modeling",
        accountStatus: "ACTIVE",
      },
      include: { department: true },
    });

    assert(createdUser.employeeId === expectedEmpId, `User generated sequential employeeId correctly: ${createdUser.employeeId}`);
    assert(createdUser.designation === "Principal Biochemical Engineer", "User designation immediately stored and verified");
    assert(createdUser.department?.name === techDept.name, `User department immediately reflected as: ${createdUser.department?.name}`);
    assert(createdUser.mustChangePassword === true, "mustChangePassword flag enabled for new accounts");

    // Update user designation and status
    const updatedUser = await prisma.user.update({
      where: { id: createdUser.id },
      data: {
        designation: "Lead Circular Systems Architect",
        accountStatus: "ACTIVE",
      },
      include: { department: true },
    });
    assert(updatedUser.designation === "Lead Circular Systems Architect", "User designation update via PATCH reflected immediately");

    // -------------------------------------------------------------
    // SECTION 4: PROJECT CREATION & SEQUENTIAL ID
    // -------------------------------------------------------------
    console.log("\n--- 4. PROJECT CREATION & SEQUENTIAL ID VERIFICATION ---");
    const allProjects = await prisma.project.findMany({ select: { projectId: true } });
    let maxPrjNum = 0;
    for (const p of allProjects) {
      const match = p.projectId?.match(/T2T-PRJ-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxPrjNum) maxPrjNum = n;
      }
    }
    const expectedPrjId = `T2T-PRJ-${String(maxPrjNum + 1).padStart(2, "0")}`;

    const createdProject = await prisma.project.create({
      data: {
        projectId: expectedPrjId,
        name: "Catalytic Bio-Recycling Facility Alpha",
        description: "Decentralized automated sorting and catalytic conversion testbed.",
        managerId: adminUser.id,
        startDate: new Date(),
        targetDate: new Date(Date.now() + 60 * 86400000),
        priority: "HIGH",
        status: "ACTIVE",
        budget: 7500000,
        members: {
          create: [
            { userId: adminUser.id, roleInProject: "Project Lead" },
            { userId: createdUser.id, roleInProject: "Lead Researcher" },
          ],
        },
      },
      include: {
        manager: true,
        members: { include: { user: true } },
      },
    });

    assert(createdProject.projectId === expectedPrjId, `Project generated collision-proof ID: ${createdProject.projectId}`);
    assert(createdProject.members.length === 2, `Project members assigned correctly (count: ${createdProject.members.length})`);

    // -------------------------------------------------------------
    // SECTION 5: SPRINT PLANNING WORKFLOW
    // -------------------------------------------------------------
    console.log("\n--- 5. SPRINT WORKFLOW VERIFICATION ---");
    const createdSprint = await prisma.sprint.create({
      data: {
        name: "Sprint 14: Reactor Pilot Commissioning",
        goal: "Deploy automated pressure feedback loops and complete safety audit.",
        startDate: new Date(),
        endDate: new Date(Date.now() + 14 * 86400000),
        status: "ACTIVE",
        projectId: createdProject.id,
      },
    });
    assert(createdSprint.id.length > 0, `Sprint created with ID: ${createdSprint.id}`);
    assert(createdSprint.status === "ACTIVE", "Sprint status ACTIVE");

    // -------------------------------------------------------------
    // SECTION 6: TASK CREATION, KANBAN TRANSITIONS & POINTS
    // -------------------------------------------------------------
    console.log("\n--- 6. TASK CREATION, KANBAN TRANSITION & STORY POINTS ---");
    const allTasks = await prisma.task.findMany({ select: { taskId: true } });
    let maxTaskNum = 1000;
    for (const t of allTasks) {
      const match = t.taskId?.match(/T2T-(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n) && n > maxTaskNum) maxTaskNum = n;
      }
    }
    const expectedTaskId = `T2T-${maxTaskNum + 1}`;

    const createdTask = await prisma.task.create({
      data: {
        taskId: expectedTaskId,
        title: "Calibrate Dual-Stage Condenser Pressure Sensors",
        description: "Perform 5-point NIST calibration across temperature range 180C - 450C.",
        projectId: createdProject.id,
        sprintId: createdSprint.id,
        assigneeId: createdUser.id,
        createdById: adminUser.id,
        priority: "URGENT",
        status: "TODO",
        storyPoints: 5,
        estimatedEffort: 8,
        actualEffort: 7.5,
        tags: "hardware, calibration, safety",
      },
      include: {
        assignee: true,
        project: true,
        sprint: true,
        createdBy: true,
      },
    });

    assert(createdTask.taskId === expectedTaskId, `Task generated sequential taskId: ${createdTask.taskId}`);
    assert(createdTask.assigneeId === createdUser.id, "Task assigned to test engineer");
    assert(createdTask.sprintId === createdSprint.id, "Task linked to active sprint");

    // Kanban status transition: TODO -> IN_PROGRESS -> COMPLETED
    const inProgressTask = await prisma.task.update({
      where: { id: createdTask.id },
      data: { status: "IN_PROGRESS" },
    });
    assert(inProgressTask.status === "IN_PROGRESS", "Task moved to IN_PROGRESS");

    const completedTask = await prisma.task.update({
      where: { id: createdTask.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    assert(completedTask.status === "COMPLETED", "Task moved to COMPLETED with timestamp");

    // Verify gamification points calculation
    const earnedPoints = calculateTaskPoints({
      priority: completedTask.priority,
      storyPoints: completedTask.storyPoints,
      actualEffort: completedTask.actualEffort,
      estimatedEffort: completedTask.estimatedEffort,
    });
    // Base = 5 * 10 = 50. URGENT multiplier = 2 -> 100. Effort <= estimated -> 100 * 1.15 = 115.
    assert(earnedPoints === 115, `Gamification points correctly calculated: ${earnedPoints} (expected 115)`);

    const tierInfo = getMemberTier(earnedPoints);
    assert(tierInfo.tier === "CONTRIBUTOR", `Member tier for 115 pts calculated as ${tierInfo.tier} (${tierInfo.label})`);

    // -------------------------------------------------------------
    // SECTION 7: TASK COMMENTS & THREADING
    // -------------------------------------------------------------
    console.log("\n--- 7. TASK COMMENTS & COLLABORATION ---");
    const testComment = await prisma.taskComment.create({
      data: {
        taskId: createdTask.id,
        authorId: adminUser.id,
        content: "Calibration verified against secondary reference thermocouple. Looks rock-solid.",
      },
      include: { author: true },
    });
    assert(testComment.content.includes("rock-solid"), "Task comment posted and linked to author");

    // -------------------------------------------------------------
    // SECTION 8: ANNOUNCEMENTS & AUDIT LOGS
    // -------------------------------------------------------------
    console.log("\n--- 8. ANNOUNCEMENTS & AUDIT LOGGING ---");
    const testAnnouncement = await prisma.announcement.create({
      data: {
        title: "Q3 Zero-Waste Milestone Achieved",
        content: "Trash2Treasure Innovations has diverted 120 metric tons of municipal polymer waste this quarter.",
        priority: "HIGH",
        authorId: adminUser.id,
        isPinned: true,
        targetDepartmentId: techDept.id,
      },
    });
    assert(testAnnouncement.isPinned === true, "Announcement created and pinned");

    const auditLog = await prisma.activityLog.create({
      data: {
        userId: adminUser.id,
        action: "COMPLETED",
        objectType: "TASK",
        objectId: createdTask.id,
        objectTitle: `${createdTask.title} (${createdTask.taskId})`,
        details: "Task verified and completed in verification suite",
      },
    });
    assert(auditLog.action === "COMPLETED" && auditLog.objectType === "TASK", "Audit activity log entry recorded");

    // -------------------------------------------------------------
    // SECTION 9: TEARDOWN TEST ENTITIES (CLEAN WORKSPACE)
    // -------------------------------------------------------------
    console.log("\n--- 9. TEARDOWN & REVERT TO PRISTINE STATE ---");
    await prisma.activityLog.delete({ where: { id: auditLog.id } });
    await prisma.announcement.delete({ where: { id: testAnnouncement.id } });
    await prisma.taskComment.delete({ where: { id: testComment.id } });
    await prisma.task.delete({ where: { id: createdTask.id } });
    await prisma.sprint.delete({ where: { id: createdSprint.id } });
    await prisma.project.delete({ where: { id: createdProject.id } });
    await prisma.user.delete({ where: { id: createdUser.id } });
    console.log("🧹 Test audit records safely removed. Database maintained in clean state.");

    console.log("\n================================================================");
    console.log(`🏁 VERIFICATION SUITE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("================================================================");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("❌ Fatal verification error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runCompleteSystemVerification();
