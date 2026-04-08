import { existsSync } from "fs";
import { CREDENTIALS_PATH, TOKEN_PATH, VERSION } from "./config.js";
import { bold, green, red, yellow, dim } from "./utils/platform.js";

/**
 * Run diagnostic checks and report status.
 */
export async function runDoctor(): Promise<void> {
  console.error(`\n${bold("🩺 Gmail MCP Server Doctor")} ${dim(`v${VERSION}`)}\n`);

  let allGood = true;

  // Check Node.js version
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1).split(".")[0], 10);
  if (major >= 18) {
    console.error(`  ${green("✓")} Node.js ${nodeVersion}`);
  } else {
    console.error(`  ${red("✗")} Node.js ${nodeVersion} — requires >= 18`);
    allGood = false;
  }

  // Check credentials
  if (existsSync(CREDENTIALS_PATH)) {
    console.error(`  ${green("✓")} credentials.json found at ${dim(CREDENTIALS_PATH)}`);
    try {
      const raw = JSON.parse((await import("fs")).readFileSync(CREDENTIALS_PATH, "utf8"));
      const creds = raw.installed ?? raw.web;
      if (creds?.client_id && creds?.client_secret) {
        console.error(`  ${green("✓")} credentials.json is valid (${dim(creds.client_id.slice(0, 20) + "...")})`);
      } else {
        console.error(`  ${red("✗")} credentials.json is missing client_id or client_secret`);
        allGood = false;
      }
    } catch {
      console.error(`  ${red("✗")} credentials.json is not valid JSON`);
      allGood = false;
    }
  } else {
    console.error(`  ${red("✗")} credentials.json not found at ${dim(CREDENTIALS_PATH)}`);
    console.error(`    ${dim("→ Download from Google Cloud Console → APIs & Services → Credentials")}`);
    allGood = false;
  }

  // Check token
  if (existsSync(TOKEN_PATH)) {
    try {
      const token = JSON.parse((await import("fs")).readFileSync(TOKEN_PATH, "utf8"));
      if (token.access_token) {
        const expired = token.expiry_date && Date.now() > token.expiry_date;
        if (expired) {
          if (token.refresh_token) {
            console.error(`  ${yellow("⚠")} Token expired but has refresh token (will auto-refresh)`);
          } else {
            console.error(`  ${red("✗")} Token expired and no refresh token — run \`npx gmail-mcp-server auth\``);
            allGood = false;
          }
        } else {
          console.error(`  ${green("✓")} Token is valid ${dim(`(${TOKEN_PATH})`)}`);
        }
      } else {
        console.error(`  ${red("✗")} Token file exists but has no access_token`);
        allGood = false;
      }
    } catch {
      console.error(`  ${red("✗")} Token file is not valid JSON`);
      allGood = false;
    }
  } else {
    console.error(`  ${red("✗")} Not authenticated — run \`npx gmail-mcp-server auth\``);
    allGood = false;
  }

  // Check MCP SDK
  try {
    await import("@modelcontextprotocol/sdk/server/mcp.js");
    console.error(`  ${green("✓")} MCP SDK loaded`);
  } catch {
    console.error(`  ${red("✗")} MCP SDK not found — run \`npm install\``);
    allGood = false;
  }

  // Check googleapis
  try {
    await import("googleapis");
    console.error(`  ${green("✓")} Google APIs client loaded`);
  } catch {
    console.error(`  ${red("✗")} googleapis not found — run \`npm install\``);
    allGood = false;
  }

  console.error("");
  if (allGood) {
    console.error(`  ${green("🎉 All checks passed! Your Gmail MCP server is ready.")}\n`);
  } else {
    console.error(`  ${yellow("⚠  Some checks failed. Fix the issues above and run doctor again.")}\n`);
  }
}
