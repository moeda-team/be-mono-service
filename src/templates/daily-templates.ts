import { format } from 'date-fns';

export interface ExcelTemplate {
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
          current: any;
          previous: any;
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

export const dailyReportTemplate: ExcelTemplate = {
  summary: {
    title: 'DAILY REPORT SUMMARY',
    sections: {
      reportInfo: {
        title: 'Report Information',
        fields: {
          reportDate: 'Report Date',
          previousDate: 'Previous Date',
        },
      },
      performanceMetrics: {
        title: 'PERFORMANCE METRICS',
        headers: ['Metric', 'Current Period', 'Previous Period', 'Growth %'],
        data: [
          {
            metric: 'Total Revenue',
            current: '', // Will be populated dynamically
            previous: '', // Will be populated dynamically
            growth: '', // Will be populated dynamically
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
    columnWidths: [25, 20, 20, 15],
  },
  details: {
    title: 'TRANSACTION DETAILS',
    headers: [
      'Order Name',
      'Description',
      'Quantity',
      'Total Amount',
      'Payment Method',
      'Status',
      'Order Status',
      'Transaction Date',
    ],
    columnWidths: [25, 40, 10, 20, 15, 12, 12, 25],
  },
};

export const formatSummaryData = (
  template: ExcelTemplate,
  date: string,
  yesterdayDate: string,
  totalRevenue: number,
  totalTransactions: number,
  avgOrder: number,
  yesterdayRevenue: number,
  yesterdayTransactionCount: number,
  yesterdayAvgOrder: number,
  revenueGrowth: number,
  transactionGrowth: number,
  avgOrderGrowth: number,
) => {
  const summaryData = [
    [template.summary.title, '', '', ''],
    ['', '', '', ''],
    [template.summary.sections.reportInfo.title, '', '', ''],
    [template.summary.sections.reportInfo.fields.reportDate, date, '', ''],
    [template.summary.sections.reportInfo.fields.previousDate, yesterdayDate, '', ''],
    ['', '', '', ''],
    [template.summary.sections.performanceMetrics.title, '', '', ''],
    template.summary.sections.performanceMetrics.headers,
    [
      template.summary.sections.performanceMetrics.data[0].metric,
      totalRevenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      yesterdayRevenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      `${Math.round(revenueGrowth * 10) / 10}%`,
    ],
    [
      template.summary.sections.performanceMetrics.data[1].metric,
      totalTransactions,
      yesterdayTransactionCount,
      `${Math.round(transactionGrowth * 10) / 10}%`,
    ],
    [
      template.summary.sections.performanceMetrics.data[2].metric,
      Math.round(avgOrder).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      Math.round(yesterdayAvgOrder).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      `${Math.round(avgOrderGrowth * 10) / 10}%`,
    ],
  ];

  return summaryData;
};

export const formatDetailsData = (template: ExcelTemplate, allDetails: any[]) => {
  const detailsData = [
    [template.details.title, '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', ''],
    template.details.headers,
    ...allDetails.map(detail => [
      detail.orderName,
      detail.description || 'N/A',
      detail.qty,
      detail.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      detail.paymentMethod.charAt(0).toUpperCase() + detail.paymentMethod.slice(1),
      detail.status.charAt(0).toUpperCase() + detail.status.slice(1),
      detail.statusOrder.charAt(0).toUpperCase() + detail.statusOrder.slice(1),
      format(new Date(detail.createdAt), 'dd MMM yyyy HH:mm:ss'),
    ]),
  ];

  return detailsData;
};
