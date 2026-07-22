import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const pushSubscription = pgTable('push_subscription', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expiresAt').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
    ipAddress: text('ipAddress'),
    userAgent: text('userAgent'),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('idx_session_userId').on(t.userId)]
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('accountId').notNull(),
    providerId: text('providerId').notNull(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('accessToken'),
    refreshToken: text('refreshToken'),
    idToken: text('idToken'),
    accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
    refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => [index('idx_account_userId').on(t.userId)]
)

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- Banking app tables ------------------------------------------------

export const bankAccount = pgTable(
  'bank_account',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    accountNumber: text('accountNumber').notNull().unique(),
    displayName: text('displayName'),
    accountType: text('accountType').notNull(), // 'checking', 'savings'
    balance: integer('balance').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
    isActive: boolean('isActive').notNull().default(true),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => [index('idx_bank_account_userId').on(t.userId)]
)

export const transaction = pgTable(
  'transaction',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    fromAccountId: text('fromAccountId'),
    toAccountId: text('toAccountId'),
    amount: integer('amount').notNull(),
    balanceBefore: integer('balanceBefore'),
    balanceAfter: integer('balanceAfter'),
    type: text('type').notNull(), // 'transfer', 'deposit', 'withdrawal'
    description: text('description'),
    pdfUrl: text('pdfUrl'),
    status: text('status').notNull().default('completed'), // 'pending', 'completed', 'failed'
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => [
    index('idx_transaction_userId').on(t.userId),
    index('idx_transaction_createdAt').on(t.createdAt),
  ]
)

export const assistantConversation = pgTable(
  'assistant_conversation',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    title: text('title').notNull().default('George asistent'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => [
    index('idx_assistant_conversation_userId').on(t.userId),
    index('idx_assistant_conversation_updatedAt').on(t.updatedAt),
  ]
)

export const assistantMessage = pgTable(
  'assistant_message',
  {
    id: text('id').primaryKey(),
    conversationId: text('conversationId').notNull(),
    userId: text('userId').notNull(),
    role: text('role').notNull(), // 'user', 'assistant', 'system', 'tool'
    content: text('content').notNull(),
    sources: text('sources'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (t) => [
    index('idx_assistant_message_conversationId').on(t.conversationId),
    index('idx_assistant_message_userId').on(t.userId),
    index('idx_assistant_message_createdAt').on(t.createdAt),
  ]
)

export const assistantRunLog = pgTable(
  'assistant_run_log',
  {
    id: text('id').primaryKey(),
    userId: text('userId').notNull(),
    status: text('status').notNull(),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    error: text('error'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (t) => [
    index('idx_assistant_run_log_userId').on(t.userId),
    index('idx_assistant_run_log_createdAt').on(t.createdAt),
  ]
)
