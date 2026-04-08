import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, safeGmailCall, toolSuccess } from "../gmail-client.js";
import { parseHeaders } from "../utils/email.js";

export function registerSearchTools(server: McpServer) {
  server.tool(
    "search_emails",
    "Search Gmail using Gmail query syntax (e.g. 'from:alice@example.com', 'is:unread', 'subject:invoice'). Returns message summaries.",
    {
      query: z.string().describe("Gmail search query"),
      maxResults: z.number().int().min(1).max(100).default(20).describe("Maximum number of results"),
      pageToken: z.string().optional().describe("Token for next page of results"),
    },
    async ({ query, maxResults, pageToken }) => {
      const gmail = getGmail();
      const listRes = await safeGmailCall("search_emails", () =>
        gmail.users.messages.list({ userId: "me", q: query, maxResults, pageToken })
      );
      const messages = listRes.data.messages ?? [];
      if (messages.length === 0) return toolSuccess({ total: 0, messages: [] });

      const summaries = await Promise.all(
        messages.map((m) =>
          gmail.users.messages.get({
            userId: "me",
            id: m.id!,
            format: "metadata",
            metadataHeaders: ["From", "To", "Subject", "Date"],
          })
        )
      );

      const results = summaries.map((res) => {
        const msg = res.data;
        const h = parseHeaders(msg.payload?.headers ?? [], "from", "to", "subject", "date");
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: msg.snippet,
          labelIds: msg.labelIds,
          from: h["from"] ?? "",
          to: h["to"] ?? "",
          subject: h["subject"] ?? "",
          date: h["date"] ?? "",
        };
      });

      return toolSuccess({
        total: results.length,
        nextPageToken: listRes.data.nextPageToken ?? null,
        messages: results,
      });
    }
  );
}
