import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Load seed data
  const seedDataPath = path.join(__dirname, 'seed-data.json');

  if (!fs.existsSync(seedDataPath)) {
    console.error('❌ seed-data.json not found. Please run extract-data.ts first.');
    process.exit(1);
  }

  const seedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf-8'));

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Clearing existing data...');
  await prisma.$transaction([
    prisma.logTableMove.deleteMany(),
    prisma.logVoucher.deleteMany(),
    prisma.subTransaction.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.voucherMenu.deleteMany(),
    prisma.option.deleteMany(),
    prisma.bestSellerMenu.deleteMany(),
    prisma.menu.deleteMany(),
    prisma.category.deleteMany(),
    prisma.voucher.deleteMany(),
    prisma.message.deleteMany(),
    prisma.user.deleteMany(),
    prisma.outlet.deleteMany(),
  ]);

  // Seed data in order of dependencies
  console.log('📦 Seeding outlets...');
  if (seedData.outlets?.length) {
    await prisma.outlet.createMany({
      data: seedData.outlets.map((o: any) => ({
        id: o.id,
        outletType: o.outletType,
        name: o.name,
        address: o.address,
        number: o.number,
        province: o.province,
        city: o.city,
        postalCode: o.postalCode,
        status: o.status,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  console.log('📦 Seeding users...');
  if (seedData.users?.length) {
    await prisma.user.createMany({
      data: seedData.users.map((u: any) => ({
        id: u.id,
        outletId: u.outletId,
        name: u.name,
        position: u.position,
        email: u.email,
        password: u.password,
        address: u.address,
        gender: u.gender,
        phoneNumber: u.phoneNumber,
        role: u.role,
        status: u.status,
        createdAt: new Date(u.createdAt),
        updatedAt: new Date(u.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  console.log('📦 Seeding categories...');
  if (seedData.categories?.length) {
    await prisma.category.createMany({
      data: seedData.categories.map((c: any) => ({
        id: c.id,
        outletId: c.outletId,
        name: c.name,
        icon: c.icon,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  console.log('📦 Seeding menus...');
  if (seedData.menus?.length) {
    await prisma.menu.createMany({
      data: seedData.menus.map((m: any) => ({
        id: m.id,
        outletId: m.outletId,
        name: m.name,
        desc: m.desc,
        img: m.img,
        price: m.price,
        pdf: m.pdf,
        categoryId: m.categoryId,
        isActive: m.isActive,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  console.log('📦 Seeding messages...');
  if (seedData.messages?.length) {
    await prisma.message.createMany({
      data: seedData.messages.map((m: any) => ({
        id: m.id,
        outletId: m.outletId,
        message: m.message,
        rating: m.rating,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  console.log('📦 Seeding vouchers...');
  if (seedData.vouchers?.length) {
    await prisma.voucher.createMany({
      data: seedData.vouchers.map((v: any) => ({
        id: v.id,
        outletId: v.outletId,
        name: v.name,
        description: v.description,
        type: v.type,
        discount: v.discount,
        usage: v.usage,
        maxUsage: v.maxUsage,
        allMenu: v.allMenu,
        expiredAt: new Date(v.expiredAt),
        createdAt: new Date(v.createdAt),
        updatedAt: new Date(v.updatedAt),
      })),
      skipDuplicates: true,
    });
  }

  console.log('📦 Seeding voucher menus...');
  if (seedData.voucherMenus?.length) {
    await prisma.voucherMenu.createMany({
      data: seedData.voucherMenus.map((vm: any) => ({
        voucherId: vm.voucherId,
        menuId: vm.menuId,
      })),
      skipDuplicates: true,
    });
  }

  // console.log('📦 Seeding options...');
  // if (seedData.options?.length) {
  //   // Handle options with parent-child relationships
  //   // First, seed options without parent (optionId is null)
  //   const parentOptions = seedData.options.filter((o: any) => !o.optionId);
  //   const childOptions = seedData.options.filter((o: any) => o.optionId);

  //   if (parentOptions.length) {
  //     await prisma.option.createMany({
  //       data: parentOptions.map((o: any) => ({
  //         id: o.id,
  //         menuId: o.menuId,
  //         optionId: o.optionId,
  //         name: o.name,
  //         values: o.values,
  //         extraPrices: o.extraPrices,
  //         order: o.order,
  //         createdAt: new Date(o.createdAt),
  //         updatedAt: new Date(o.updatedAt),
  //       })),
  //       skipDuplicates: true,
  //     });
  //   }

  //   if (childOptions.length) {
  //     await prisma.option.createMany({
  //       data: childOptions.map((o: any) => ({
  //         id: o.id,
  //         menuId: o.menuId,
  //         optionId: o.optionId,
  //         name: o.name,
  //         values: o.values,
  //         extraPrices: o.extraPrices,
  //         order: o.order,
  //         createdAt: new Date(o.createdAt),
  //         updatedAt: new Date(o.updatedAt),
  //       })),
  //       skipDuplicates: true,
  //     });
  //   }
  // }

  console.log('📦 Seeding best seller menus...');
  if (seedData.bestSellerMenus?.length) {
    await prisma.bestSellerMenu.createMany({
      data: seedData.bestSellerMenus.map((b: any) => ({
        id: b.id,
        menuId: b.menuId,
        order: b.order,
        createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
        updatedAt: b.updatedAt ? new Date(b.updatedAt) : new Date(),
      })),
      skipDuplicates: true,
    });
  }

  // console.log('📦 Seeding transactions...');
  // if (seedData.transactions?.length) {
  //   await prisma.transaction.createMany({
  //     data: seedData.transactions.map((t: any) => ({
  //       id: t.id,
  //       userId: t.userId,
  //       outletId: t.outletId,
  //       number: t.number,
  //       transactionType: t.transactionType,
  //       tableNumber: t.tableNumber,
  //       paymentNumber: t.paymentNumber,
  //       paymentMethod: t.paymentMethod,
  //       customerName: t.customerName,
  //       totalSubTransaction: t.totalSubTransaction,
  //       subTotal: t.subTotal,
  //       discount: t.discount,
  //       serviceCharge: t.serviceCharge,
  //       rounding: t.rounding,
  //       total: t.total,
  //       additionalNote: t.additionalNote,
  //       voucherId: t.voucherId,
  //       status: t.status,
  //       fraudStatus: t.fraudStatus,
  //       createdAt: new Date(t.createdAt),
  //       updatedAt: new Date(t.updatedAt),
  //     })),
  //     skipDuplicates: true,
  //   });
  // }

  // console.log('📦 Seeding sub transactions...');
  // if (seedData.subTransactions?.length) {
  //   await prisma.subTransaction.createMany({
  //     data: seedData.subTransactions.map((st: any) => ({
  //       id: st.id,
  //       transactionId: st.transactionId,
  //       menuId: st.menuId,
  //       menuName: st.menuName,
  //       quantity: st.quantity,
  //       price: st.price,
  //       subTotal: st.subTotal,
  //       addOn: st.addOn,
  //       note: st.note,
  //       status: st.status,
  //       createdAt: new Date(st.createdAt),
  //       updatedAt: new Date(st.updatedAt),
  //     })),
  //     skipDuplicates: true,
  //   });
  // }

  // console.log('📦 Seeding log vouchers...');
  // if (seedData.logVouchers?.length) {
  //   await prisma.logVoucher.createMany({
  //     data: seedData.logVouchers.map((lv: any) => ({
  //       id: lv.id,
  //       outletId: lv.outletId,
  //       transactionId: lv.transactionId,
  //       voucherId: lv.voucherId,
  //       createdAt: new Date(lv.createdAt),
  //       updatedAt: new Date(lv.updatedAt),
  //     })),
  //     skipDuplicates: true,
  //   });
  // }

  // console.log('📦 Seeding log table moves...');
  // if (seedData.logTableMoves?.length) {
  //   await prisma.logTableMove.createMany({
  //     data: seedData.logTableMoves.map((ltm: any) => ({
  //       id: ltm.id,
  //       outletId: ltm.outletId,
  //       transactionId: ltm.transactionId,
  //       tableNumber: ltm.tableNumber,
  //       prevTableId: ltm.prevTableId,
  //       nextTableId: ltm.nextTableId,
  //       note: ltm.note,
  //       createdAt: new Date(ltm.createdAt),
  //       updatedAt: new Date(ltm.updatedAt),
  //     })),
  //     skipDuplicates: true,
  //   });
  // }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
