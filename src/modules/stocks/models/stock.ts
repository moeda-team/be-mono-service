export interface Stock {
  id: string;
  outletId: string;
  name: string;
  qty: number;
  uom: string;
  minQty: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStockDTO {
  name: string;
  qty: number;
  uom: string;
  minQty: number;
}

export interface UpdateStockDTO extends Partial<CreateStockDTO> {}
