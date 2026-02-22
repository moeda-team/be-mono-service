export interface Discount {
  id: string;
  outletId: string;
  name: string;
  description?: string;
  type: string;
  discount: number;
  usage: number;
  maxUsage: number;
  allMenu: boolean;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDiscountDTO {
  outletId: string;
  name: string;
  description?: string;
  type: string;
  discount: number;
  maxUsage: number;
  allMenu: boolean;
  expiredAt: Date;
}

export interface UpdateDiscountDTO {
  name?: string;
  description?: string;
  type?: string;
  discount?: number;
  maxUsage?: number;
  allMenu?: boolean;
  expiredAt?: Date;
}
