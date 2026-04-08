import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, safeGmailCall, toolSuccess, toolText } from "../gmail-client.js";

export function registerOrganizeTools(server: McpServer) {
  // ── modify_email ──────────────────────────────────────────────────────
  server.tool(
    "modify_email",
    "Modify a single email: add/remove labels, mark as read/unread, archive, or move to trash.",
    {
      id: z.string().describe("Gmail message ID"),
      addLabelIds: z.array(z.string()).default([]).describe("Label IDs to add (e.g. 'STARRED', 'IMPORTANT', or custom label ID)"),
      removeLabelIds: z.array(z.string()).default([]).describe("Label IDs to remove (e.g. 'UNREAD', 'INBOX')"),
    },
    async ({ id, addLabelIds, removeLabelIds }) => {
      const gmail = getGmail();
      const res = await safeGmailCall("modify_email", () =>
        gmail.users.messages.modify({ userId: "me", id, requestBody: { addLabelIds, removeLabelIds } })
      );
      return toolSuccess({ id: res.data.id, labelIds: res.data.labelIds });
    }
  );

  // ── batch_modify_emails ───────────────────────────────────────────────
  server.tool(
    "batch_modify_emails",
    "Apply the same label modifications to multiple emails at once (up to 1000 IDs).",
    {
      ids: z.array(z.string()).min(1).max(1000).describe("List of Gmail message IDs"),
      addLabelIds: z.array(z.string()).default([]).describe("Label IDs to add"),
      removeLabelIds: z.array(z.string()).default([]).describe("Label IDs to remove"),
    },
    async ({ ids, addLabelIds, removeLabelIds }) => {
      const gmail = getGmail();
      await safeGmailCall("batch_modify_emails", () =>
        gmail.users.messages.batchModify({ userId: "me", requestBody: { ids, addLabelIds, removeLabelIds } })
      );
      return toolText(`Successfully modified ${ids.length} message(s).`);
    }
  );

  // ── trash_email ───────────────────────────────────────────────────────
  server.tool(
    "trash_email",
    "Move an email to Trash (recoverable for 30 days).",
    { id: z.string().describe("Gmail message ID") },
    async ({ id }) => {
      const gmail = getGmail();
      const res = await safeGmailCall("trash_email", () =>
        gmail.users.messages.trash({ userId: "me", id })
      );
      return toolSuccess({ id: res.data.id, labelIds: res.data.labelIds });
    }
  );

  // ── untrash_email ─────────────────────────────────────────────────────
  server.tool(
    "untrash_email",
    "Restore an email from Trash back to the inbox.",
    { id: z.string().describe("Gmail message ID") },
    async ({ id }) => {
      const gmail = getGmail();
      const res = await safeGmailCall("untrash_email", () =>
        gmail.users.messages.untrash({ userId: "me", id })
      );
      return toolSuccess({ id: res.data.id, labelIds: res.data.labelIds });
    }
  );

  // ── batch_trash_emails ────────────────────────────────────────────────
  server.tool(
    "batch_trash_emails",
    "Move multiple emails to Trash at once by adding the TRASH label and removing INBOX.",
    {
      ids: z.array(z.string()).min(1).max(1000).describe("List of Gmail message IDs to trash"),
    },
    async ({ ids }) => {
      const gmail = getGmail();
      await safeGmailCall("batch_trash_emails", () =>
        gmail.users.messages.batchModify({ userId: "me", requestBody: { ids, addLabelIds: ["TRASH"], removeLabelIds: ["INBOX"] } })
      );
      return toolText(`Moved ${ids.length} message(s) to Trash.`);
    }
  );

  // ── mark_spam ─────────────────────────────────────────────────────────
  server.tool(
    "mark_spam",
    "Mark one or more emails as spam (moves to Spam folder).",
    {
      ids: z.array(z.string()).min(1).describe("Gmail message ID(s) to mark as spam"),
    },
    async ({ ids }) => {
      const gmail = getGmail();
      await safeGmailCall("mark_spam", () =>
        gmail.users.messages.batchModify({ userId: "me", requestBody: { ids, addLabelIds: ["SPAM"], removeLabelIds: ["INBOX"] } })
      );
      return toolText(`Marked ${ids.length} message(s) as spam.`);
    }
  );

  // ── advanced_filter ───────────────────────────────────────────────────
  server.tool(
    "advanced_filter",
    "Search emails with multiple criteria and optionally apply a bulk action to all matching results. Useful for inbox cleanup, bulk labeling, or archiving by rule.",
    {
      query: z.string().describe("Gmail search query (e.g. 'is:unread older_than:30d label:newsletters')"),
      maxResults: z.number().int().min(1).max(500).default(100).describe("Max emails to process"),
      action: z.enum(["none", "markRead", "markUnread", "archive", "trash", "star", "unstar", "applyLabel", "removeLabel"])
        .default("none")
        .describe("Bulk action to apply to all matched emails"),
      labelId: z.string().optional().describe("Label ID required for applyLabel / removeLabel actions"),
      dryRun: z.boolean().default(true).describe("If true, only list matching emails without applying the action"),
    },
    async ({ query, maxResults, action, labelId, dryRun }) => {
      const gmail = getGmail();

      const ids: string[] = [];
      let pageToken: string | undefined;
      while (ids.length < maxResults) {
        const res = await safeGmailCall("advanced_filter:list", () =>
          gmail.users.messages.list({ userId: "me", q: query, maxResults: Math.min(maxResults - ids.length, 100), pageToken })
        );
        (res.data.messages ?? []).forEach((m) => { if (m.id) ids.push(m.id); });
        pageToken = res.data.nextPageToken ?? undefined;
        if (!pageToken) break;
      }

      if (ids.length === 0) return toolText("No messages matched the query.");

      if (dryRun) {
        return toolText(`[DRY RUN] Found ${ids.length} message(s) matching "${query}". Set dryRun: false to apply action "${action}".`);
      }

      const actionMap: Record<string, { add: string[]; remove: string[] }> = {
        markRead:    { add: [],           remove: ["UNREAD"] },
        markUnread:  { add: ["UNREAD"],   remove: [] },
        archive:     { add: [],           remove: ["INBOX"] },
        trash:       { add: ["TRASH"],    remove: ["INBOX"] },
        star:        { add: ["STARRED"],  remove: [] },
        unstar:      { add: [],           remove: ["STARRED"] },
        applyLabel:  { add: [labelId!],   remove: [] },
        removeLabel: { add: [],           remove: [labelId!] },
      };

      if (action !== "none") {
        const { add, remove } = actionMap[action];
        if ((action === "applyLabel" || action === "removeLabel") && !labelId) {
          return toolText(`Action "${action}" requires a labelId.`);
        }
        for (let i = 0; i < ids.length; i += 1000) {
          await safeGmailCall("advanced_filter:modify", () =>
            gmail.users.messages.batchModify({ userId: "me", requestBody: { ids: ids.slice(i, i + 1000), addLabelIds: add, removeLabelIds: remove } })
          );
        }
      }

      return toolText(`Applied "${action}" to ${ids.length} message(s) matching "${query}".`);
    }
  );
}
