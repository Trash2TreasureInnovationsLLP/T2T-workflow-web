const { execSync } = require("child_process");

function run(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe" }).toString().trim();
  } catch (err) {
    if (err.stdout) console.log(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    throw err;
  }
}

function autoPush() {
  console.log("🔍 Checking git working directory status...");
  const status = run("git status --porcelain");

  const customMsg = process.argv.slice(2).join(" ").trim();
  const now = new Date().toISOString().replace(/T/, " ").replace(/\..+/, "");
  const commitMsg = customMsg || `auto-update: ${now}`;

  if (status.length > 0) {
    console.log("📦 Staging changes...");
    run("git add -A");

    console.log(`📝 Committing: "${commitMsg}"...`);
    run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
  } else {
    console.log("✨ Working tree clean. Checking for unpushed commits...");
  }

  console.log("🚀 Pushing to GitHub remote...");
  const pushOutput = run("git push origin HEAD");
  if (pushOutput) console.log(pushOutput);

  console.log("✅ Successfully synced and pushed to GitHub!");
}

try {
  autoPush();
} catch (error) {
  console.error("❌ Git push failed:", error.message);
  process.exit(1);
}
