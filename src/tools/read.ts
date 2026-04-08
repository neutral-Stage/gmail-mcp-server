import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, safeGmailCall, toolSuccess } from "../gmail-client.js";
import { parseHeaders, extractBody, extractAttachments, EmailPart } from "../utils/email.js";

export function registerReadTools(server: McpServer) {
  // ── get_email ─────────────────────────────────────────────────────────
  server.tool(
    "get_email",
    "Get the full content of an email by its ID, including body text and attachment info.",
    {
      id: z.string().describe("Gmail message ID"),
      preferHtml: z.boolean().default(false).describe("Return HTML body instead of plain text when available"),
    },
    async ({ id, preferHtml }) => {
      const gmail = getGmail();
      const res = await safeGmailCall("get_email", () =>
        gmail.users.messages.get({ userId: "me", id, format: "full" })
      );
      const msg = res.data;
      const h = parseHeaders(
        msg.payload?.headers ?? [],
        "from", "to", "cc", "subject", "date", "reply-to", "message-id", "references"
      );
      const { text, html } = extractBody(msg.payload as EmailPart);
      const attachments = extractAttachments(msg.payload as EmailPart);
      const body = preferHtml && html ? html : text || html;

      return toolSuccess({
        id: msg.id,
        threadId: msg.threadId,
        labelIds: msg.labelIds,
        snippet: msg.snippet,
        messageId: h["message-id"] ?? "",
        from: h["from"] ?? "",
        to: h["to"] ?? "",
        cc: h["cc"] ?? "",
        replyTo: h["reply-to"] ?? "",
        subject: h["subject"] ?? "",
        date: h["date"] ?? "",
        references: h["references"] ?? "",
        body,
        attachments,
      });
    }
  );

  // ── get_thread ────────────────────────────────────────────────────────
  server.tool(
    "get_thread",
    "Get all messages in an email thread by thread ID.",
    {
      threadId: z.string().describe("Gmail thread ID"),
      preferHtml: z.boolean().default(false).describe("Return HTML body instead of plain text"),
    },
    async ({ threadId, preferHtml }) => {
      const gmail = getGmail();
      const res = await safeGmailCall("get_thread", () =>
        gmail.users.threads.get({ userId: "me", id: threadId, format: "full" })
      );
      const messages = (res.data.messages ?? []).map((msg) => {
        const h = parseHeaders(msg.payload?.headers ?? [], "from", "to", "cc", "subject", "date", "message-id");
        const { text, html } = extractBody(msg.payload as EmailPart);
        const body = preferHtml && html ? html : text || html;
        return {
          id: msg.id,
          messageId: h["message-id"] ?? "",
          from: h["from"] ?? "",
          to: h["to"] ?? "",
          subject: h["subject"] ?? "",
          date: h["date"] ?? "",
          labelIds: msg.labelIds,
          snippet: msg.snippet,
          body,
        };
      });
      return toolSuccess({ threadId, messageCount: messages.length, messages });
    }
  );
}
