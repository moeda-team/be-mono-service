export interface DailyReportDetail {
  orderId: string;
  orderName: string;
  description?: string | null;
  qty: number;
  total: number;
  paymentMethod: 'cash' | 'debit' | 'qris' | string;
  status: 'pending' | 'cancelled' | 'completed' | string;
  createdAt: Date;
}

export interface DailyReportResponse {
  summary: {
    date: string;
    yesterdayDate: string;
    totalRevenue: number;
    totalTransactions: number;
    avgOrder: number;
    revenueGrowth: number;
    transactionGrowth: number;
    avgOrderGrowth: number;
  };
  details: DailyReportDetail[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
