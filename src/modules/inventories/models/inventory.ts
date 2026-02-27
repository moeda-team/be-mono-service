export interface Inventory {
  id: string;
  outletId: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  status: StockStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum StockStatus {
  SAFE = 'SAFE',
  LOW = 'LOW',
  OUT = 'OUT',
}

export interface CreateInventoryDTO {
  outletId: string;
  name: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  status?: StockStatus;
}

export interface UpdateInventoryDTO extends Partial<CreateInventoryDTO> {}
