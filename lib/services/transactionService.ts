import { prisma } from '@/lib/db/prisma';
import { PaymentDraft } from '@/types/payment';
import { normalizeIban } from '@/utils/qr';

/**
 * Transaction Service
 * 
 * Provides functionality for creating and managing transactions.
 * Implements server-first validation and atomic operations.
 */

export class TransactionService {
  /**
   * Creates a new transaction with full validation
   * 
   * @param userId - The user ID
   * @param accountId - The source account ID
   * @param draft - Payment draft from QR code or manual entry
   * @param options - Additional options (idempotency key, etc.)
   * @returns Promise resolving to the created transaction
   */
  static async createTransaction(
    userId: string,
    accountId: string,
    draft: PaymentDraft,
    options: {
      idempotencyKey?: string;
    } = {}
  ): Promise<{
    transaction: any;
    newBalance: number;
  }> {
    // Validate user owns the account
    const sourceAccount = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!sourceAccount) {
      throw new Error('Source account not found');
    }

    if (sourceAccount.userId !== userId) {
      throw new Error('You can only make transactions from your own accounts');
    }

    // Normalize and validate IBAN
    const normalizedIban = normalizeIban(draft.iban);
    if (!normalizedIban) {
      throw new Error('Invalid IBAN format');
    }

    // Validate amount
    const amount = draft.amount ?? 0;
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    // Validate currency
    const currency = draft.currency?.toUpperCase() || 'EUR';
    if (sourceAccount.currency !== currency) {
      throw new Error(
        `Account currency (${sourceAccount.currency}) does not match transaction currency (${currency})`
      );
    }

    // Check sufficient balance
    if (sourceAccount.balance < amount) {
      throw new Error(
        `Insufficient balance: ${sourceAccount.balance} < ${amount}`
      );
    }

    // Check idempotency key
    if (options.idempotencyKey) {
      const existing = await prisma.transaction.findUnique({
        where: { idempotencyKey: options.idempotencyKey },
      });

      if (existing) {
        throw new Error('Duplicate transaction (idempotency key already used)');
      }
    }

