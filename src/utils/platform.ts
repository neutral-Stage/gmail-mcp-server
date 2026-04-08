import { exec } from "child_process";

/**
 * Open a URL in the default browser, cross-platform.
 */
export function openUrl(url: string): void {
  const platform = process.platform;
  let cmd: string;

  if (platform === "darwin") {
    cmd = `open "${url}"`;
  } else if (platform === "win32") {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }

  exec(cmd, (err) => {
    if (err) {
      console.error(`\n📋 Could not open browser automatically.`);
      console.error(`   Please open this URL manually:\n   ${url}\n`);
    }
  });
}

/**
 * Detect the current operating system as a friendly string.
 */
export function detectOS(): "macOS" | "Windows" | "Linux" {
  switch (process.platform) {
    case "darwin": return "macOS";
    case "win32": return "Windows";
    default: return "Linux";
  }
}

/**
 * Bold text for terminal output.
 */
export function bold(text: string): string {
  return `\x1b[1m${text}\x1b[0m`;
}

/**
 * Dim text for terminal output.
 */
export function dim(text: string): string {
  return `\x1b[2m${text}\x1b[0m`;
}

/**
 * Green text for terminal output.
 */
export function green(text: string): string {
  return `\x1b[32m${text}\x1b[0m`;
}

/**
 * Cyan text for terminal output.
 */
export function cyan(text: string): string {
  return `\x1b[36m${text}\x1b[0m`;
}

/**
 * Yellow text for terminal output.
 */
export function yellow(text: string): string {
  return `\x1b[33m${text}\x1b[0m`;
}

/**
 * Red text for terminal output.
 */
export function red(text: string): string {
  return `\x1b[31m${text}\x1b[0m`;
}
