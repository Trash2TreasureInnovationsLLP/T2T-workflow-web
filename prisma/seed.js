const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Trash2Treasure Innovations database...");

  // Clean existing data
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

  const defaultPasswordHash = await bcrypt.hash("T2T@Password2026!", 10);
  const superAdminPasswordHash = await bcrypt.hash("Konda@nagaveni07", 10);

  // 1. Create Departments
  const executiveDept = await prisma.department.create({
    data: { name: "Executive Leadership", code: "EXEC", description: "Strategic and executive oversight" },
  });
  const techDept = await prisma.department.create({
    data: { name: "Technology & Engineering", code: "TECH", description: "Software, IoT, AI, and hardware platforms" },
  });
  const opsDept = await prisma.department.create({
    data: { name: "Operations & Logistics", code: "OPS", description: "Supply chain, recycling operations, and fieldwork" },
  });
  const financeDept = await prisma.department.create({
    data: { name: "Finance & Accounts", code: "FIN", description: "Financial planning, accounting, and compliance" },
  });
  const marketingDept = await prisma.department.create({
    data: { name: "Marketing & Growth", code: "MKT", description: "Branding, customer acquisition, and circular partnerships" },
  });
  const advisoryDept = await prisma.department.create({
    data: { name: "Advisory Council", code: "ADV", description: "Strategic governance and circular economy counsel" },
  });

  // 2. Create Users
  // CEO / Super Admin
  const vishnu = await prisma.user.create({
    data: {
      email: "vishnu@trash2treasure.co.in",
      employeeId: "T2T-001",
      fullName: "Vishnu (CEO)",
      passwordHash: superAdminPasswordHash,
      mustChangePassword: false,
      role: "SUPER_ADMIN",
      departmentId: executiveDept.id,
      designation: "Chief Executive Officer & Founder",
      accountStatus: "ACTIVE",
      skills: "Leadership, Strategy, Circular Economy, System Architecture, Venture Building",
      avatarUrl: "/t2t-logo.png",
    },
  });

  // COO
  const saiNikhil = await prisma.user.create({
    data: {
      email: "coo@trash2treasure.co.in",
      employeeId: "T2T-002",
      fullName: "Sai Nikhil",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      role: "COO",
      departmentId: opsDept.id,
      designation: "Chief Operating Officer",
      accountStatus: "ACTIVE",
      reportingManagerId: vishnu.id,
      skills: "Agile Workflow, Operations Management, Supply Chain, Lean Manufacturing",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    },
  });

  // CTO
  const rajesh = await prisma.user.create({
    data: {
      email: "cto@trash2treasure.co.in",
      employeeId: "T2T-003",
      fullName: "Rajesh Kumar",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      role: "CTO",
      departmentId: techDept.id,
      designation: "Chief Technology Officer",
      accountStatus: "ACTIVE",
      reportingManagerId: vishnu.id,
      skills: "IoT Systems, Cloud Infrastructure, Next.js, AI Model Training, Microservices",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    },
  });

  // CFO
  const priya = await prisma.user.create({
    data: {
      email: "cfo@trash2treasure.co.in",
      employeeId: "T2T-004",
      fullName: "Priya Sharma",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      role: "CFO",
      departmentId: financeDept.id,
      designation: "Chief Financial Officer",
      accountStatus: "ACTIVE",
      reportingManagerId: vishnu.id,
      skills: "Financial Modeling, Budgeting, Risk Analysis, ERP Integration, Auditing",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    },
  });

  // CMO
  const anandhi = await prisma.user.create({
    data: {
      email: "cmo@trash2treasure.co.in",
      employeeId: "T2T-005",
      fullName: "Anandhi Sundaram",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      role: "CMO",
      departmentId: marketingDept.id,
      designation: "Chief Marketing Officer",
      accountStatus: "ACTIVE",
      reportingManagerId: vishnu.id,
      skills: "Growth Hacking, Corporate Partnerships, Brand Strategy, Digital Marketing",
      avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    },
  });

  // CAO (Advisory Role)
  const ramanathan = await prisma.user.create({
    data: {
      email: "cao@trash2treasure.co.in",
      employeeId: "T2T-006",
      fullName: "Dr. S. Ramanathan",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      role: "CAO",
      departmentId: advisoryDept.id,
      designation: "Chief Advisory Officer",
      accountStatus: "ACTIVE",
      reportingManagerId: vishnu.id,
      skills: "Regulatory Compliance, Environmental Policies, ESG Standards, Sustainable Economics",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Employee: Tech Lead
  const aarav = await prisma.user.create({
    data: {
      email: "aarav@trash2treasure.co.in",
      employeeId: "T2T-007",
      fullName: "Aarav Patel",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      role: "EMPLOYEE",
      departmentId: techDept.id,
      designation: "Senior Full-Stack Engineer",
      accountStatus: "ACTIVE",
      reportingManagerId: rajesh.id,
      skills: "React, Node.js, PostgreSQL, Docker, MQTT, TypeScript",
      avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Employee: Operations Lead
  const kavya = await prisma.user.create({
    data: {
      email: "kavya@trash2treasure.co.in",
      employeeId: "T2T-008",
      fullName: "Kavya Reddy",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      role: "EMPLOYEE",
      departmentId: opsDept.id,
      designation: "Logistics & Recycling Lead",
      accountStatus: "ACTIVE",
      reportingManagerId: saiNikhil.id,
      skills: "Vendor Management, Route Optimization, Material Recovery Facility Operations",
      avatarUrl: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80",
    },
  });

  // Intern: Developer
  const ananya = await prisma.user.create({
    data: {
      email: "ananya@trash2treasure.co.in",
      employeeId: "T2T-009",
      fullName: "Ananya Sen",
      passwordHash: defaultPasswordHash,
      mustChangePassword: false,
      role: "INTERN",
      departmentId: techDept.id,
      designation: "Software Engineering Intern",
      accountStatus: "ACTIVE",
      reportingManagerId: aarav.id,
      skills: "Python, OpenCV, Computer Vision, REST APIs",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    },
  });

  // New user with mustChangePassword = true (for demonstrating forced reset flow)
  const newIntern = await prisma.user.create({
    data: {
      email: "newbie@trash2treasure.co.in",
      employeeId: "T2T-010",
      fullName: "Rohan Malhotra (First Login Demo)",
      passwordHash: defaultPasswordHash,
      mustChangePassword: true,
      role: "INTERN",
      departmentId: opsDept.id,
      designation: "Circular Economy Research Intern",
      accountStatus: "ACTIVE",
      reportingManagerId: kavya.id,
      skills: "Data Research, Environmental Studies",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    },
  });

  // 3. Create Projects
  const prjSmartWaste = await prisma.project.create({
    data: {
      projectId: "T2T-PRJ-01",
      name: "Smart Waste Segregation IoT Platform",
      description: "Automated optical and spectroscopic sorting system for municipal plastic and electronic recyclables.",
      managerId: rajesh.id,
      startDate: new Date("2026-01-10"),
      targetDate: new Date("2026-10-31"),
      status: "ACTIVE",
      priority: "URGENT",
      progress: 68,
      budget: 850000,
      risks: "Supply chain delays for optical NIR sensors from overseas vendor.",
      blockers: "Calibration benchmark dataset pending validation by lab team.",
    },
  });

  const prjEWasteMarket = await prisma.project.create({
    data: {
      projectId: "T2T-PRJ-02",
      name: "E-Waste Circular B2B Marketplace",
      description: "Digital platform connecting corporate electronic waste producers with certified dismantlers and smelters.",
      managerId: saiNikhil.id,
      startDate: new Date("2026-02-01"),
      targetDate: new Date("2026-11-15"),
      status: "ACTIVE",
      priority: "HIGH",
      progress: 45,
      budget: 420000,
      risks: "State pollution control board licensing guidelines update.",
    },
  });

  const prjCarbonCredits = await prisma.project.create({
    data: {
      projectId: "T2T-PRJ-03",
      name: "Polymer Traceability & Carbon Offset Ledger",
      description: "Verifiable blockchain-anchored audit trail proving recycled polymer content for global carbon credits.",
      managerId: vishnu.id,
      startDate: new Date("2026-03-01"),
      targetDate: new Date("2026-12-20"),
      status: "ACTIVE",
      priority: "HIGH",
      progress: 52,
      budget: 600000,
    },
  });

  const prjFleetLogistics = await prisma.project.create({
    data: {
      projectId: "T2T-PRJ-04",
      name: "Municipal Collection Fleet Logistics Optimization",
      description: "AI-driven route optimization and fuel efficiency planner for 80+ collection trucks in Hyderabad metro.",
      managerId: saiNikhil.id,
      startDate: new Date("2025-08-01"),
      targetDate: new Date("2026-04-15"),
      status: "COMPLETED",
      priority: "MEDIUM",
      progress: 100,
      budget: 310000,
    },
  });

  // Project Members
  await prisma.projectMember.createMany({
    data: [
      { projectId: prjSmartWaste.id, userId: rajesh.id, roleInProject: "Technical Director" },
      { projectId: prjSmartWaste.id, userId: aarav.id, roleInProject: "Lead Developer" },
      { projectId: prjSmartWaste.id, userId: ananya.id, roleInProject: "Computer Vision Intern" },
      { projectId: prjEWasteMarket.id, userId: saiNikhil.id, roleInProject: "Operations Director" },
      { projectId: prjEWasteMarket.id, userId: kavya.id, roleInProject: "Marketplace Coordinator" },
      { projectId: prjCarbonCredits.id, userId: vishnu.id, roleInProject: "Executive Sponsor" },
      { projectId: prjCarbonCredits.id, userId: priya.id, roleInProject: "Financial Architect" },
      { projectId: prjCarbonCredits.id, userId: ramanathan.id, roleInProject: "Advisory Reviewer" },
    ],
  });

  // 4. Create Sprints
  const sprint14 = await prisma.sprint.create({
    data: {
      name: "Sprint 14: Vision Pipeline & NIR Ingestion",
      goal: "Deploy ultra-fast frame rate object detection inference on the edge conveyor controller.",
      startDate: new Date("2026-09-08"),
      endDate: new Date("2026-09-22"),
      status: "ACTIVE",
      projectId: prjSmartWaste.id,
      reviewNotes: "Achieved 92ms latency per batch. Outstanding edge inference speed.",
    },
  });

  const sprint15 = await prisma.sprint.create({
    data: {
      name: "Sprint 15: Edge Relay & Cloud Synchronization",
      goal: "Implement fault-tolerant offline buffering when telemetry internet drops on factory floor.",
      startDate: new Date("2026-09-23"),
      endDate: new Date("2026-10-07"),
      status: "PLANNED",
      projectId: prjSmartWaste.id,
    },
  });

  const sprint13 = await prisma.sprint.create({
    data: {
      name: "Sprint 13: Core Conveyor Hardware Interfacing",
      goal: "Integrate RS485 industrial bus protocol with STM32 controller and pneumatic actuator bank.",
      startDate: new Date("2026-08-25"),
      endDate: new Date("2026-09-07"),
      status: "COMPLETED",
      projectId: prjSmartWaste.id,
      retroNotes: "Hardware delivery was delayed by 2 days, but team doubled down and completed all story points on schedule.",
    },
  });

  // 5. Create Tasks
  const tasksData = [
    {
      taskId: "T2T-1001",
      title: "Calibrate NIR Spectrometer for HDPE vs PP sorting",
      description: "Tune wavelength detection thresholds between 1100nm and 1700nm to distinguish high-density polyethylene from polypropylene.",
      projectId: prjSmartWaste.id,
      sprintId: sprint14.id,
      assigneeId: aarav.id,
      createdById: rajesh.id,
      priority: "URGENT",
      status: "IN_PROGRESS",
      storyPoints: 5,
      estimatedEffort: 24,
      actualEffort: 16,
      tags: "Hardware, AI, Calibration",
      dueDate: new Date("2026-09-20"),
    },
    {
      taskId: "T2T-1002",
      title: "Develop YOLOv8 model for circuit board component classification",
      description: "Train detector to segment capacitors, IC chips, gold connectors, and transformers on scrapped PCB boards.",
      projectId: prjSmartWaste.id,
      sprintId: sprint14.id,
      assigneeId: ananya.id,
      createdById: aarav.id,
      priority: "HIGH",
      status: "IN_REVIEW",
      storyPoints: 8,
      estimatedEffort: 36,
      actualEffort: 32,
      tags: "AI, Vision, Python",
      dueDate: new Date("2026-09-21"),
    },
    {
      taskId: "T2T-1003",
      title: "Resolve pneumatic air pressure drop during peak rejection bursts",
      description: "Air compressor drops below 6 bar when firing >12 solenoid air valves per second.",
      projectId: prjSmartWaste.id,
      sprintId: sprint14.id,
      assigneeId: aarav.id,
      createdById: saiNikhil.id,
      priority: "URGENT",
      status: "BLOCKED",
      storyPoints: 5,
      estimatedEffort: 18,
      actualEffort: 10,
      tags: "Pneumatics, Hardware",
      blockers: "Requires secondary 50L pressure buffer accumulator tank delivery.",
      dueDate: new Date("2026-09-19"),
    },
    {
      taskId: "T2T-1004",
      title: "Build automated Daily Tonnage aggregation query for Super Admin dashboard",
      description: "Aggregate incoming payload gross vs tare weights across all active sorting lines.",
      projectId: prjSmartWaste.id,
      sprintId: sprint14.id,
      assigneeId: aarav.id,
      createdById: vishnu.id,
      priority: "MEDIUM",
      status: "COMPLETED",
      storyPoints: 3,
      estimatedEffort: 12,
      actualEffort: 10,
      tags: "Backend, SQL, Reporting",
      dueDate: new Date("2026-09-15"),
      completedAt: new Date("2026-09-15"),
    },
    {
      taskId: "T2T-1005",
      title: "Corporate Dismantler KYC Verification Flow",
      description: "Allow certified e-waste recycler companies to upload CPCB compliance licenses and ISO 14001 documents.",
      projectId: prjEWasteMarket.id,
      sprintId: null,
      assigneeId: kavya.id,
      createdById: saiNikhil.id,
      priority: "HIGH",
      status: "TODO",
      storyPoints: 5,
      estimatedEffort: 20,
      actualEffort: 0,
      tags: "Compliance, KYC, Operations",
      dueDate: new Date("2026-09-25"),
    },
    {
      taskId: "T2T-1006",
      title: "Automate Escrow payment release on QR delivery verification",
      description: "When scrap delivery is scanned and approved by receiving smelter, release payment via ICICI Bank corporate API.",
      projectId: prjEWasteMarket.id,
      sprintId: null,
      assigneeId: aarav.id,
      createdById: priya.id,
      priority: "HIGH",
      status: "TODO",
      storyPoints: 8,
      estimatedEffort: 30,
      actualEffort: 0,
      tags: "FinTech, Banking, Escrow",
      dueDate: new Date("2026-09-30"),
    },
    {
      taskId: "T2T-1007",
      title: "Draft Q3 Carbon Credit methodology paper for Verra registry",
      description: "Prepare comprehensive math model documenting avoidance of virgin plastic manufacturing emissions.",
      projectId: prjCarbonCredits.id,
      sprintId: null,
      assigneeId: ramanathan.id,
      createdById: vishnu.id,
      priority: "HIGH",
      status: "IN_PROGRESS",
      storyPoints: 13,
      estimatedEffort: 40,
      actualEffort: 22,
      tags: "ESG, Advisory, Carbon",
      dueDate: new Date("2026-10-10"),
    },
    {
      taskId: "T2T-1008",
      title: "Design mobile dispatch driver telemetry UI",
      description: "Low-distraction driver mobile screens for pickup confirmation and route deviation notifications.",
      projectId: prjFleetLogistics.id,
      sprintId: sprint13.id,
      assigneeId: aarav.id,
      createdById: saiNikhil.id,
      priority: "MEDIUM",
      status: "COMPLETED",
      storyPoints: 5,
      estimatedEffort: 16,
      actualEffort: 15,
      tags: "UI/UX, Mobile",
      dueDate: new Date("2026-09-05"),
      completedAt: new Date("2026-09-04"),
    },
    {
      taskId: "T2T-1009",
      title: "Backlog: Multi-spectrum camera auto-exposure compensation",
      description: "Handle varying sun intensity in semi-outdoor sorting shed without saturating RGB channels.",
      projectId: prjSmartWaste.id,
      sprintId: null,
      assigneeId: ananya.id,
      createdById: rajesh.id,
      priority: "LOW",
      status: "BACKLOG",
      storyPoints: 3,
      estimatedEffort: 15,
      actualEffort: 0,
      tags: "Backlog, Hardware",
      dueDate: new Date("2026-10-25"),
    },
    {
      taskId: "T2T-1010",
      title: "Auditing of Q2 Polymer batches for European export readiness",
      description: "Perform testing on batch T2T-PL-2026-08 to ensure zero RoHS banned phthalates.",
      projectId: prjCarbonCredits.id,
      sprintId: null,
      assigneeId: kavya.id,
      createdById: ramanathan.id,
      priority: "MEDIUM",
      status: "IN_REVIEW",
      storyPoints: 5,
      estimatedEffort: 16,
      actualEffort: 12,
      tags: "Audit, Quality, RoHS",
      dueDate: new Date("2026-09-22"),
    },
    {
      taskId: "T2T-1011",
      title: "Migrate edge sorting pipeline to containerized Docker deployment",
      description: "Package sorting runtime with CUDA libraries for deterministic deployment across all 4 plants.",
      projectId: prjSmartWaste.id,
      sprintId: sprint14.id,
      assigneeId: rajesh.id,
      createdById: vishnu.id,
      priority: "URGENT",
      status: "COMPLETED",
      storyPoints: 8,
      estimatedEffort: 30,
      actualEffort: 28,
      tags: "DevOps, Docker, Edge",
      dueDate: new Date("2026-09-12"),
      completedAt: new Date("2026-09-11"),
    },
    {
      taskId: "T2T-1012",
      title: "Establish hazardous lithium-ion battery extraction safety protocol",
      description: "Standard operating manual for secondary battery discharging and acid leakage containment.",
      projectId: prjEWasteMarket.id,
      sprintId: null,
      assigneeId: kavya.id,
      createdById: saiNikhil.id,
      priority: "URGENT",
      status: "COMPLETED",
      storyPoints: 5,
      estimatedEffort: 20,
      actualEffort: 18,
      tags: "Safety, Operations, Battery",
      dueDate: new Date("2026-09-14"),
      completedAt: new Date("2026-09-13"),
    },
    {
      taskId: "T2T-1013",
      title: "Municipal scrap collection route optimization - Zone 4",
      description: "Reduce truck turnaround travel time by 18% along Kukatpally and Balanagar commercial corridors.",
      projectId: prjFleetLogistics.id,
      sprintId: null,
      assigneeId: saiNikhil.id,
      createdById: vishnu.id,
      priority: "HIGH",
      status: "COMPLETED",
      storyPoints: 5,
      estimatedEffort: 24,
      actualEffort: 22,
      tags: "Logistics, Route, Fleet",
      dueDate: new Date("2026-09-10"),
      completedAt: new Date("2026-09-09"),
    },
    {
      taskId: "T2T-1014",
      title: "Synthetic dataset generation for crushed PET bottle shapes",
      description: "Generated 5,000 ray-traced deformed plastic bottles to train classifier against skewed lighting.",
      projectId: prjSmartWaste.id,
      sprintId: sprint14.id,
      assigneeId: ananya.id,
      createdById: aarav.id,
      priority: "HIGH",
      status: "COMPLETED",
      storyPoints: 5,
      estimatedEffort: 18,
      actualEffort: 16,
      tags: "AI, Dataset, Blender",
      dueDate: new Date("2026-09-14"),
      completedAt: new Date("2026-09-14"),
    },
    {
      taskId: "T2T-1015",
      title: "Finalize Extended Producer Responsibility (EPR) compliance audit",
      description: "Audit reports aligned with Central Pollution Control Board (CPCB) quarterly filings.",
      projectId: prjCarbonCredits.id,
      sprintId: null,
      assigneeId: priya.id,
      createdById: vishnu.id,
      priority: "HIGH",
      status: "COMPLETED",
      storyPoints: 5,
      estimatedEffort: 16,
      actualEffort: 14,
      tags: "Finance, Compliance, Audit",
      dueDate: new Date("2026-09-12"),
      completedAt: new Date("2026-09-11"),
    },
    {
      taskId: "T2T-1016",
      title: "Circular Economy Investor Pitch Deck & Series A Roadmap",
      description: "Structured 5-year unit economics for expanding automated sorting lines to 12 Indian states.",
      projectId: prjCarbonCredits.id,
      sprintId: null,
      assigneeId: vishnu.id,
      createdById: vishnu.id,
      priority: "URGENT",
      status: "COMPLETED",
      storyPoints: 8,
      estimatedEffort: 25,
      actualEffort: 24,
      tags: "Strategy, Executive, Fundraising",
      dueDate: new Date("2026-09-16"),
      completedAt: new Date("2026-09-15"),
    },
    {
      taskId: "T2T-1017",
      title: "E-Waste vendor onboarding security vetting",
      description: "Validate digital certificates and GST compliance of 24 smelting partners.",
      projectId: prjEWasteMarket.id,
      sprintId: null,
      assigneeId: kavya.id,
      createdById: saiNikhil.id,
      priority: "MEDIUM",
      status: "COMPLETED",
      storyPoints: 3,
      estimatedEffort: 12,
      actualEffort: 10,
      tags: "Vendors, KYC, Ops",
      dueDate: new Date("2026-09-08"),
      completedAt: new Date("2026-09-07"),
    },
    {
      taskId: "T2T-1018",
      title: "Sort shed emergency shutdown switch latency test",
      description: "Measure hard stop response time under simulated 50-item-per-minute throughput.",
      projectId: prjSmartWaste.id,
      sprintId: sprint14.id,
      assigneeId: rajesh.id,
      createdById: vishnu.id,
      priority: "HIGH",
      status: "COMPLETED",
      storyPoints: 5,
      estimatedEffort: 14,
      actualEffort: 12,
      tags: "Safety, IoT, Hardware",
      dueDate: new Date("2026-09-15"),
      completedAt: new Date("2026-09-15"),
    },
  ];

  for (const t of tasksData) {
    const createdTask = await prisma.task.create({ data: t });

    // Add comments
    await prisma.taskComment.create({
      data: {
        taskId: createdTask.id,
        authorId: vishnu.id,
        content: `Standardized operational checkpoint for ${t.title}. Please notify in daily standup if blockers arise.`,
      },
    });
  }

  // 6. Create Milestones
  await prisma.milestone.createMany({
    data: [
      {
        projectId: prjSmartWaste.id,
        title: "Pilot Conveyor Line Run in Cherlapally Facility",
        dueDate: new Date("2026-10-15"),
        status: "PENDING",
      },
      {
        projectId: prjSmartWaste.id,
        title: "Optical Spectrometry Sensor Calibration Validation",
        dueDate: new Date("2026-09-25"),
        status: "PENDING",
      },
      {
        projectId: prjEWasteMarket.id,
        title: "CPCB Recycler Network Launch with 20 Verified Partners",
        dueDate: new Date("2026-10-30"),
        status: "PENDING",
      },
      {
        projectId: prjFleetLogistics.id,
        title: "Full Municipal Fleet GPS & OBD-II Integration",
        dueDate: new Date("2026-04-01"),
        status: "COMPLETED",
        completedAt: new Date("2026-04-01"),
      },
    ],
  });

  // 7. Create Announcements
  await prisma.announcement.create({
    data: {
      title: "Q3 Operational Target: 1,500 Metric Tons of Circular Material Recovery",
      content: "All operational clusters and technology teams are on track for our quarterly audit. Please review the updated safety protocols for hydraulic sorting arms.",
      priority: "HIGH",
      authorId: vishnu.id,
      isPinned: true,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "New ESG & Compliance Reporting Standards (2026 Update)",
      content: "Advisory Council led by Dr. Ramanathan has published the revised documentation guidelines for carbon credits verification.",
      priority: "MEDIUM",
      authorId: ramanathan.id,
      isPinned: false,
    },
  });

  // 8. Create Activity Logs
  const sampleActivities = [
    {
      userId: vishnu.id,
      action: "CREATED",
      objectType: "PROJECT",
      objectTitle: "Smart Waste Segregation IoT Platform",
      newValue: "Active - High Priority",
      details: "Project charter initialized with 850,000 INR budget allocation",
    },
    {
      userId: saiNikhil.id,
      action: "STATUS_CHANGE",
      objectType: "TASK",
      objectTitle: "T2T-1003 Pneumatic pressure drop",
      previousValue: "IN_PROGRESS",
      newValue: "BLOCKED",
      details: "Flagged blocker: Waiting on 50L pressure buffer accumulator tank delivery",
    },
    {
      userId: aarav.id,
      action: "COMPLETED",
      objectType: "TASK",
      objectTitle: "T2T-1004 Daily Tonnage aggregation query",
      previousValue: "IN_REVIEW",
      newValue: "COMPLETED",
      details: "Passed all stress testing benchmarks with 10k mock conveyor payloads",
    },
    {
      userId: rajesh.id,
      action: "CREATED",
      objectType: "SPRINT",
      objectTitle: "Sprint 14: Vision Pipeline & NIR Ingestion",
      newValue: "ACTIVE",
      details: "Sprint started with 45 planned story points",
    },
    {
      userId: vishnu.id,
      action: "CREATED",
      objectType: "USER",
      objectTitle: "Rohan Malhotra (T2T-EMP-012)",
      newValue: "ACTIVE - Temporary Password Assigned",
      details: "Created new intern account under Operations department",
    },
  ];

  for (const act of sampleActivities) {
    await prisma.activityLog.create({ data: act });
  }

  // 9. Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: aarav.id,
        title: "Task Assigned",
        message: "You have been assigned to T2T-1001: Calibrate NIR Spectrometer",
        type: "TASK_ASSIGNED",
        link: "/tasks",
      },
      {
        userId: aarav.id,
        title: "Sprint 14 Active",
        message: "Sprint 14 has begun. Review your committed story points.",
        type: "SPRINT_UPDATE",
        link: "/agile",
      },
      {
        userId: vishnu.id,
        title: "Blocker Flagged in Core Operations",
        message: "Sai Nikhil marked T2T-1003 as BLOCKED due to hardware supply delivery.",
        type: "SYSTEM",
        link: "/kanban",
      },
    ],
  });

  console.log("✅ Trash2Treasure Innovations database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
