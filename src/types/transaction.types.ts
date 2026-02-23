export interface CartItem {
  menuId: string;
  menuName: string;
  quantity: number;
  price: number;
  subTotal: number;
  addOn?: string;
  note?: string;
}

export interface CreateTransactionDTO {
  outletId: string;
  transactionType: string;
  tableId: string;
  paymentMethod: string;
  customerName?: string;
  cart: CartItem[];
  voucher?: string;
  additionalNote?: string;
  status?: string;
  tax?: number;
}

export interface TransactionQueryParams {
  outletId?: string;
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
  table?: number;
  month?: number;
  year?: number;
}

export type TransactionStatus =
  | 'pending'
  | 'preparation'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'complete';

export interface PaymentDTO {
  paymentType: string;
  transactionDetails: {
    orderId: string;
  };
}

export interface MidtransPayload {
  payment_type: string;
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  customer_details: {
    first_name: string;
    last_name: string;
  };
  item_details: Array<{
    id: string;
    price: number;
    quantity: number;
    name: string;
  }>;
  gopay?: {
    enable_callback: boolean;
    callback_url: string;
  };
  shopeePay?: {
    callback_url: string;
  };
}

export interface PaymentNotification {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  payment_type: string;
  transaction_time?: string;
  gross_amount?: string;
  currency?: string;
}
