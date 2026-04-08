import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, safeGmailCall, toolSuccess } from "../gmail-client.js";
import { parseHeaders, extractBody, buildRawEmail, EmailPart } from "../utils/email.js";

export function registerComposeTools(server: McpServer) {
  // ── send_email ────────────────────────────────────────────────────────
  server.tool(
    "send_email",
    "Compose and send a new email.",
    {
      to: z.union([z.string(), z.array(z.string())]).describe("Recipient email address(es)"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body (plain text or HTML)"),
      cc: z.union([z.string(), z.array(z.string())]).optional().describe("CC recipient(s)"),
      bcc: z.union([z.string(), z.array(z.string())]).optional().describe("BCC recipient(s)"),
      isHtml: z.boolean().default(false).describe("Set true if body is HTML"),
    },
    async ({ to, subject, body, cc, bcc, isHtml }) => {
      const gmail = getGmail();
      const raw = buildRawEmail({ to, subject, body, cc, bcc, isHtml });
      const res = await safeGmailCall("send_email", () =>
        gmail.users.messages.send({ userId: "me", requestBody: { raw } })
      );
      return toolSuccess({ id: res.data.id, threadId: res.data.threadId, labelIds: res.data.labelIds });
    }
  );

  // ── reply_email ───────────────────────────────────────────────────────
  server.tool(
    "reply_email",
    "Reply to an existing email. Automatically sets In-Reply-To and References headers and keeps the thread.",
    {
      id: z.string().describe("Gmail message ID to reply to"),
      body: z.string().describe("Reply body (plain text or HTML)"),
      replyAll: z.boolean().default(false).describe("Reply to all recipients (To + CC)"),
      isHtml: z.boolean().default(false).describe("Set true if body is HTML"),
      cc: z.union([z.string(), z.array(z.string())]).optional().describe("Additional CC recipients"),
    },
    async ({ id, body, replyAll, isHtml, cc }) => {
      const gmail = getGmail();
      const res = await safeGmailCall("reply_email:fetch", () =>
        gmail.users.messages.get({
          userId: "me", id, format: "metadata",
          metadataHeaders: ["From", "To", "Cc", "Subject", "Message-ID", "References"],
        })
      );
      const msg = res.data;
      const h = parseHeaders(msg.payload?.headers ?? [], "from", "to", "cc", "subject", "message-id", "references");

      const originalFrom = h["from"] ?? "";
      const originalTo = h["to"] ?? "";
      const originalCc = h["cc"] ?? "";
      const messageId = h["message-id"] ?? "";
      const references = [h["references"], messageId].filter(Boolean).join(" ").trim();

      let toAddresses = originalFrom;
      let ccAddresses: string | undefined = Array.isArray(cc) ? cc.join(", ") : cc;
      if (replyAll) {
        const allRecipients = [originalTo, originalCc].filter(Boolean).join(", ");
        ccAddresses = [allRecipients, ccAddresses].filter(Boolean).join(", ") || undefined;
      }

      const subject = h["subject"]?.startsWith("Re:") ? h["subject"] : `Re: ${h["subject"] ?? ""}`;
      const raw = buildRawEmail({ to: toAddresses, subject, body, cc: ccAddresses, isHtml, inReplyTo: messageId, references });
      const sendRes = await safeGmailCall("reply_email:send", () =>
        gmail.users.messages.send({ userId: "me", requestBody: { raw, threadId: msg.threadId! } })
      );
      return toolSuccess({ id: sendRes.data.id, threadId: sendRes.data.threadId });
    }
  );

  // ── forward_email ─────────────────────────────────────────────────────
  server.tool(
    "forward_email",
    "Forward an existing email to new recipients, optionally adding a note above the original message.",
    {
      id: z.string().describe("Gmail message ID to forward"),
      to: z.union([z.string(), z.array(z.string())]).describe("Forward recipient(s)"),
      note: z.string().default("").describe("Optional note to prepend above the forwarded message"),
      cc: z.union([z.string(), z.array(z.string())]).optional().describe("CC recipients"),
      isHtml: z.boolean().default(false).describe("Set true if note is HTML"),
    },
    async ({ id, to, note, cc, isHtml }) => {
      const gmail = getGmail();
      const res = await safeGmailCall("forward_email:fetch", () =>
        gmail.users.messages.get({ userId: "me", id, format: "full" })
      );
      const msg = res.data;
      const h = parseHeaders(msg.payload?.headers ?? [], "from", "to", "subject", "date", "message-id", "references");
      const { text, html } = extractBody(msg.payload as EmailPart);
      const originalBody = isHtml ? (html || text) : (text || html);

      const separator = isHtml
        ? `<br><br>---------- Forwarded message ----------<br>From: ${h["from"]}<br>Date: ${h["date"]}<br>Subject: ${h["subject"]}<br>To: ${h["to"]}<br><br>`
        : `\n\n---------- Forwarded message ----------\nFrom: ${h["from"]}\nDate: ${h["date"]}\nSubject: ${h["subject"]}\nTo: ${h["to"]}\n\n`;

      const body = note ? `${note}${separator}${originalBody}` : `${separator}${originalBody}`;
      const subject = h["subject"]?.startsWith("Fwd:") ? h["subject"] : `Fwd: ${h["subject"] ?? ""}`;
      const raw = buildRawEmail({ to, subject, body, cc, isHtml, references: h["message-id"] });
      const sendRes = await safeGmailCall("forward_email:send", () =>
        gmail.users.messages.send({ userId: "me", requestBody: { raw } })
      );
      return toolSuccess({ id: sendRes.data.id, threadId: sendRes.data.threadId });
    }
  );

  // ── create_draft ──────────────────────────────────────────────────────
  server.tool(
    "create_draft",
    "Create a draft email (not sent). Optionally attach it to an existing thread for a draft reply.",
    {
      to: z.union([z.string(), z.array(z.string())]).describe("Recipient(s)"),
      subject: z.string().describe("Email subject"),
      body: z.string().describe("Email body"),
      cc: z.union([z.string(), z.array(z.string())]).optional().describe("CC recipients"),
      bcc: z.union([z.string(), z.array(z.string())]).optional().describe("BCC recipients"),
      isHtml: z.boolean().default(false).describe("Set true if body is HTML"),
      threadId: z.string().optional().describe("Thread ID to attach draft reply to"),
    },
    async ({ to, subject, body, cc, bcc, isHtml, threadId }) => {
      const gmail = getGmail();
      const raw = buildRawEmail({ to, subject, body, cc, bcc, isHtml });
      const res = await safeGmailCall("create_draft", () =>
        gmail.users.drafts.create({
          userId: "me",
          requestBody: { message: { raw, ...(threadId ? { threadId } : {}) } },
        })
      );
      return toolSuccess({ draftId: res.data.id, message: res.data.message });
    }
  );
}
