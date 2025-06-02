export interface Payment {
  paymentType: string;
  transactionDetails: transactionDetails;
  customExpiry: customExpiry;
  itemDetails: itemDetails[];
  customerDetails: customerDetails;
}

export interface PaymentDTO {
  paymentType: string;
  transactionDetails: transactionDetails;
}

export interface MidtransPayload {
  payment_type: string;
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  gopay?: {
    enable_callback: boolean;
    callback_url: string;
  };
  shopeePay?: {
    callback_url: string;
  };
  [key: string]: unknown;
}

export interface PaymentNotification {
  order_id: string;
  transaction_status: string;
  fraud_status: string;
  payment_type: string;
}

interface transactionDetails {
  orderId: string;
  grossAmount: number;
}

interface customExpiry {
  orderTime: string;
  expiryDuration: number;
  unit: 'minute' | 'hour' | 'day';
}

interface itemDetails {
  id: string;
  price: number;
  quantity: number;
  name: string;
}

interface customerDetails {
  name: string;
  email: string;
  phone: string;
}
