import { Decimal } from '@prisma/client/runtime/library';

export interface LogStock {
  id: string;
  outletId: string;
  stockId: string;
  qty: Decimal;
  type: string;
  uom: string;
  menuId: string;
  note: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLogStockDTO {
  outletId: string;
  stockId: string;
  qty: Decimal;
  type: string;
  uom: string;
  note: string;
  menuId: string;
  userId: string;
}

export interface UpdateLogStockDTO extends Partial<CreateLogStockDTO> {}
