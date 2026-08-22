import { jsPDF } from 'jspdf';
import { prisma } from '@/lib/db/prisma';

/**
 * PDF Service
 * 
 * Generates PDF receipts for transactions with DEMO/TEST watermark.
 * Uses jsPDF for client-side PDF generation.
 */

export class PdfService {
  /**
   * Generates a PDF receipt for a transaction
   * 
   * @param transaction - The transaction data
   * @param user - The user data
   * @returns PDF as Blob
   */
  static async generateTransactionPdf(
    transaction: any,
    user: any = null
  ): Promise<Blob> {
    // Validate transaction
    if (!transaction || !transaction.id) {
      throw new Error('Invalid transaction data');
    }

    // Create new PDF document
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Set document properties
    pdf.setProperties({
      title: `Payment Receipt ${transaction.id}`,
      subject: 'Payment Transaction Receipt',
      author: 'George Banking App',
      creator: 'George Banking App',
    });

    // Add header
    this.addHeader(pdf);

    // Add document title
    this.addTitle(pdf, 'PAYMENT RECEIPT');

    // Add transaction ID
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Transaction ID: ${transaction.id}`, 15, 40);

    // Add date/time
    const date = new Date(transaction.transactionDate || transaction.createdAt);
    const formattedDate = date.toLocaleDateString('sk-SK');
    const formattedTime = date.toLocaleTimeString('sk-SK');
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Date: ${formattedDate} ${formattedTime}`, 15, 47);

    // Add separator
    pdf.setLineWidth(0.2);
    pdf.line(15, 55, 195, 55);

    // Add transaction details section
    this.addSectionTitle(pdf, 'TRANSACTION DETAILS', 62);

    const detailsY = 70;
    pdf.setFontSize(10);
    
    // Status
    this.addDetailRow(pdf, 'Status:', this.getStatusText(transaction.status), detailsY);
    
    // Type
    this.addDetailRow(pdf, 'Type:', transaction.type || 'OUTGOING', detailsY + 7);
    
    // Account
    if (transaction.account) {
      this.addDetailRow(
        pdf,
        'Source Account:',
        `${transaction.account.name} (${transaction.account.iban})`,
        detailsY + 14
      );
    }

    // Add separator
    pdf.line(15, detailsY + 30, 195, detailsY + 30);

    // Add recipient information section
    this.addSectionTitle(pdf, 'RECIPIENT INFORMATION', detailsY + 38);

    const recipientY = detailsY + 46;
    
    // Recipient name
    this.addDetailRow(pdf, 'Name:', transaction.recipientName || 'Not specified', recipientY);
    
    // IBAN
    this.addDetailRow(
      pdf,
      'IBAN:',
      this.formatIban(transaction.recipientIban || ''),
      recipientY + 7
    );
    
    // BIC
    this.addDetailRow(pdf, 'BIC/SWIFT:', transaction.recipientBic || 'Not specified', recipientY + 14);

    // Add separator
    pdf.line(15, recipientY + 30, 195, recipientY + 30);

    // Add amount information section
    this.addSectionTitle(pdf, 'AMOUNT INFORMATION', recipientY + 38);

    const amountY = recipientY + 46;
    
    // Amount
    this.addDetailRow(
      pdf,
      'Amount:',
      this.formatAmount(transaction.amount, transaction.currency),
      amountY
    );
    
    // Fee
    this.addDetailRow(
      pdf,
      'Fee:',
      this.formatAmount(transaction.fee || 0, transaction.currency),
      amountY + 7
    );
    
    // Total
    this.addDetailRow(
      pdf,
      'Total:',
      this.formatAmount(transaction.totalAmount || transaction.amount, transaction.currency),
      amountY + 14
    );
    
    // Currency
    this.addDetailRow(pdf, 'Currency:', transaction.currency || 'EUR', amountY + 21);

    // Add separator
    pdf.line(15, amountY + 35, 195, amountY + 35);

    // Add payment symbols section
    if (transaction.variableSymbol || transaction.constantSymbol || transaction.specificSymbol) {
      this.addSectionTitle(pdf, 'PAYMENT SYMBOLS', amountY + 43);

      const symbolsY = amountY + 51;
      
      if (transaction.variableSymbol) {
        this.addDetailRow(pdf, 'Variable Symbol (VS):', transaction.variableSymbol, symbolsY);
      }
      
      if (transaction.constantSymbol) {
        this.addDetailRow(pdf, 'Constant Symbol (KS):', transaction.constantSymbol, symbolsY + 7);
      }
      
      if (transaction.specificSymbol) {
        this.addDetailRow(pdf, 'Specific Symbol (ŠS):', transaction.specificSymbol, symbolsY + 14);
      }

      // Add separator
      pdf.line(15, symbolsY + 28, 195, symbolsY + 28);
    }

    // Add additional information section
    let additionalY = amountY + 43;
    if (transaction.variableSymbol || transaction.constantSymbol || transaction.specificSymbol) {
      additionalY = amountY + 86;
    }

    this.addSectionTitle(pdf, 'ADDITIONAL INFORMATION', additionalY);

    const additionalInfoY = additionalY + 8;
    
    // Payment reference
    if (transaction.paymentReference) {
      this.addDetailRow(pdf, 'Reference:', transaction.paymentReference, additionalInfoY);
    }
    
    // Note
    if (transaction.note) {
      this.addDetailRow(pdf, 'Note:', transaction.note, additionalInfoY + 7);
    }
    
