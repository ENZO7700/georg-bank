import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * GET /api/transactions/:id/pdf
 * 
 * Generates and returns a PDF receipt for a specific transaction.
 * 
 * Authentication: Required (via X-User-ID header for now)
 * Authorization: User must own the transaction
 * 
 * Response:
 * - Content-Type: application/pdf
 * - Filename: doklad-{transactionId}.pdf
 * - PDF with all transaction details and DEMO/TEST watermark
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('X-User-ID') || 'mock-user-id';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User ID is required' },
        { status: 401 }
      );
    }

    const { id: transactionId } = await params;
    
    if (!transactionId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Fetch transaction with account info
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            accountNumber: true,
            iban: true,
            currency: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if user owns the transaction
    if (transaction.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only access your own transactions' },
        { status: 403 }
      );
    }

    // Dynamically import jsPDF (it's a browser-only library)
    // In a real implementation, we'd use a server-side PDF library like pdfkit
    // For this demo, we'll use jsPDF which works in both environments
    const { jsPDF } = await import('jspdf');

    // Create PDF document
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
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('GEORGE BANKING', 15, 15);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Internet Banking', 15, 20);

    // Add document title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT RECEIPT', 105, 30, { align: 'center' });
    pdf.setFont('helvetica', 'normal');

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

    // Add transaction details
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TRANSACTION DETAILS', 15, 62);
    pdf.setFont('helvetica', 'normal');

    const detailsY = 70;
    pdf.setFontSize(10);
    
    // Helper function to add detail rows
    const addDetailRow = (label: string, value: string, y: number) => {
      pdf.text(label, 15, y);
      pdf.text(value, 60, y);
    };

    // Status
    addDetailRow('Status:', transaction.status || 'COMPLETED', detailsY);
    
    // Type
    addDetailRow('Type:', transaction.type || 'OUTGOING', detailsY + 7);
    
    // Account
    if (transaction.account) {
      addDetailRow(
        'Source Account:',
        `${transaction.account.name} (${formatIban(transaction.account.iban)})`,
        detailsY + 14
      );
    }

    // Add separator
    pdf.line(15, detailsY + 30, 195, detailsY + 30);

    // Add recipient information
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RECIPIENT INFORMATION', 15, detailsY + 38);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const recipientY = detailsY + 46;
    
    // Recipient name
    addDetailRow('Name:', transaction.recipientName || 'Not specified', recipientY);
    
    // IBAN
    addDetailRow('IBAN:', formatIban(transaction.recipientIban || ''), recipientY + 7);
    
    // BIC
    addDetailRow('BIC/SWIFT:', transaction.recipientBic || 'Not specified', recipientY + 14);

    // Add separator
    pdf.line(15, recipientY + 30, 195, recipientY + 30);

    // Add amount information
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AMOUNT INFORMATION', 15, recipientY + 38);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const amountY = recipientY + 46;
    
    // Amount
    addDetailRow('Amount:', formatAmount(transaction.amount, transaction.currency), amountY);
    
    // Fee
    addDetailRow('Fee:', formatAmount(transaction.fee || 0, transaction.currency), amountY + 7);
    
    // Total
    addDetailRow(
      'Total:',
      formatAmount(transaction.totalAmount || transaction.amount, transaction.currency),
      amountY + 14
    );
    
    // Currency
    addDetailRow('Currency:', transaction.currency || 'EUR', amountY + 21);

    // Add separator
    pdf.line(15, amountY + 35, 195, amountY + 35);

    // Add payment symbols if present
    let additionalY = amountY + 43;
    
    if (transaction.variableSymbol || transaction.constantSymbol || transaction.specificSymbol) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAYMENT SYMBOLS', 15, amountY + 43);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);

      const symbolsY = amountY + 51;
      
      if (transaction.variableSymbol) {
        addDetailRow('Variable Symbol (VS):', transaction.variableSymbol, symbolsY);
      }
      
      if (transaction.constantSymbol) {
        addDetailRow('Constant Symbol (KS):', transaction.constantSymbol, symbolsY + 7);
      }
      
      if (transaction.specificSymbol) {
        addDetailRow('Specific Symbol (ŠS):', transaction.specificSymbol, symbolsY + 14);
      }

      // Add separator
      pdf.line(15, symbolsY + 28, 195, symbolsY + 28);
      additionalY = symbolsY + 36;
    }

    // Add additional information
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ADDITIONAL INFORMATION', 15, additionalY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const additionalInfoY = additionalY + 8;
    
    // Payment reference
    if (transaction.paymentReference) {
      addDetailRow('Reference:', transaction.paymentReference, additionalInfoY);
    }
    
    // Note
    if (transaction.note) {
      addDetailRow('Note:', transaction.note, additionalInfoY + 7);
    }
    
    // Due date
    if (transaction.dueDate) {
      const dueDate = new Date(transaction.dueDate);
      addDetailRow('Due Date:', dueDate.toLocaleDateString('sk-SK'), additionalInfoY + 14);
    }

    // QR Format
    if (transaction.qrFormat) {
      addDetailRow('QR Format:', transaction.qrFormat, additionalInfoY + 21);
    }

    // Add separator
    const footerY = additionalInfoY + (transaction.note ? 35 : 28);
    pdf.line(15, footerY, 195, footerY);

    // Add balance information
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BALANCE INFORMATION', 15, footerY + 8);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    addDetailRow(
      'Balance Before:',
      formatAmount(transaction.balanceBefore, transaction.currency),
      footerY + 16
    );
    
    addDetailRow(
      'Balance After:',
      formatAmount(transaction.balanceAfter, transaction.currency),
      footerY + 23
    );

    // Add DEMO/TEST watermark
    addWatermark(pdf);

    // Add footer
    addFooter(pdf, footerY + 40);

    // Generate PDF bytes
    const pdfBytes = pdf.output('arraybuffer');

    // Create response with PDF
    const response = new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="doklad-${transaction.id}.pdf"`,
        'Content-Length': pdfBytes.byteLength.toString(),
      },
    });

    return response;

  } catch (error) {
    console.error('GET /api/transactions/:id/pdf error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to format IBAN for display
 */
function formatIban(iban: string): string {
  if (!iban) return 'Not specified';
  return iban.replace(/(\w{4})(?=\w)/g, '$1 ');
}

/**
 * Helper function to format amount for display
 */
function formatAmount(amount: number | null, currency: string = 'EUR'): string {
  if (amount === null || amount === undefined) return '0.00';
  return new Intl.NumberFormat('sk-SK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ` ${currency}`;
}

/**
 * Adds DEMO/TEST watermark to PDF
 */
function addWatermark(pdf: any): void {
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
 * Adds footer with disclaimer to PDF
 */
function addFooter(pdf: any, y: number): void {
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
