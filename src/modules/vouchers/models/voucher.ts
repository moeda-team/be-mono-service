export interface Voucher {
  id: string;
  name: string;
  type: string;
  discount: number;
  amount: number;
  maxAmount: number;
  expiredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVoucherDTO {
  outletId: string;
  name: string;
  type: string;
  discount: number;
  maxAmount: number;
  expiredAt: Date;
}
