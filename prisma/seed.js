const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Cleaning and initializing Trash2Treasure Innovations database...");

  // Clean all existing temporary data and tasks
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskAttachment.deleteMany();
  await prisma.document.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const superAdminPasswordHash = await bcrypt.hash("Konda@nagaveni07", 10);

  // 1. Create Core Organization Departments
  const executiveDept = await prisma.department.create({
    data: {
      name: "Executive Leadership",
      code: "EXEC",
      description: "Strategic and executive governance",
    },
  });

  await prisma.department.create({
    data: {
      name: "Technology & Engineering",
      code: "TECH",
      description: "Software, IoT, AI platforms, and hardware engineering",
    },
  });

  await prisma.department.create({
    data: {
      name: "Operations & Logistics",
      code: "OPS",
      description: "Supply chain, recycling operations, sorting facilities, and fieldwork",
    },
  });

  await prisma.department.create({
    data: {
      name: "Finance & Accounts",
      code: "FIN",
      description: "Financial management, accounting, budget control, and compliance",
    },
  });

  await prisma.department.create({
    data: {
      name: "Marketing & Growth",
      code: "MKT",
      description: "Branding, corporate partnerships, customer acquisition, and circular impact",
    },
  });

  await prisma.department.create({
    data: {
      name: "Advisory Council",
      code: "ADV",
      description: "Strategic advisory, regulatory governance, and circular economy consultation",
    },
  });

  // 2. Create the Single Primary Super Admin (Vishnu)
  const superAdmin = await prisma.user.create({
    data: {
      email: "vishnu@trash2treasure.co.in",
      employeeId: "T2T-001",
      fullName: "Vishnu (Super Admin)",
      passwordHash: superAdminPasswordHash,
      mustChangePassword: false,
      role: "SUPER_ADMIN",
      departmentId: executiveDept.id,
      designation: "Chief Executive Officer & Founder",
      accountStatus: "ACTIVE",
      skills: "Leadership, Strategy, Circular Economy, System Architecture, Venture Building",
      avatarUrl: null,
    },
  });

  // 3. Initial system audit log
  await prisma.activityLog.create({
    data: {
      userId: superAdmin.id,
      action: "CREATED",
      objectType: "USER",
      objectId: superAdmin.id,
      objectTitle: "Trash2Treasure Innovations Platform Initialized",
      details: "Database initialized for Trash2Treasure Innovations LLP with Super Admin account.",
    },
  });

  console.log("✅ Trash2Treasure database cleaned and initialized successfully!");
  console.log("👑 Super Admin:", superAdmin.email, `(${superAdmin.employeeId})`);
  console.log("📁 Clean state: 0 temporary users, 0 temporary projects, 0 temporary tasks.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
