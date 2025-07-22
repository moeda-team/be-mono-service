import nodemailer from 'nodemailer';
import { logger } from '../common/logger';
import { Decimal } from '@prisma/client/runtime/library';

export const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendLowStockAlertEmail(
  to: string,
  stocks: { name: string; qty: number | Decimal; minQty: number | Decimal; uom: string }[],
) {
  const html = generateHtmlTemplate(stocks);
  const plainText = stocks
    .map(
      stock =>
        `- ${stock.name} (Qty: ${stock.qty} ${stock.uom}, Min: ${stock.minQty} ${stock.uom})`,
    )
    .join('\n');

  try {
    await transporter.sendMail({
      from: `"Stock Alert" <${process.env.EMAIL_USER}>`,
      to,
      subject: '🚨 Low Stock Alert',
      text: `The following stocks are running low:\n\n${plainText}`,
      html,
    });
    return true;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
}

function generateHtmlTemplate(
  stocks: { name: string; qty: number | Decimal; minQty: number | Decimal; uom: string }[],
) {
  const rows = stocks
    .map(
      stock => `
        <tr>
          <td>${stock.name}</td>
          <td>${stock.qty} ${stock.uom}</td>
          <td>${stock.minQty} ${stock.uom}</td>
        </tr>`,
    )
    .join('');

  return `
  <html>
    <head>
      <style>
        body {
          font-family: 'Segoe UI', sans-serif;
          background-color: #f4f1ee;
          margin: 0;
          padding: 20px;
          color: #000000;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .header {
          background-color: #343434;
          color: #fff;
          padding: 24px;
          text-align: center;
        }
        .header h2 {
          margin: 0;
          font-weight: normal;
        }
        .content {
          padding: 20px 24px;
        }
        .content p {
          margin: 0 0 16px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          color: #3e3e3e;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #d9534f;
          color: #fff;
        }
        .footer {
          background-color: #f7f7f7;
          font-size: 12px;
          color: #777;
          text-align: center;
          padding: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>Café Stock Alert</h2>
        </div>
        <div class="content">
          <p>Hi Team,</p>
          <p>The following ingredients or supplies are running low and may need restocking soon:</p>
          <table>
            <tr>
              <th>Item</th>
              <th>Current Qty</th>
              <th>Minimum Required</th>
            </tr>
            ${rows}
          </table>
          <br>
          <p>Kindly arrange replenishment at your earliest convenience.</p>
        </div>
        <div class="footer">
          This is an automated message from your inventory system. Please do not reply directly.
        </div>
      </div>
    </body>
  </html>`;
}
