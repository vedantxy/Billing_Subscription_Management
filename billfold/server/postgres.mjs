import { PrismaClient } from "@prisma/client";
import { tables } from "../lib/billing.mjs";
import { BookChanges, mutate } from "./commands.mjs";
import { ensure } from "../lib/validation.mjs";

const prisma = globalThis.billfoldPrisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.billfoldPrisma = prisma;
const models = {
  customers: "customer",
  products: "product",
  plans: "plan",
  subscriptions: "subscription",
  events: "subscriptionEvent",
  invoices: "invoice",
  lines: "invoiceLine",
  payments: "payment",
};
const dates = new Set(["createdOn", "startDate", "nextDate", "issuedOn", "dueOn", "paidOn"]);
function encode(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, val]) => [
      key,
      dates.has(key) ? new Date(val + "T00:00:00Z") : key === "at" ? new Date(val) : val,
    ]),
  );
}
function decode(row) {
  return Object.fromEntries(
    Object.entries(row).map(([key, val]) => [
      key,
      val instanceof Date
        ? dates.has(key)
          ? val.toISOString().slice(0, 10)
          : val.toISOString()
        : val,
    ]),
  );
}
async function loadBook(tx) {
  const rows = await Promise.all(tables.map((table) => tx[models[table]].findMany()));
  return Object.fromEntries(tables.map((table, i) => [table, rows[i].map(decode)]));
}
function exclusive(work) {
  return prisma.$transaction(
    async (tx) => {
      // Serialize writes in this single-business workspace, including invoice sequence allocation.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(645391724)`;
      return work(tx);
    },
    { maxWait: 10000, timeout: 20000 },
  );
}
export const postgres = {
  read() {
    return prisma.$transaction((tx) => loadBook(tx), { isolationLevel: "RepeatableRead" });
  },
  write(command, key, signature) {
    return exclusive(async (tx) => {
      if (key) {
        const prior = await tx.mutation.findUnique({ where: { key } });
        if (prior) {
          ensure(
            prior.signature === signature,
            "This request key was already used for another change.",
            409,
          );
          return prior.result;
        }
      }
      const changes = new BookChanges(await loadBook(tx));
      const result = mutate(changes, command);
      for (const op of changes.operations) {
        const model = tx[models[op.table]];
        if (op.type === "create") await model.create({ data: encode(op.row) });
        if (op.type === "update")
          await model.update({ where: { id: op.id }, data: encode(op.changes) });
        if (op.type === "delete") await model.delete({ where: { id: op.id } });
      }
      if (key) await tx.mutation.create({ data: { key, signature, result } });
      return result;
    });
  },
};
export async function seedDatabase(book) {
  return exclusive(async (tx) => {
    for (const table of tables) if (await tx[models[table]].count()) return false;
    for (const table of tables)
      if (book[table].length) await tx[models[table]].createMany({ data: book[table].map(encode) });
    return true;
  });
}
export const disconnect = () => prisma.$disconnect();
