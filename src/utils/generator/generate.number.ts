import prisma from '../../lib/prisma';

export const generateOrderNumber = async (outletId: string) => {
  const countTotal = await prisma.transaction.count({
    where: {
      outletId,
      createdAt: {
        gte: new Date(new Date().setHours(0, 0, 0, 0)),
        lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    },
  });
  const orderNumber = (countTotal + 1).toString().padStart(4, '0');
  return `#${orderNumber}`;
};

export const generatePaymentNumber = async (outletId: string) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const datePart = `${year}${month}${day}`;

  const startOfDay = new Date(now.setHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setHours(23, 59, 59, 999));

  const countTotal = await prisma.transaction.count({
    where: {
      outletId,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  const sequence = (countTotal + 1).toString().padStart(4, '0');
  const paymentNumber = `MDA-${datePart}${sequence}`;

  return paymentNumber;
};
