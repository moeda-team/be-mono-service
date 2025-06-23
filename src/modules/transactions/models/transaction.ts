import { SubTransaction } from './subTransaction';

export interface Transaction {
  id: string;
  outletId: string;
  userId: string;
  number: string;
  transactionType: string;
  tableNumber: number;
  paymentNumber: string;
  paymentMethod: string;
  paymentMethodId: string;
  customerName: string;
  totalSubTransaction: number;
  subTotal: number;
  discount: number;
  serviceCharge: number;
  tax: number;
  rounding: number;
  total: number;
  additionalNote: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionDTO {
  outletId: string;
  transactionType: string;
  tableNumber: number;
  paymentMethod: string;
  customerName: string;
  discount: number;
  additionalNote: string;
  status: string;
  cart: SubTransaction[];
}
