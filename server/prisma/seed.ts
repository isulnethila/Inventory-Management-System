import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function deleteAllData() {
  console.log("Deleting all data in proper FK order...");

  // Delete children first
  await prisma.sales.deleteMany();
  await prisma.purchases.deleteMany();
  await prisma.expenseByCategory.deleteMany();

  // Delete parents
  await prisma.expenseSummary.deleteMany();
  await prisma.salesSummary.deleteMany();
  await prisma.purchaseSummary.deleteMany();
  await prisma.expenses.deleteMany();
  await prisma.products.deleteMany();
  await prisma.users.deleteMany();

  console.log("All data cleared successfully.\n");
}

async function seedModel(modelName: string, fileName: string) {
  const dataDirectory = path.join(__dirname, "seedData");
  const filePath = path.join(dataDirectory, fileName);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${fileName}`);
    return;
  }

  const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const model = prisma[modelName as keyof typeof prisma] as any;
  if (!model) {
    console.error(`❌ Prisma model not found for: ${modelName}`);
    return;
  }

  for (const row of jsonData) {
    await model.create({ data: row });
  }

  console.log(`✔ Seeded ${modelName} with ${fileName}`);
}

async function main() {
  // MUST be in this correct order
  const seedOrder = [
    { model: "products", file: "products.json" },
    { model: "expenseSummary", file: "expenseSummary.json" },
    { model: "sales", file: "sales.json" },
    { model: "salesSummary", file: "salesSummary.json" },
    { model: "purchases", file: "purchases.json" },
    { model: "purchaseSummary", file: "purchaseSummary.json" },
    { model: "users", file: "users.json" },
    { model: "expenses", file: "expenses.json" },
    { model: "expenseByCategory", file: "expenseByCategory.json" },
  ];

  await deleteAllData();

  for (const item of seedOrder) {
    await seedModel(item.model, item.file);
  }

  console.log("\n Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error(" Error seeding database:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
