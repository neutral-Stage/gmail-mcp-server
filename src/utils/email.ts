/**
 * Email helper utilities — body extraction, header parsing, RFC 2822 building.
 */

export interface EmailPart {
  mimeType?: string | null;
  body?: { data?: string | null; attachmentId?: string | null; size?: number | null } | null;
  parts?: EmailPart[] | null;
  filename?: string | null;
}

export function decodeBody(data: string): string {
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

export function extractBody(payload: EmailPart): { text: string; html: string } {
  let text = "";
  let html = "";
  function walk(part: EmailPart) {
    const mime = part.mimeType ?? "";
    if (mime === "text/plain" && part.body?.data) text = decodeBody(part.body.data);
    else if (mime === "text/html" && part.body?.data) html = decodeBody(part.body.data);
    else if (part.parts) part.parts.forEach(walk);
  }
  walk(payload);
  return { text, html };
}

export function extractAttachments(
  payload: EmailPart
): { filename: string; mimeType: string; attachmentId: string; size: number }[] {
  const attachments: { filename: string; mimeType: string; attachmentId: string; size: number }[] = [];
  function walk(part: EmailPart) {
    if (part.filename && part.body?.attachmentId) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType ?? "application/octet-stream",
        attachmentId: part.body.attachmentId,
        size: part.body.size ?? 0,
      });
    }
    part.parts?.forEach(walk);
  }
  walk(payload);
  return attachments;
}

export function parseHeaders(
  headers: { name?: string | null; value?: string | null }[],
  ...names: string[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const h of headers) {
    if (h.name && names.includes(h.name.toLowerCase())) {
      result[h.name.toLowerCase()] = h.value ?? "";
    }
  }
  return result;
}

/** Build a RFC 2822 raw email string and base64url-encode it for the Gmail API. */
export function buildRawEmail(opts: {
  from?: string;
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  inReplyTo?: string;
  references?: string;
  threadId?: string;
}): string {
  const toList = Array.isArray(opts.to) ? opts.to.join(", ") : opts.to;
  const lines: string[] = [];
  if (opts.from) lines.push(`From: ${opts.from}`);
  lines.push(`To: ${toList}`);
  if (opts.cc) lines.push(`Cc: ${Array.isArray(opts.cc) ? opts.cc.join(", ") : opts.cc}`);
  if (opts.bcc) lines.push(`Bcc: ${Array.isArray(opts.bcc) ? opts.bcc.join(", ") : opts.bcc}`);
  lines.push(`Subject: ${opts.subject}`);
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: ${opts.isHtml ? "text/html" : "text/plain"}; charset=UTF-8`);
  if (opts.inReplyTo) lines.push(`In-Reply-To: ${opts.inReplyTo}`);
  if (opts.references) lines.push(`References: ${opts.references}`);
  lines.push("", opts.body);
  const raw = lines.join("\r\n");
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
