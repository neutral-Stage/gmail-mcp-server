#!/usr/bin/env node

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createInterface } from "readline";
import {
  VERSION,
  PACKAGE_NAME,
  CREDENTIALS_PATH,
  getClaudeDesktopConfigPath,
  getClaudeCodeConfigPath,
  getCursorConfigPath,
  getWindsurfConfigPath,
} from "./config.js";
import { runAuthFlow } from "./auth.js";
import { startServer } from "./server.js";
import { runDoctor } from "./doctor.js";
import { bold, green, cyan, yellow, dim, red, detectOS } from "./utils/platform.js";

// ─── CLI ────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0] ?? "serve";

async function main() {
  switch (command) {
    case "serve":
    case "start":
      await startServer();
      break;

    case "auth":
      await runAuthFlow();
      break;

    case "setup":
      await runSetup();
      break;

    case "doctor":
    case "check":
      await runDoctor();
      break;

    case "--version":
    case "-v":
      console.log(`${PACKAGE_NAME} v${VERSION}`);
      break;

    case "--help":
    case "-h":
    case "help":
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}\n`);
      printHelp();
      process.exit(1);
  }
}

function printHelp() {
  console.error(`
${bold("📧 Gmail MCP Server")} ${dim(`v${VERSION}`)}

${bold("Usage:")}
  npx ${PACKAGE_NAME} <command>

${bold("Commands:")}
  ${cyan("setup")}     Interactive setup wizard — configures your AI client
  ${cyan("auth")}      Run the OAuth2 authentication flow
  ${cyan("serve")}     Start the MCP server (stdio transport) ${dim("[default]")}
  ${cyan("doctor")}    Diagnose common issues
  ${cyan("--help")}    Show this help message
  ${cyan("--version")} Show version

${bold("Quick Start:")}
  1. ${dim("Get credentials from Google Cloud Console")}
  2. npx ${PACKAGE_NAME} setup
  3. ${dim("Restart your AI client — done!")}

${bold("Docs:")} https://github.com/sar333/gmail-mcp-server
`);
}

// ─── Setup wizard ───────────────────────────────────────────────────────────────

async function runSetup() {
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  console.error(`\n${bold("📧 Gmail MCP Server Setup Wizard")} ${dim(`v${VERSION}`)}\n`);
  console.error(`  OS detected: ${bold(detectOS())}\n`);

  // Step 1: Check credentials
  console.error(bold("─── Step 1: Google OAuth Credentials ───\n"));

  if (existsSync(CREDENTIALS_PATH)) {
    console.error(`  ${green("✓")} credentials.json found at ${dim(CREDENTIALS_PATH)}\n`);
  } else {
    console.error(`  ${yellow("⚠")} credentials.json not found at ${dim(CREDENTIALS_PATH)}\n`);
    console.error(`  To get your credentials:\n`);
    console.error(`  1. Go to ${cyan("https://console.cloud.google.com/")}`);
    console.error(`  2. Create a new project (or select existing)`);
    console.error(`  3. Enable ${bold("Gmail API")}: APIs & Services → Library → search "Gmail API"`);
    console.error(`  4. Configure OAuth consent screen → External → add your email as test user`);
    console.error(`  5. Create credentials → OAuth client ID → ${bold("Desktop app")}`);
    console.error(`  6. Download JSON and save as ${bold("credentials.json")}\n`);

    const credPath = await ask(`  Enter path to credentials.json (or press Enter to use default): `);
    if (credPath.trim()) {
      process.env.GMAIL_CREDENTIALS_PATH = credPath.trim();
    }

    if (!existsSync(process.env.GMAIL_CREDENTIALS_PATH ?? CREDENTIALS_PATH)) {
      console.error(`\n  ${red("✗")} Still can't find credentials.json. Please download it first.`);
      console.error(`    Then run ${cyan("npx gmail-mcp-server setup")} again.\n`);
      rl.close();
      process.exit(1);
    }
  }

  // Step 2: Choose client
  console.error(bold("─── Step 2: Choose Your AI Client ───\n"));
  console.error(`  1. ${bold("Claude Desktop")}`);
  console.error(`  2. ${bold("Claude Code")} (global)`);
  console.error(`  3. ${bold("Cursor")}`);
  console.error(`  4. ${bold("Windsurf")}`);
  console.error(`  5. ${bold("Other")} (print config for manual setup)\n`);

  const choice = await ask("  Select client [1-5]: ");
  const clientChoice = parseInt(choice.trim() || "1", 10);

  const mcpConfig = {
    command: "npx",
    args: ["-y", PACKAGE_NAME],
    ...(CREDENTIALS_PATH !== join(process.cwd(), "credentials.json")
      ? { env: { GMAIL_CREDENTIALS_PATH: CREDENTIALS_PATH } }
      : {}),
  };

  const configJson = { mcpServers: { gmail: mcpConfig } };

  let configPath: string;
  let existingConfig: Record<string, unknown> = {};

  switch (clientChoice) {
    case 1:
      configPath = getClaudeDesktopConfigPath();
      break;
    case 2:
      configPath = getClaudeCodeConfigPath(true);
      break;
    case 3:
      configPath = getCursorConfigPath();
      break;
    case 4:
      configPath = getWindsurfConfigPath();
      break;
    case 5:
    default:
      console.error(`\n${bold("─── Configuration JSON ───")}\n`);
      console.error(`  Add this to your client's MCP config:\n`);
      console.error(JSON.stringify(configJson, null, 2));
      console.error("");

      // Step 3: Auth
      const doAuth = await ask("  Run OAuth authentication now? [Y/n]: ");
      if (doAuth.trim().toLowerCase() !== "n") {
        rl.close();
        await runAuthFlow();
      } else {
        console.error(`\n  Run ${cyan("npx gmail-mcp-server auth")} when ready.\n`);
        rl.close();
      }
      return;
  }

  // Write config
  console.error(`\n  Config path: ${dim(configPath)}\n`);

  if (existsSync(configPath)) {
    try {
      existingConfig = JSON.parse(readFileSync(configPath, "utf8"));
    } catch {
      existingConfig = {};
    }
  }

  // Merge with existing config
  const merged = {
    ...existingConfig,
    mcpServers: {
      ...(existingConfig as Record<string, unknown>).mcpServers as Record<string, unknown> ?? {},
      gmail: mcpConfig,
    },
  };

  const confirm = await ask(`  Write config to ${configPath}? [Y/n]: `);
  if (confirm.trim().toLowerCase() !== "n") {
    mkdirSync(dirname(configPath), { recursive: true });
    writeFileSync(configPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
    console.error(`\n  ${green("✓")} Config written to ${configPath}`);
  } else {
    console.error(`\n  ${dim("Skipped. Here's the config to add manually:")}\n`);
    console.error(JSON.stringify(configJson, null, 2));
  }

  // Step 3: Auth
  console.error(`\n${bold("─── Step 3: OAuth Authentication ───")}\n`);
  const doAuth = await ask("  Run OAuth authentication now? [Y/n]: ");
  if (doAuth.trim().toLowerCase() !== "n") {
    rl.close();
    await runAuthFlow();
    console.error(`\n${green("🎉 Setup complete!")} Restart your AI client to start using Gmail tools.\n`);
  } else {
    console.error(`\n  Run ${cyan("npx gmail-mcp-server auth")} when you're ready.`);
    console.error(`  Then restart your AI client.\n`);
    rl.close();
  }
}

// ─── Run ────────────────────────────────────────────────────────────────────────

main().catch((err) => {
  console.error("Fatal error:", err.message ?? err);
  process.exit(1);
});
