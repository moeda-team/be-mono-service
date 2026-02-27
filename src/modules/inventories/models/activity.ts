export interface InventoryActivity {
  id: string;
  ingredientId: string;
  outletId: string;
  type: ActivityType;
  quantity: number;
  note?: string;
  createdBy?: string;
  createdAt: Date;
}

export enum ActivityType {
  ADD = 'ADD',
  REDUCE = 'REDUCE',
  ADJUST = 'ADJUST',
}

export interface CreateActivityDTO {
  inventoryId: string; // This will map to ingredientId
  type: ActivityType;
  quantity: number;
  notes?: string; // This will map to note
}

export interface UpdateActivityDTO extends Partial<CreateActivityDTO> {}
