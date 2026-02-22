export interface DiscountMenu {
  discountId: string;
  menuId: string;
  discount?: {
    id: string;
    name: string;
    description?: string;
    type: string;
    discount: number;
    usage: number;
    maxUsage: number;
    allMenu: boolean;
    expiredAt: Date;
  };
  menu?: {
    id: string;
    name: string;
    price: number;
    categoryId: string;
  };
}

export interface CreateDiscountMenuDTO {
  discountId: string;
  menuId: string[];
}

export interface UpdateDiscountMenuDTO {
  discountId?: string;
  menuId?: string[];
}