    // Perform atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // Lock the account for update
      const lockedAccount = await tx.account.findUnique({
        where: { id: accountId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedAccount) {
        throw new Error('Account not found');
      }

      // Re-check balance
      if (lockedAccount.balance < amount) {
        throw new Error(`Insufficient balance: ${lockedAccount.balance} < ${amount}`);
      }

      // Create the transaction
      const transaction = await tx.transaction.create({
        data: {
          accountId,
          userId,
          type: 'OUTGOING',
          status: 'COMPLETED',
          
          // Recipient info
          recipientName: draft.recipientName,
          recipientIban: normalizedIban,
          recipientBic: draft.bic,
          
          // Payment symbols
          variableSymbol: draft.variableSymbol,
          constantSymbol: draft.constantSymbol,
          specificSymbol: draft.specificSymbol,
          
          // Additional info
          note: draft.note,
          paymentReference: draft.paymentReference,
          dueDate: draft.dueDate,
          qrFormat: draft.qrFormat,
          
          // Amounts
          amount,
          currency,
          fee: 0,
          totalAmount: amount,
          
          // Balance info
          balanceBefore: lockedAccount.balance,
          balanceAfter: lockedAccount.balance - amount,
          
          // Metadata
          idempotencyKey: options.idempotencyKey,
          isDemo: true,
          description: draft.recipientName
            ? `Payment to ${draft.recipientName}`
            : 'Payment',
        },
      });

      // Update account balance
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: lockedAccount.balance - amount,
          updatedAt: new Date(),
        },
      });

      // Create transaction history
      await tx.transactionHistory.create({
        data: {
          transactionId: transaction.id,
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

      return {
        transaction,
        newBalance: lockedAccount.balance - amount,
      };
    });

    return result;
  }

  /**
   * Gets transactions for a user
   * 
   * @param userId - The user ID
   * @param options - Query options (filters, pagination)
   * @returns Promise resolving to transactions and pagination info
   */
  static async getTransactions(
    userId: string,
    options: {
      accountId?: string;
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    transactions: any[];
    total: number;
    hasMore: boolean;
  }> {
    const {
      accountId,
      type,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = options;

    // Validate parameters
    if (limit < 1 || limit > 1000) {
      throw new Error('Limit must be between 1 and 1000');
    }
    if (offset < 0) {
      throw new Error('Offset must be non-negative');
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
        where.transactionDate.gte = startDate;
      }
      if (endDate) {
        where.transactionDate.lte = endDate;
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

    // Get total count
    const total = await prisma.transaction.count({ where });

    return {
      transactions,
      total,
      hasMore: offset + transactions.length < total,
    };
  }

  /**
   * Gets a single transaction by ID
   * 
   * @param transactionId - The transaction ID
   * @param userId - The user ID (for authorization)
   * @returns Promise resolving to the transaction or null
   */
  static async getTransactionById(
    transactionId: string,
    userId: string
  ): Promise<any | null> {
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

    // Check if transaction exists and belongs to user
    if (!transaction || transaction.userId !== userId) {
      return null;
    }

    return transaction;
  }

  /**
   * Gets transaction history for a specific transaction
   * 
   * @param transactionId - The transaction ID
   * @param userId - The user ID (for authorization)
   * @returns Promise resolving to transaction history entries
   */
  static async getTransactionHistory(
    transactionId: string,
    userId: string
  ): Promise<any[]> {
    // First verify user has access to this transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: { userId: true },
    });

    if (!transaction || transaction.userId !== userId) {
      throw new Error('Transaction not found or not authorized');
    }

    return prisma.transactionHistory.findMany({
      where: { transactionId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Gets account balance and recent transactions
   * 
   * @param accountId - The account ID
   * @param userId - The user ID (for authorization)
   * @returns Promise resolving to account info with balance and recent transactions
   */
  static async getAccountSummary(
    accountId: string,
    userId: string
  ): Promise<{
    account: any;
    balance: number;
    recentTransactions: any[];
  }> {
    // Verify user owns the account
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: {
        transactions: {
          orderBy: { transactionDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!account || account.userId !== userId) {
      throw new Error('Account not found or not authorized');
    }

    return {
      account,
      balance: account.balance,
      recentTransactions: account.transactions,
    };
  }

  /**
   * Validates transaction data before submission
   * 
   * @param draft - Payment draft to validate
   * @param account - Source account
   * @returns Promise resolving to validation result
   */
  static async validateTransactionData(
    draft: PaymentDraft,
    account: any
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check IBAN
    const normalizedIban = normalizeIban(draft.iban);
    if (!normalizedIban) {
      errors.push('Invalid IBAN format');
    }

    // Check amount
    const amount = draft.amount ?? 0;
    if (amount <= 0) {
      errors.push('Amount must be positive');
    }

    // Check currency
    const currency = draft.currency?.toUpperCase() || 'EUR';
    if (account.currency !== currency) {
      errors.push(
        `Account currency (${account.currency}) does not match transaction currency (${currency})`
      );
    }

    // Check balance
    if (amount > 0 && account.balance < amount) {
      errors.push('Insufficient balance');
    }

    // Check note length
    if (draft.note && draft.note.length > 140) {
      errors.push('Note must be 140 characters or less');
    }

    // Check symbol lengths
    if (draft.variableSymbol && draft.variableSymbol.length > 10) {
      errors.push('Variable symbol must be 10 characters or less');
    }
    if (draft.constantSymbol && draft.constantSymbol.length > 10) {
      errors.push('Constant symbol must be 10 characters or less');
    }
    if (draft.specificSymbol && draft.specificSymbol.length > 10) {
      errors.push('Specific symbol must be 10 characters or less');
    }

    // Add warnings for missing optional fields
    if (!draft.recipientName) {
      warnings.push('Recipient name is recommended');
    }
    if (!draft.bic) {
      warnings.push('BIC is recommended for international payments');
    }
    if (draft.amount === null) {
      warnings.push('Amount was not specified in QR code');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

export default TransactionService;
