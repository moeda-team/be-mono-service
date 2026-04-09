export interface DailyReportDetail {
  orderId: string;
  orderName: string;
  description?: string | null;
  qty: number;
  total: number;
  paymentMethod: 'cash' | 'debit' | 'qris' | string;
  status: 'pending' | 'cancelled' | 'completed' | string;
  statusOrder: 'pending' | 'cancelled' | 'completed' | string;
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

export interface SystemRevenueDetails {
  orderId: string;
  date: string;
  total: number;
  clientRevenue: number;
  systemRevenue: number;
  paymentMethod: 'cash' | 'debit' | 'qris' | string;
}

export interface SystemRevenueResponse {
  totalRevenue: number;
  clientRevenue: number;
  systemRevenue: number;
  totalTransactions: number;
  clientPercentage: number;
  systemPercentage: number;
  details: SystemRevenueDetails[];
}
