import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getGmail, safeGmailCall, toolSuccess } from "../gmail-client.js";

export function registerExtractTools(server: McpServer) {
  // ── extract_addresses ─────────────────────────────────────────────────
  server.tool(
    "extract_addresses",
    "Extract unique email addresses from messages matching a Gmail query. Useful for building contact lists.",
    {
      query: z.string().describe("Gmail search query to find messages"),
      maxMessages: z.number().int().min(1).max(500).default(100).describe("Maximum messages to scan"),
      fields: z.array(z.enum(["from", "to", "cc", "reply-to"])).default(["from", "to"]).describe("Which header fields to extract addresses from"),
    },
    async ({ query, maxMessages, fields }) => {
      const gmail = getGmail();
      const listRes = await safeGmailCall("extract_addresses:list", () =>
        gmail.users.messages.list({ userId: "me", q: query, maxResults: maxMessages })
      );
      const messages = listRes.data.messages ?? [];

      const addressSet = new Map<string, { name: string; email: string; count: number }>();
      const parseAddressHeader = (value: string) => {
        const parts = value.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
        for (const part of parts) {
          const match = part.trim().match(/^(?:"?([^"<]+)"?\s+)?<?([^\s<>@]+@[^\s<>]+)>?$/);
          if (match) {
            const name = (match[1] ?? "").trim();
            const email = match[2].trim().toLowerCase();
            if (addressSet.has(email)) addressSet.get(email)!.count++;
            else addressSet.set(email, { name, email, count: 1 });
          }
        }
      };

      await Promise.all(
        messages.map(async (m) => {
          const res = await gmail.users.messages.get({ userId: "me", id: m.id!, format: "metadata", metadataHeaders: fields });
          const headers = res.data.payload?.headers ?? [];
          for (const h of headers) {
            if (h.name && fields.includes(h.name.toLowerCase() as "from" | "to" | "cc" | "reply-to") && h.value) {
              parseAddressHeader(h.value);
            }
          }
        })
      );

      const addresses = Array.from(addressSet.values()).sort((a, b) => b.count - a.count);
      return toolSuccess({ total: addresses.length, addresses });
    }
  );

  // ── format_emails ─────────────────────────────────────────────────────
  server.tool(
    "format_emails",
    "Re-format and filter a list of email objects (previously fetched) into a custom structure. Supports field selection, filtering by field value, and sorting.",
    {
      emails: z.array(z.record(z.unknown())).describe("Array of email objects to format"),
      fields: z.array(z.string()).optional().describe("Fields to include in output (omit to include all)"),
      filterBy: z.object({ field: z.string(), contains: z.string().optional(), equals: z.string().optional() }).optional().describe("Filter emails by a field value"),
      sortBy: z.object({ field: z.string(), order: z.enum(["asc", "desc"]).default("asc") }).optional().describe("Sort emails by a field"),
      outputFormat: z.enum(["json", "table", "summary"]).default("json").describe("Output format"),
    },
    async ({ emails, fields, filterBy, sortBy, outputFormat }) => {
      let result = [...emails] as Record<string, unknown>[];

      if (filterBy) {
        result = result.filter((e) => {
          const val = String(e[filterBy.field] ?? "").toLowerCase();
          if (filterBy.contains) return val.includes(filterBy.contains.toLowerCase());
          if (filterBy.equals) return val === filterBy.equals.toLowerCase();
          return true;
        });
      }

      if (sortBy) {
        result.sort((a, b) => {
          const av = String(a[sortBy.field] ?? "");
          const bv = String(b[sortBy.field] ?? "");
          return sortBy.order === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        });
      }

      if (fields && fields.length > 0) {
        result = result.map((e) => Object.fromEntries(fields.map((f) => [f, e[f]])));
      }

      let output: string;
      if (outputFormat === "table") {
        const keys = result.length > 0 ? Object.keys(result[0]) : [];
        const rows = result.map((e) => keys.map((k) => String(e[k] ?? "")).join(" | "));
        output = [keys.join(" | "), keys.map(() => "---").join(" | "), ...rows].join("\n");
      } else if (outputFormat === "summary") {
        output = result.map((e, i) => `[${i + 1}] ${e["subject"] ?? e["id"] ?? ""} — ${e["from"] ?? ""} (${e["date"] ?? ""})`).join("\n");
      } else {
        output = JSON.stringify(result, null, 2);
      }

      return { content: [{ type: "text" as const, text: output }] };
    }
  );
}
