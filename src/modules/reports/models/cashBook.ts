export interface CashBookTransaction {
  id: string;
  number: string;
  transactionType: string;
  paymentMethod: string;
  customerName?: string | null;
  total: number;
  status: string;
  createdAt: Date;
}

export interface CashBookSummary {
  id: string;
  openAt: Date;
  closeAt?: Date | null;
  totalTransactions: number;
  totalRevenue: number;
  status: 'open' | 'closed';
  user?: {
    id: string;
    name: string;
  } | null;
}

export interface CashBookListResponse {
  cashBooks: CashBookSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
