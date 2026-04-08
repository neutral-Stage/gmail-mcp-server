import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, safeGmailCall, toolSuccess, toolText } from "../gmail-client.js";

export function registerLabelTools(server: McpServer) {
  // ── list_labels ───────────────────────────────────────────────────────
  server.tool(
    "list_labels",
    "List all Gmail labels (system and user-created), including their IDs needed for modify operations.",
    {},
    async () => {
      const gmail = getGmail();
      const res = await safeGmailCall("list_labels", () =>
        gmail.users.labels.list({ userId: "me" })
      );
      const labels = (res.data.labels ?? []).map((l) => ({
        id: l.id,
        name: l.name,
        type: l.type,
        messagesTotal: l.messagesTotal,
        messagesUnread: l.messagesUnread,
      }));
      return toolSuccess(labels);
    }
  );

  // ── create_label ──────────────────────────────────────────────────────
  server.tool(
    "create_label",
    "Create a new Gmail label (folder).",
    {
      name: z.string().describe("Label name (use / for nesting, e.g. 'Work/Invoices')"),
      messageListVisibility: z.enum(["show", "hide"]).default("show").describe("Whether to show in message list"),
      labelListVisibility: z.enum(["labelShow", "labelShowIfUnread", "labelHide"]).default("labelShow").describe("Whether to show in label list"),
    },
    async ({ name, messageListVisibility, labelListVisibility }) => {
      const gmail = getGmail();
      const res = await safeGmailCall("create_label", () =>
        gmail.users.labels.create({ userId: "me", requestBody: { name, messageListVisibility, labelListVisibility } })
      );
      return toolSuccess({ id: res.data.id, name: res.data.name });
    }
  );

  // ── delete_label ──────────────────────────────────────────────────────
  server.tool(
    "delete_label",
    "Delete a user-created Gmail label. System labels (INBOX, SENT, etc.) cannot be deleted.",
    {
      labelId: z.string().describe("Label ID to delete (get IDs from list_labels)"),
    },
    async ({ labelId }) => {
      const gmail = getGmail();
      await safeGmailCall("delete_label", () =>
        gmail.users.labels.delete({ userId: "me", id: labelId })
      );
      return toolText(`Label ${labelId} deleted.`);
    }
  );
}
