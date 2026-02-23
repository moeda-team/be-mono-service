import { SubTransaction } from './subTransaction';

export interface Transaction {
  id: string;
  outletId: string;
  userId: string;
  number: string;
  transactionType: string;
  tableId: string;
  paymentNumber: string;
  paymentMethod: string;
  paymentMethodId: string;
  customerName: string;
  totalSubTransaction: number;
  subTotal: number;
  discount: number;
  tax: number;
  serviceCharge: number;
  rounding: number;
  total: number;
  additionalNote: string;
  voucher: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionDTO {
  outletId: string;
  transactionType: string;
  tableId: string;
  paymentMethod: string;
  customerName: string;
  discount: number;
  tax: number;
  additionalNote: string;
  voucher: string;
  status: string;
  cart: SubTransaction[];
}
