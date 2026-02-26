export interface BillOrderData {
  header: {
    title: string;
    subtitle: string;
    date: string;
  };
  orderInfo: {
    orderId: string;
    customerName: string;
    table: string;
  };
  items: Array<{
    quantity: number;
    name: string;
    price: number;
    subtotal: number;
    addOn?: any;
  }>;
  payment: {
    subtotal: number;
    itemCount: number;
    tax: number;
    serviceFee: number;
    rounding: number;
    total: number;
  };
}

export class ThermalPrinterService {
  private readonly WIDTH = 384; // Standard thermal printer width (48mm * 8 dots/mm)
  private readonly LINE_HEIGHT = 25;
  private readonly PADDING = 20;

  async generateBillOrderImage(billData: BillOrderData): Promise<string> {
    try {
      // Generate text-based receipt
      const receiptText = this.generateTextReceipt(billData);

      // Create a simple base64 representation
      // In production, you'd want to use proper image generation with canvas or similar
      const canvas = this.createTextCanvas(receiptText);

      return canvas;
    } catch (error) {
      console.error('Error generating bill order image:', error);
      // Fallback to text-based approach
      return this.generateTextBasedReceipt(billData);
    }
  }

  private generateTextBasedReceipt(billData: BillOrderData): string {
    const lines = [
      '',
      this.centerText(billData.header.title),
      this.centerText(billData.header.subtitle),
      this.centerText(billData.header.date),
      '',
      '',
      `Order ID: ${billData.orderInfo.orderId}`,
      `Customer: ${billData.orderInfo.customerName}`,
      `Table: ${billData.orderInfo.table}`,
      '',
      '',
      'Items:',
      ...billData.items.map(item => {
        const itemText = `${item.quantity}x ${item.name}`;
        const priceText = `Rp. ${item.price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const padding = 35 - itemText.length;
        return `${itemText}${' '.repeat(Math.max(0, padding))}${priceText}`;
      }),
      '',
      '',
      `Subtotal (${billData.payment.itemCount} menu): Rp. ${billData.payment.subtotal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Tax: Rp. ${billData.payment.tax.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Service Fee: Rp. ${billData.payment.serviceFee.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Rounding: Rp. ${billData.payment.rounding.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      '',
      `Total: Rp. ${billData.payment.total.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      '',
    ];

    const text = lines.join('\n');

    // Create a simple base64 representation (this is a placeholder)
    // In production, you'd want to use proper image generation
    const buffer = Buffer.from(text, 'utf8');
    return buffer.toString('base64');
  }

  private generateTextReceipt(billData: BillOrderData): string {
    const lines = [
      '',
      this.centerText(billData.header.title),
      this.centerText(billData.header.subtitle),
      this.centerText(billData.header.date),
      '',
      '',
      `Order ID: ${billData.orderInfo.orderId}`,
      `Customer: ${billData.orderInfo.customerName}`,
      `Table: ${billData.orderInfo.table}`,
      '',
      '',
      'Items:',
      ...billData.items.map(item => {
        const itemText = `${item.quantity}x ${item.name}`;
        const priceText = `Rp. ${item.price.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const padding = 35 - itemText.length;
        return `${itemText}${' '.repeat(Math.max(0, padding))}${priceText}`;
      }),
      '',
      '',
      `Subtotal (${billData.payment.itemCount} menu): Rp. ${billData.payment.subtotal.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Tax: Rp. ${billData.payment.tax.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Service Fee: Rp. ${billData.payment.serviceFee.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Rounding: Rp. ${billData.payment.rounding.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      '',
      `Total: Rp. ${billData.payment.total.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      '',
    ];

    return lines.join('\n');
  }

  private createTextCanvas(text: string): string {
    // This is a simplified version - in production you'd use canvas or similar
    const lines = text.split('\n');
    const canvasText = lines.map(line => line.padEnd(40)).join('\n');

    // Convert to base64 (simplified approach)
    const buffer = Buffer.from(canvasText, 'utf8');
    return buffer.toString('base64');
  }

  private centerText(text: string): string {
    const width = 40; // Thermal printer width in characters
    const padding = Math.max(0, width - text.length);
    const leftPadding = Math.floor(padding / 2);
    const rightPadding = padding - leftPadding;
    return ' '.repeat(leftPadding) + text + ' '.repeat(rightPadding);
  }
}
