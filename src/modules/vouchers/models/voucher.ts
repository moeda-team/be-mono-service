export interface Voucher {
  id: string;
  name: string;
  description: string;
  type: string;
  discount: number;
  usage: number;
  maxUsage: number;
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
  expiredAt: Date;
}
