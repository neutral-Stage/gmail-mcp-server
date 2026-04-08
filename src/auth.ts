import { OAuth2Client } from "google-auth-library";
import { createServer } from "http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { CREDENTIALS_PATH, TOKEN_DIR, TOKEN_PATH, SCOPES } from "./config.js";
import { openUrl } from "./utils/platform.js";

// ─── Credential loading ────────────────────────────────────────────────────────

export function loadCredentials(): { client_id: string; client_secret: string; redirect_uris?: string[] } {
  if (!existsSync(CREDENTIALS_PATH)) {
    throw new Error(
      `credentials.json not found at ${CREDENTIALS_PATH}.\n` +
      "Download it from Google Cloud Console → APIs & Services → Credentials.\n" +
      "Run `npx gmail-mcp-server setup` for a guided walkthrough."
    );
  }
  const raw = JSON.parse(readFileSync(CREDENTIALS_PATH, "utf8"));
  const creds = raw.installed ?? raw.web;
  if (!creds) throw new Error("Invalid credentials.json format. Expected 'installed' or 'web' key.");
  return creds;
}

// ─── OAuth2 client ──────────────────────────────────────────────────────────────

export function buildOAuth2Client(): OAuth2Client {
  const creds = loadCredentials();
  return new OAuth2Client(
    creds.client_id,
    creds.client_secret,
    creds.redirect_uris?.[0] ?? "http://localhost:3000/oauth2callback"
  );
}

export function getAuthClient(): OAuth2Client {
  if (!existsSync(TOKEN_PATH)) {
    throw new Error(
      "Not authenticated. Run `npx gmail-mcp-server auth` to authorize this app."
    );
  }
  const client = buildOAuth2Client();
  const token = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
  client.setCredentials(token);
  client.on("tokens", (t) => {
    const current = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
    writeFileSync(TOKEN_PATH, JSON.stringify({ ...current, ...t }), "utf8");
  });
  return client;
}

// ─── Auth flow ──────────────────────────────────────────────────────────────────

export async function runAuthFlow(): Promise<void> {
  const client = buildOAuth2Client();
  const creds = loadCredentials();
  const redirectUri = creds.redirect_uris?.[0] ?? "http://localhost:3000/oauth2callback";
  const url = new URL(redirectUri);
  const port = parseInt(url.port || (url.protocol === "https:" ? "443" : "80"), 10);

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  console.error(`\n🔐 Open this URL in your browser to authorize:\n`);
  console.error(`   ${authUrl}\n`);

  // Cross-platform browser open
  openUrl(authUrl);

  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const reqUrl = new URL(req.url ?? "/", `http://localhost:${port}`);
      const code = reqUrl.searchParams.get("code");
      if (code) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <body style="font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #1a1a2e; color: #e0e0e0;">
              <div style="text-align: center;">
                <h1 style="color: #00d4aa;">✅ Authorization Successful!</h1>
                <p>You can close this tab and return to your terminal.</p>
              </div>
            </body>
          </html>
        `);
        server.close();
        resolve(code);
      } else {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h2>Missing code parameter.</h2>");
        reject(new Error("Missing code"));
      }
    });
    server.listen(port, () =>
      console.error(`⏳ Waiting for OAuth callback on port ${port}…`)
    );
    setTimeout(() => {
      server.close();
      reject(new Error("Auth timeout (2 minutes). Please try again."));
    }, 120_000);
  });

  const { tokens } = await client.getToken(code);
  mkdirSync(TOKEN_DIR, { recursive: true });
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens), "utf8");
  console.error(`\n✅ Authentication successful! Token saved to ${TOKEN_PATH}\n`);
}
