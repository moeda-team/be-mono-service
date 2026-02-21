export interface VoucherMenu {
  voucherId: string;
  menuId: string;
  voucher?: {
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

export interface CreateVoucherMenuDTO {
  voucherId: string;
  menuId: string[];
}

export interface UpdateVoucherMenuDTO {
  voucherId?: string;
  menuId?: string[];
}
