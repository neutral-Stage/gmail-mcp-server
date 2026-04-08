import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, safeGmailCall, toolSuccess } from "../gmail-client.js";

export function registerProfileTools(server: McpServer) {
  // ── get_profile ───────────────────────────────────────────────────────
  server.tool(
    "get_profile",
    "Get the authenticated user's Gmail profile: email address, total messages, total threads, and history ID.",
    {},
    async () => {
      const gmail = getGmail();
      const res = await safeGmailCall("get_profile", () =>
        gmail.users.getProfile({ userId: "me" })
      );
      return toolSuccess({
        emailAddress: res.data.emailAddress,
        messagesTotal: res.data.messagesTotal,
        threadsTotal: res.data.threadsTotal,
        historyId: res.data.historyId,
      });
    }
  );

  // ── get_frequent_contacts ─────────────────────────────────────────────
  server.tool(
    "get_frequent_contacts",
    "Analyze recent sent emails to find your most frequently contacted email addresses. No extra API scope needed.",
    {
      maxSent: z.number().int().min(10).max(500).default(100).describe("Number of recent sent emails to scan"),
    },
    async ({ maxSent }) => {
      const gmail = getGmail();
      const listRes = await safeGmailCall("get_frequent_contacts:list", () =>
        gmail.users.messages.list({ userId: "me", q: "in:sent", maxResults: maxSent })
      );
      const messages = listRes.data.messages ?? [];

      const contacts = new Map<string, { email: string; name: string; count: number }>();
      const parseRecipients = (value: string) => {
        const parts = value.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        for (const part of parts) {
          const match = part.trim().match(/^(?:"?([^"<]+)"?\s+)?<?([^\s<>@]+@[^\s<>]+)>?$/);
          if (match) {
            const name = (match[1] ?? "").trim();
            const email = match[2].trim().toLowerCase();
            if (contacts.has(email)) contacts.get(email)!.count++;
            else contacts.set(email, { email, name, count: 1 });
          }
        }
      };

      await Promise.all(
        messages.map(async (m) => {
          const res = await gmail.users.messages.get({
            userId: "me",
            id: m.id!,
            format: "metadata",
            metadataHeaders: ["To", "Cc"],
          });
          for (const h of res.data.payload?.headers ?? []) {
            if (h.value && (h.name === "To" || h.name === "Cc")) {
              parseRecipients(h.value);
            }
          }
        })
      );

      const sorted = Array.from(contacts.values()).sort((a, b) => b.count - a.count);
      return toolSuccess({ total: sorted.length, contacts: sorted.slice(0, 50) });
    }
  );
}
