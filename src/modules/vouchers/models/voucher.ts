export interface Voucher {
  id: string;
  name: string;
  description: string;
  type: string;
  discount: number;
  usage: number;
  maxUsage: number;
  allMenu: boolean;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVoucherDTO {
  outletId: string;
  name: string;
  description: string;
  type: string;
  discount: number;
  maxUsage: number;
  allMenu: boolean;
  expiredAt: Date;
}
