// This script extracts all data from the database and saves it as seed data
// Run with: npx ts-node prisma/extract-data.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function extractData() {
  console.log('Extracting data from database...');

  // Fetch all data sequentially to avoid connection limits
  console.log('  Fetching users...');
  const users = await prisma.user.findMany();

  console.log('  Fetching outlets...');
  const outlets = await prisma.outlet.findMany();

  console.log('  Fetching categories...');
  const categories = await prisma.category.findMany();

  console.log('  Fetching menus...');
  const menus = await prisma.menu.findMany();

  console.log('  Fetching messages...');
  const messages = await prisma.message.findMany();

  console.log('  Fetching vouchers...');
  const vouchers = await prisma.voucher.findMany();

  console.log('  Fetching voucher menus...');
  const voucherMenus = await prisma.voucherMenu.findMany();

  console.log('  Fetching options...');
  const options = await prisma.option.findMany();

  console.log('  Fetching best seller menus...');
  const bestSellerMenus = await prisma.bestSellerMenu.findMany({
    select: { id: true, menuId: true, order: true },
  });

  console.log('  Fetching transactions...');
  const transactions = await prisma.transaction.findMany();

  console.log('  Fetching sub transactions...');
  const subTransactions = await prisma.subTransaction.findMany();

  console.log('  Fetching log vouchers...');
  const logVouchers = await prisma.logVoucher.findMany();

  console.log('  Fetching log table moves...');
  const logTableMoves = await prisma.logTableMove.findMany();

  const seedData = {
    users,
    outlets,
    categories,
    menus,
    messages,
    vouchers,
    voucherMenus,
    options,
    bestSellerMenus,
    transactions,
    subTransactions,
    logVouchers,
    logTableMoves,
  };

  // Save to seed-data.json
  const seedDataPath = path.join(__dirname, 'seed-data.json');
  fs.writeFileSync(seedDataPath, JSON.stringify(seedData, null, 2));

  console.log('✅ Data extracted successfully!');
  console.log('📊 Summary:');
  console.log(`  - Users: ${users.length}`);
  console.log(`  - Outlets: ${outlets.length}`);
  console.log(`  - Categories: ${categories.length}`);
  console.log(`  - Menus: ${menus.length}`);
  console.log(`  - Messages: ${messages.length}`);
  console.log(`  - Vouchers: ${vouchers.length}`);
  console.log(`  - VoucherMenus: ${voucherMenus.length}`);
  console.log(`  - Options: ${options.length}`);
  console.log(`  - BestSellerMenus: ${bestSellerMenus.length}`);
  console.log(`  - Transactions: ${transactions.length}`);
  console.log(`  - SubTransactions: ${subTransactions.length}`);
  console.log(`  - LogVouchers: ${logVouchers.length}`);
  console.log(`  - LogTableMoves: ${logTableMoves.length}`);
  console.log(`\n💾 Data saved to: ${seedDataPath}`);
}

extractData()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