    // Due date
    if (transaction.dueDate) {
      const dueDate = new Date(transaction.dueDate);
      this.addDetailRow(
        pdf,
        'Due Date:',
        dueDate.toLocaleDateString('sk-SK'),
        additionalInfoY + 14
      );
    }

    // QR Format
    if (transaction.qrFormat) {
      this.addDetailRow(
        pdf,
        'QR Format:',
        transaction.qrFormat,
        additionalInfoY + (transaction.note ? 21 : 14)
      );
    }

    // Add separator
    const footerY = additionalInfoY + (transaction.note ? 35 : 28);
    pdf.line(15, footerY, 195, footerY);

    // Add balance information
    this.addSectionTitle(pdf, 'BALANCE INFORMATION', footerY + 8);

    this.addDetailRow(
      pdf,
      'Balance Before:',
      this.formatAmount(transaction.balanceBefore, transaction.currency),
      footerY + 16
    );
    
    this.addDetailRow(
      pdf,
      'Balance After:',
      this.formatAmount(transaction.balanceAfter, transaction.currency),
      footerY + 23
    );

    // Add DEMO/TEST watermark
    this.addWatermark(pdf);

    // Add footer
    this.addFooter(pdf, footerY + 40);

    // Return PDF as Blob
    return new Blob([pdf.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Adds header with logo and app name
   */
  private static addHeader(pdf: jsPDF): void {
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GEORGE BANKING', 15, 15);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Internet Banking', 15, 20);
  }

  /**
   * Adds document title
   */
  private static addTitle(pdf: jsPDF, title: string): void {
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 105, 30, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
  }

  /**
   * Adds section title
   */
  private static addSectionTitle(pdf: jsPDF, title: string, y: number): void {
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, 15, y);
    pdf.setFont('helvetica', 'normal');
  }

  /**
   * Adds a detail row (label + value)
   */
  private static addDetailRow(pdf: jsPDF, label: string, value: string, y: number): void {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(label, 15, y);
    pdf.text(value, 60, y);
  }

  /**
   * Formats IBAN for display
   */
  private static formatIban(iban: string): string {
    if (!iban) return 'Not specified';
    return iban.replace(/(\w{4})(?=\w)/g, '$1 ');
  }

  /**
   * Formats amount for display
   */
  private static formatAmount(amount: number | null, currency: string = 'EUR'): string {
    if (amount === null || amount === undefined) return '0.00';
    return new Intl.NumberFormat('sk-SK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ` ${currency}`;
  }

  /**
   * Gets status text for display
   */
  private static getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      PENDING: 'Pending',
      COMPLETED: 'Completed',
      FAILED: 'Failed',
      CANCELLED: 'Cancelled',
      OUTGOING: 'Outgoing Payment',
      INCOMING: 'Incoming Payment',
      INTERNAL: 'Internal Transfer',
    };
    return statusMap[status.toUpperCase()] || status;
  }

  /**
   * Adds DEMO/TEST watermark
   */
  private static addWatermark(pdf: jsPDF): void {
    // Save current state
    pdf.saveGraphicsState();

    // Set watermark style
    pdf.setFontSize(40);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(200, 200, 200); // Light gray
    pdf.setTextRenderingMode(3); // Fill then stroke
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(200, 200, 200);

    // Calculate center position
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Rotate text 45 degrees
    pdf.rotate(45, pageWidth / 2, pageHeight / 2);
    
    // Draw watermark
    pdf.text('DEMO / TEST', pageWidth / 2, pageHeight / 2, {
      align: 'center',
      baseline: 'middle',
    });

    // Restore state
    pdf.restoreGraphicsState();
  }

  /**
   * Adds footer with disclaimer
   */
  private static addFooter(pdf: jsPDF, y: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    
    // Disclaimer
    pdf.text(
      'This is a demo receipt. No real transaction has been performed.',
      pageWidth / 2,
      pageHeight - 20,
      { align: 'center' }
    );
    
    // Page number
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, {
        align: 'center',
      });
    }
  }

  /**
   * Generates PDF for a specific transaction by ID
   * 
   * @param transactionId - The transaction ID
   * @param userId - The user ID (for authorization)
   * @returns Promise resolving to PDF Blob
   */
  static async generatePdfByTransactionId(
    transactionId: string,
    userId: string
  ): Promise<Blob> {
    // Fetch transaction with user
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        account: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.userId !== userId) {
      throw new Error('Unauthorized: You can only access your own transactions');
    }

    return this.generateTransactionPdf(transaction, transaction.user);
  }

  /**
   * Validates that the PDF is a valid PDF file
   * 
   * @param blob - The PDF Blob
   * @returns Promise resolving to true if valid
   */
  static async validatePdf(blob: Blob): Promise<boolean> {
    // Check MIME type
    if (blob.type !== 'application/pdf') {
      return false;
    }

    // Check file starts with PDF magic bytes
    const arrayBuffer = await blob.arrayBuffer();
    const uintArray = new Uint8Array(arrayBuffer);
    
    // PDF magic bytes: %PDF
    if (uintArray.length < 4) {
      return false;
    }
    
    return (
      uintArray[0] === 0x25 && // %
      uintArray[1] === 0x50 && // P
      uintArray[2] === 0x44 && // D
      uintArray[3] === 0x46    // F
    );
  }

  /**
   * Creates a filename for the PDF
   * 
   * @param transactionId - The transaction ID
   * @returns Filename string
   */
  static createFilename(transactionId: string): string {
    return `doklad-${transactionId}.pdf`;
  }
}

export default PdfService;
