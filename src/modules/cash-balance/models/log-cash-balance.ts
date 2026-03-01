export interface LogCashBalance {
  id: string;
  cashBalanceId: string;
  outletId: string;
  userId?: string;
  type: string;
  amount: number;
  previousAmount?: number;
  description?: string;
  note?: string;
  createdAt: Date;
}
