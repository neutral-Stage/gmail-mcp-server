import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, safeGmailCall, toolSuccess } from "../gmail-client.js";

export function registerAttachmentTools(server: McpServer) {
  // ── get_attachment ────────────────────────────────────────────────────
  server.tool(
    "get_attachment",
    "Download an email attachment by message ID and attachment ID. Returns base64-encoded content with metadata. Use get_email first to find attachment IDs.",
    {
      messageId: z.string().describe("Gmail message ID that contains the attachment"),
      attachmentId: z.string().describe("Attachment ID from the get_email response"),
    },
    async ({ messageId, attachmentId }) => {
      const gmail = getGmail();
      const res = await safeGmailCall("get_attachment", () =>
        gmail.users.messages.attachments.get({
          userId: "me",
          messageId,
          id: attachmentId,
        })
      );
      return toolSuccess({
        size: res.data.size,
        data: res.data.data,
      });
    }
  );
}
