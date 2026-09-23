const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const mode = process.argv[2] || "status";
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");

if (!fs.existsSync(schemaPath)) {
  console.error("schema.prisma not found!");
  process.exit(1);
}

let content = fs.readFileSync(schemaPath, "utf8");

if (mode === "enable" || mode === "postgres" || mode === "supabase") {
  console.log("Switching prisma/schema.prisma datasource to PostgreSQL (Supabase)...");
  
  content = content.replace(
    /datasource\s+db\s*\{[\s\S]*?\}/,
    `datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}`
  );

  fs.writeFileSync(schemaPath, content, "utf8");
  console.log("✔ Updated prisma/schema.prisma to PostgreSQL provider.");
  console.log("Generating Prisma client for PostgreSQL...");
  try {
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("✔ Prisma client successfully generated for PostgreSQL!");
  } catch (err) {
    console.error("Failed to generate Prisma client:", err.message);
  }
} else if (mode === "sqlite" || mode === "local") {
  console.log("Switching prisma/schema.prisma datasource to SQLite (local dev.db)...");

  content = content.replace(
    /datasource\s+db\s*\{[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );

  fs.writeFileSync(schemaPath, content, "utf8");
  console.log("✔ Updated prisma/schema.prisma to SQLite provider.");
  console.log("Generating Prisma client for SQLite...");
  try {
    execSync("npx prisma generate", { stdio: "inherit" });
    console.log("✔ Prisma client successfully generated for SQLite!");
  } catch (err) {
    console.error("Failed to generate Prisma client:", err.message);
  }
} else {
  const isPostgres = content.includes('provider  = "postgresql"') || content.includes('provider = "postgresql"');
  console.log("Current Prisma datasource:", isPostgres ? "PostgreSQL (Supabase)" : "SQLite (Local)");
  console.log("\nUsage:");
  console.log("  node scripts/switch-to-supabase.js enable  # Switch to Supabase PostgreSQL");
  console.log("  node scripts/switch-to-supabase.js sqlite  # Revert back to local SQLite");
}
