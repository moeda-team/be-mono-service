import ExcelJS from 'exceljs';
import { format } from 'date-fns';

export interface ExcelJSCashBookTemplate {
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

export const cashBookTemplate: ExcelJSCashBookTemplate = {
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

export const createCashBookReportWorkbook = async (
  cashBookId: string,
  status: string,
  totalRevenue: number,
  totalTransactions: number,
  avgOrder: number,
  transactions: any[]
): Promise<ExcelJS.Workbook> => {
  const workbook = new ExcelJS.Workbook();
  
  // Create Summary worksheet
  const summarySheet = workbook.addWorksheet('Summary');
  
  // Set column widths
  cashBookTemplate.summary.columnWidths.forEach((width, index) => {
    summarySheet.getColumn(index + 1).width = width;
  });
  
  // Add title
  summarySheet.addRow([cashBookTemplate.summary.title, '']);
  summarySheet.addRow(['', '']);
  
  // Add cash book information
  summarySheet.addRow([cashBookTemplate.summary.sections.reportInfo.title, '']);
  summarySheet.addRow([cashBookTemplate.summary.sections.reportInfo.fields.reportDate, cashBookId]);
  summarySheet.addRow([cashBookTemplate.summary.sections.reportInfo.fields.previousDate, status]);
  summarySheet.addRow(['', '']);
  
  // Add performance metrics
  summarySheet.addRow([cashBookTemplate.summary.sections.performanceMetrics.title, '']);
  summarySheet.addRow(['Metric', 'Value']);
  
  // Add metrics data
  summarySheet.addRow([
    'Total Revenue',
    totalRevenue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
  ]);
  
  summarySheet.addRow(['Total Transactions', totalTransactions]);
  
  summarySheet.addRow([
    'Average Order Value',
    Math.round(avgOrder).toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
  ]);
  
  // Create Details worksheet
  const detailsSheet = workbook.addWorksheet('Details');
  
  // Set column widths
  cashBookTemplate.details.columnWidths.forEach((width, index) => {
    detailsSheet.getColumn(index + 1).width = width;
  });
  
  // Add title
  detailsSheet.addRow([cashBookTemplate.details.title, '', '', '', '', '', '']);
  detailsSheet.addRow(['', '', '', '', '', '', '']);
  
  // Add headers
  detailsSheet.addRow(cashBookTemplate.details.headers);
  
  // Add transaction data
  transactions.forEach(transaction => {
    detailsSheet.addRow([
      transaction.number,
      transaction.transactionType,
      transaction.paymentMethod.charAt(0).toUpperCase() + transaction.paymentMethod.slice(1),
      transaction.customerName || 'N/A',
      transaction.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' }),
      transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1),
      format(new Date(transaction.createdAt), 'dd MMM yyyy HH:mm:ss'),
    ]);
  });
  
  return workbook;
};
