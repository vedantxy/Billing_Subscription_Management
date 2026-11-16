import { readFile } from "node:fs/promises";
import path from "node:path";
import { handleApi } from "../../../server/http.mjs";
import { postgres } from "../../../server/postgres.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function download(invoice) {
  const { invoicePdf } = await import("../../../server/pdf.mjs");
  return invoicePdf(invoice, (name) =>
    readFile(path.join(process.cwd(), "public/fonts/invoice", name)),
  );
}
const handler = (request) => handleApi(request, postgres, download);
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
