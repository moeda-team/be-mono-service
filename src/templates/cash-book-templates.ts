import { format } from 'date-fns';

export interface CashBookTemplate {
  summary: {
    title: string;
    sections: {
      reportInfo: {
        title: string;
        fields: {
          reportDate: string;
          previousDate: string;
        };
      };
      performanceMetrics: {
        title: string;
        headers: string[];
        data: Array<{
          metric: string;
          current: string;
          previous: string;
          growth: string;
        }>;
      };
    };
    columnWidths: number[];
  };
  details: {
    title: string;
    headers: string[];
    columnWidths: number[];
  };
}

export const cashBookTemplate: CashBookTemplate = {
  summary: {
    title: 'CASH BOOK REPORT SUMMARY',
    sections: {
      reportInfo: {
        title: 'Cash Book Information',
        fields: {
          reportDate: 'Cash Book ID',
          previousDate: 'Status',
        },
      },
      performanceMetrics: {
        title: 'PERFORMANCE METRICS',
        headers: ['Metric', 'Value'],
        data: [
          {
            metric: 'Total Revenue',
            current: '', // Will be populated dynamically
            previous: '', // Not used for cash book
            growth: '', // Not used for cash book
          },
          {
            metric: 'Total Transactions',
            current: '',
            previous: '',
            growth: '',
          },
          {
            metric: 'Average Order Value',
            current: '',
            previous: '',
            growth: '',
          },
        ],
      },
    },
    columnWidths: [25, 20],
  },
  details: {
    title: 'TRANSACTION DETAILS',
    headers: [
      'Transaction Number',
      'Transaction Type',
      'Payment Method',
      'Customer Name',
      'Total Amount',
      'Status',
      'Transaction Date',
    ],
    columnWidths: [20, 15, 15, 25, 20, 12, 25],
  },
};

export const formatCashBookSummaryData = (
  template: CashBookTemplate,
  cashBookId: string,
  status: string,
  totalRevenue: number,
  totalTransactions: number,
  avgOrder: number,
) => {
  const summaryData = [
    [template.summary.title, ''],
    ['', ''],
    [template.summary.sections.reportInfo.title, ''],
    [template.summary.sections.reportInfo.fields.reportDate, cashBookId],
    [template.summary.sections.reportInfo.fields.previousDate, status],
    ['', ''],
    [template.summary.sections.performanceMetrics.title, ''],
    ['Metric', 'Value'],
    [
      template.summary.sections.performanceMetrics.data[0].metric,
      totalRevenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
    ],
    [template.summary.sections.performanceMetrics.data[1].metric, totalTransactions],
    [
      template.summary.sections.performanceMetrics.data[2].metric,
      Math.round(avgOrder).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
    ],
  ];

  return summaryData;
};

export const formatCashBookDetailsData = (template: CashBookTemplate, transactions: any[]) => {
  const detailsData = [
    [template.details.title, '', '', '', '', '', ''],
    ['', '', '', '', '', '', ''],
    template.details.headers,
    ...transactions.map(transaction => [
      transaction.number,
      transaction.transactionType,
      transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1),
      transaction.customerName || 'N/A',
      transaction.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1),
      format(new Date(transaction.createdAt), 'dd MMM yyyy HH:mm:ss'),
    ]),
  ];

  return detailsData;
};
