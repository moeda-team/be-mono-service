import ExcelJS from 'exceljs';
import { format } from 'date-fns';

export interface ExcelJSTemplate {
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

export const dailyReportTemplate: ExcelJSTemplate = {
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
            current: '',
            previous: '',
            growth: '',
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

export const createDailyReportWorkbook = async (
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
  allDetails: any[],
): Promise<ExcelJS.Workbook> => {
  const workbook = new ExcelJS.Workbook();

  // Create Summary worksheet
  const summarySheet = workbook.addWorksheet('Summary');

  // Set column widths
  dailyReportTemplate.summary.columnWidths.forEach((width, index) => {
    summarySheet.getColumn(index + 1).width = width;
  });

  // Add title
  summarySheet.addRow([dailyReportTemplate.summary.title, '', '', '']);
  summarySheet.addRow(['', '', '', '']);

  // Add report information
  summarySheet.addRow([dailyReportTemplate.summary.sections.reportInfo.title, '', '', '']);
  summarySheet.addRow([
    dailyReportTemplate.summary.sections.reportInfo.fields.reportDate,
    date,
    '',
    '',
  ]);
  summarySheet.addRow([
    dailyReportTemplate.summary.sections.reportInfo.fields.previousDate,
    yesterdayDate,
    '',
    '',
  ]);
  summarySheet.addRow(['', '', '', '']);

  // Add performance metrics
  summarySheet.addRow([dailyReportTemplate.summary.sections.performanceMetrics.title, '', '', '']);
  summarySheet.addRow(dailyReportTemplate.summary.sections.performanceMetrics.headers);

  // Add metrics data
  summarySheet.addRow([
    'Total Revenue',
    totalRevenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
    yesterdayRevenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
    `${Math.round(revenueGrowth * 10) / 10}%`,
  ]);

  summarySheet.addRow([
    'Total Transactions',
    totalTransactions,
    yesterdayTransactionCount,
    `${Math.round(transactionGrowth * 10) / 10}%`,
  ]);

  summarySheet.addRow([
    'Average Order Value',
    Math.round(avgOrder).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
    Math.round(yesterdayAvgOrder).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
    `${Math.round(avgOrderGrowth * 10) / 10}%`,
  ]);

  // Create Details worksheet
  const detailsSheet = workbook.addWorksheet('Details');

  // Set column widths
  dailyReportTemplate.details.columnWidths.forEach((width, index) => {
    detailsSheet.getColumn(index + 1).width = width;
  });

  // Add title
  detailsSheet.addRow([dailyReportTemplate.details.title, '', '', '', '', '', '', '']);
  detailsSheet.addRow(['', '', '', '', '', '', '', '']);

  // Add headers
  detailsSheet.addRow(dailyReportTemplate.details.headers);

  // Add details data
  allDetails.forEach(detail => {
    detailsSheet.addRow([
      detail.orderName,
      detail.description || 'N/A',
      detail.qty,
      detail.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      detail.paymentMethod.charAt(0).toUpperCase() + detail.paymentMethod.slice(1),
      detail.status.charAt(0).toUpperCase() + detail.status.slice(1),
      detail.statusOrder.charAt(0).toUpperCase() + detail.statusOrder.slice(1),
      format(new Date(detail.createdAt), 'dd MMM yyyy HH:mm:ss'),
    ]);
  });

  return workbook;
};
