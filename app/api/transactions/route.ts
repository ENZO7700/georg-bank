import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { validatePaymentDraft, validateIban, normalizeIban } from '@/utils/qr';
import { PaymentDraft } from '@/types/payment';

/**
 * POST /api/transactions
 * 
 * Creates a new transaction with server-side validation.
 * 
 * Server-first approach:
 * - All validation happens on the server
 * - Atomic balance check and deduction in a single DB transaction
 * - Idempotency key prevents duplicate submissions
 * 
 * Request Body:
 * - accountId: Source account ID (required)
 * - recipientName: Recipient name (optional for QR payments)
 * - recipientIban: Recipient IBAN (required)
 * - recipientBic: Recipient BIC (optional)
 * - amount: Transaction amount (required, must be positive)
 * - currency: Currency code (optional, defaults to EUR)
 * - variableSymbol: Variable symbol (optional)
 * - constantSymbol: Constant symbol (optional)
 * - specificSymbol: Specific symbol (optional)
 * - note: Payment note (optional, max 140 chars)
 * - paymentReference: Payment reference (optional)
 * - dueDate: Due date (optional)
 * - qrFormat: QR format (optional)
 * - idempotencyKey: Idempotency key (optional)
 * 
 * Authentication: Required (via session)
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('X-User-ID') || 'mock-user-id';
    const idempotencyKey = request.headers.get('Idempotency-Key') || undefined;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User ID is required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.accountId) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'accountId is required' },
        { status: 400 }
      );
    }

    if (body.recipientIban === undefined || body.recipientIban === null || body.recipientIban === '') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'recipientIban is required' },
        { status: 400 }
      );
    }

    if (body.amount === undefined || body.amount === null || body.amount <= 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'amount is required and must be positive' },
        { status: 400 }
      );
    }

    // Normalize and validate IBAN
    const normalizedIban = normalizeIban(body.recipientIban);
    if (!normalizedIban) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Invalid IBAN format' },
        { status: 400 }
      );
    }

    const ibanValidation = validateIban(normalizedIban);
    if (!ibanValidation.valid) {
      return NextResponse.json(
        { error: 'Validation Error', message: ibanValidation.errors[0].message },
        { status: 400 }
      );
    }

    // Check if idempotency key was already used
    if (idempotencyKey) {
      const existingTransaction = await prisma.transaction.findUnique({
        where: { idempotencyKey },
      });

      if (existingTransaction) {
        return NextResponse.json(
          {
            success: true,
            data: existingTransaction,
            message: 'Transaction already processed (idempotency)',
          },
          { status: 200 }
        );
      }
    }

    // Verify user owns the source account
    const sourceAccount = await prisma.account.findUnique({
      where: { id: body.accountId },
    });

    if (!sourceAccount) {
      return NextResponse.json(
        { error: 'Not Found', message: 'Source account not found' },
        { status: 404 }
      );
    }

    if (sourceAccount.userId !== userId) {
      return NextResponse.json(
        { error: 'Forbidden', message: 'You can only make transactions from your own accounts' },
        { status: 403 }
      );
    }

    // Validate currency
    const currency = (body.currency as string)?.toUpperCase() || 'EUR';
    const supportedCurrencies = new Set(['EUR', 'SKK', 'USD', 'GBP', 'CZK', 'PLN', 'HUF']);
    if (!supportedCurrencies.has(currency) && !/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Unsupported currency code' },
        { status: 400 }
      );
    }

    // Validate account currency matches transaction currency
    if (sourceAccount.currency !== currency) {
      return NextResponse.json(
        {
          error: 'Validation Error',
          message: `Account currency (${sourceAccount.currency}) does not match transaction currency (${currency})`,
        },
        { status: 400 }
      );
    }

    // Check sufficient balance
    const amount = Number(body.amount);
    if (sourceAccount.balance < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient Funds',
          message: `Account balance (${sourceAccount.balance}) is less than transaction amount (${amount})`,
          balance: sourceAccount.balance,
          required: amount,
        },
        { status: 400 }
      );
    }

    // Validate note length
    if (body.note && body.note.length > 140) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Note must be 140 characters or less' },
        { status: 400 }
      );
    }

    // Validate symbol lengths
    if (body.variableSymbol && body.variableSymbol.length > 10) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Variable symbol must be 10 characters or less' },
        { status: 400 }
      );
    }

    if (body.constantSymbol && body.constantSymbol.length > 10) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Constant symbol must be 10 characters or less' },
        { status: 400 }
      );
    }

    if (body.specificSymbol && body.specificSymbol.length > 10) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Specific symbol must be 10 characters or less' },
        { status: 400 }
      );
    }

    // Perform atomic transaction
    const transaction = await prisma.$transaction(async (tx) => {
      // Lock the account for update to prevent race conditions
      const lockedAccount = await tx.account.findUnique({
        where: { id: body.accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedAccount) {
        throw new Error('Account not found');
      }

      // Re-check balance after locking
      if (lockedAccount.balance < amount) {
        throw new Error(`Insufficient balance: ${lockedAccount.balance} < ${amount}`);
      }

      // Create the transaction
      const newTransaction = await tx.transaction.create({
        data: {
          accountId: body.accountId,
          userId,
          type: 'OUTGOING',
          status: 'COMPLETED',
          
          // Recipient info
          recipientName: body.recipientName || null,
          recipientIban: normalizedIban,
          recipientBic: body.recipientBic ? body.recipientBic.replace(/\s+/g, '').toUpperCase() : null,
          
          // Payment symbols
          variableSymbol: body.variableSymbol || null,
          constantSymbol: body.constantSymbol || null,
          specificSymbol: body.specificSymbol || null,
          
          // Additional info
          note: body.note || null,
          paymentReference: body.paymentReference || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          qrFormat: body.qrFormat || null,
          
          // Amounts
          amount,
          currency,
          fee: 0, // No fee for now
          totalAmount: amount,
          
          // Balance info
          balanceBefore: lockedAccount.balance,
          balanceAfter: lockedAccount.balance - amount,
          
          // Metadata
          idempotencyKey,
          isDemo: true, // All transactions are demo for now
          description: body.recipientName 
            ? `Payment to ${body.recipientName}` 
            : 'Payment',
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: body.accountId },
        data: {
          balance: lockedAccount.balance - amount,
          updatedAt: new Date(),
        },
      });

      // Create transaction history entry
      await tx.transactionHistory.create({
        data: {
          transactionId: newTransaction.id,
          action: 'CREATE',
          changes: {
            amount,
            recipientIban: normalizedIban,
            balanceBefore: lockedAccount.balance,
            balanceAfter: lockedAccount.balance - amount,
          },
          userId,
        },
      });

      return newTransaction;
    });

    return NextResponse.json({
      success: true,
      data: transaction,
      message: 'Transaction completed successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/transactions error:', error);

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Handle specific error cases
    if (errorMessage.includes('Insufficient balance')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient Funds',
          message: errorMessage,
        },
        { status: 400 }
      );
    }

    if (errorMessage.includes('Account not found')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not Found',
          message: errorMessage,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/transactions
 * 
 * Returns transactions for the authenticated user.
 * 
 * Query Parameters:
 * - accountId: Filter by account ID (optional)
 * - type: Filter by transaction type (optional)
 * - status: Filter by transaction status (optional)
 * - limit: Maximum number of transactions (default: 50)
 * - offset: Offset for pagination (default: 0)
 * - startDate: Filter by start date (optional)
 * - endDate: Filter by end date (optional)
 * 
 * Authentication: Required (via session)
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Implement proper authentication
    const userId = request.headers.get('X-User-ID') || 'mock-user-id';
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User ID is required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId') || undefined;
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    // Validate query parameters
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      return NextResponse.json(
        { error: 'Invalid limit parameter', message: 'Limit must be between 1 and 1000' },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: 'Invalid offset parameter', message: 'Offset must be a non-negative integer' },
        { status: 400 }
      );
    }

    // Build where clause
    const where: {
      userId: string;
      accountId?: string;
      type?: string;
      status?: string;
      transactionDate?: {
        gte?: Date;
        lte?: Date;
      };
    } = { userId };

    if (accountId) {
      where.accountId = accountId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    // Fetch transactions with account info
    const transactions = await prisma.transaction.findMany({
      where,
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
      orderBy: [
        { transactionDate: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const total = await prisma.transaction.count({ where });

    return NextResponse.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + transactions.length < total,
      },
    });
  } catch (error) {
    console.error('GET /api/transactions error:', error);
    
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
